import type { Card, GameAction, GameState } from "../types";
import { gameReducer, setSimMode } from "../game";
import {
    type CPUBudget,
    type CPUPlayer,
    DEFAULT_BUDGET,
    evaluateRolloutSigmoid,
    getLegalActions,
    playerToMove,
    randomizeHiddenCards,
    rolloutToEnd,
} from "./cpu";

// SO-ISMCTS with chance-observation nodes.
//
// The plain SO-ISMCTS in ./ismcts.ts keys tree edges by *action only*, so the
// post-`DRAW_CARD` child aggregates statistics across every possible card the
// determinization might have drawn. That's strategy fusion at a chance reveal:
// the right `DROP_IN_RIVER` choice depends on which card was drawn, but the
// tree only learns "average best river over all drawable cards."
//
// Fix: insert an *observation node* between the chance event and the next
// decision. When the iteration reaches a pre-draw state we apply DRAW_CARD
// against the determinization, then descend through a tree child keyed by the
// drawn card's id (`DRAW:<card-id>`). Each possible reveal lands on its own
// child, with its own subtree of `DROP_IN_RIVER` decisions conditioned on
// what was actually seen.
//
// Important: observation hops are *chance routing*, not decisions, and do
// NOT consume the iteration's expansion budget. We keep descending through
// them until a real decision-node selection or expansion takes place. The
// only chance event in this game's search horizon is the deck draw; new-round
// deals are outside `rolloutToEnd`'s scope.

interface Node {
    visits: number;
    totalReward: number; // CPU's POV
    availability: number;
    children: Map<string, { action: GameAction; node: Node }>;
}

function newNode(): Node {
    return {
        visits: 0,
        totalReward: 0,
        availability: 0,
        children: new Map(),
    };
}

function actionKey(a: GameAction): string {
    switch (a.type) {
        case "DRAW_CARD":
            // Unused in this variant — chance routing replaces it.
            return "DRAW";
        case "DROP_IN_RIVER":
            return `DROP:${a.riverIdx}`;
        case "CAPTURE_RIVER":
            return `CAP:${a.handCard?.id ?? "?"}:${a.riverIdx}`;
        case "DISCARD_TO_RIVER":
            return `DIS:${a.handCard?.id ?? "?"}:${a.riverIdx}`;
        case "CALL_STOP":
            return "STOP";
        case "CALL_KOIKOI":
            return "KOI";
        case "SELECT_HAND_CARD":
            return `SEL:${a.card.id}`;
        case "START_GAME":
            return "START";
        case "NEXT_ROUND":
            return "NEXT";
        case "CLEAR_MESSAGE":
            return "CLR";
    }
}

function drawObsKey(card: Card): string {
    return `DRAW:${card.id}`;
}

const C = 1.41 * 2;

function runIteration(
    root: Node,
    rootState: GameState,
    cpuPlayer: number,
): void {
    let node = root;
    let state = rootState;
    const path: Node[] = [root];
    let expanded = false;

    while (!expanded) {
        if (state.phase === "GAME_OVER" || state.phase === "ROUND_OVER") break;

        // Chance routing. Apply the draw and descend through the observation
        // child for whichever card the determinization put on top of the deck.
        if (state.phase === "DEALING" && !state.drawnCard) {
            const drawAction: GameAction = { type: "DRAW_CARD" };
            state = gameReducer(state, drawAction);
            const drawn = state.drawnCard!;
            const key = drawObsKey(drawn);
            let entry = node.children.get(key);
            if (!entry) {
                entry = { action: drawAction, node: newNode() };
                node.children.set(key, entry);
            }
            // Only one observation child is "legal" per iteration (the one
            // matching this determinization's draw). Bump its availability;
            // siblings represent counterfactual draws that didn't happen.
            entry.node.availability++;
            node = entry.node;
            path.push(node);
            continue;
        }

        const legal = getLegalActions(state);
        if (legal.length === 0) break;

        for (const a of legal) {
            const entry = node.children.get(actionKey(a));
            if (entry) entry.node.availability++;
        }

        const untried = legal.filter((a) => !node.children.has(actionKey(a)));
        if (untried.length > 0) {
            const a = untried[Math.floor(Math.random() * untried.length)];
            const child = newNode();
            child.availability = 1;
            node.children.set(actionKey(a), { action: a, node: child });
            state = gameReducer(state, a);
            node = child;
            path.push(node);
            expanded = true;
            break;
        }

        const toMove = playerToMove(state);
        const sign = toMove === cpuPlayer ? 1 : -1;
        let bestKey: string | null = null;
        let bestUCB = -Infinity;
        for (const a of legal) {
            const key = actionKey(a);
            const c = node.children.get(key)!.node;
            const exploit = (sign * c.totalReward) / c.visits;
            const explore = C * Math.sqrt(Math.log(c.availability) / c.visits);
            const ucb = exploit + explore;
            if (ucb > bestUCB) {
                bestUCB = ucb;
                bestKey = key;
            }
        }
        const next = node.children.get(bestKey!)!;
        state = gameReducer(state, next.action);
        node = next.node;
        path.push(node);
    }

    const terminal =
        state.phase === "GAME_OVER" || state.phase === "ROUND_OVER"
            ? state
            : rolloutToEnd(state);
    const reward = evaluateRolloutSigmoid(terminal, cpuPlayer);

    for (const n of path) {
        n.visits++;
        n.totalReward += reward;
    }
}

export class ISMCTSObsPlayer implements CPUPlayer {
    constructor(private readonly budget: CPUBudget = DEFAULT_BUDGET) {}

    chooseAction(state: GameState): GameAction {
        const cpuPlayer = playerToMove(state);
        const sims =
            (this.budget as Record<string, number>)[state.phase] ??
            (() => {
                throw "No budget defined";
            })();

        const legal = getLegalActions(state);
        if (legal.length === 0) throw "No available actions.";
        if (legal.length === 1) return legal[0];

        const root = newNode();
        setSimMode(true);
        try {
            for (let i = 0; i < sims; i++) {
                const det = randomizeHiddenCards(state, cpuPlayer);
                runIteration(root, det, cpuPlayer);
            }
        } finally {
            setSimMode(false);
        }

        let bestKey: string | null = null;
        let bestVisits = -1;
        let bestRate = 0;
        for (const [key, { node }] of root.children) {
            if (node.visits > bestVisits) {
                bestVisits = node.visits;
                bestKey = key;
                bestRate = node.totalReward / Math.max(1, node.visits);
            }
        }
        if (!bestKey) throw "No move chosen.";
        console.log(
            "ISMCTS+obs",
            state.phase,
            "visits",
            bestVisits,
            "rate",
            bestRate,
        );
        return root.children.get(bestKey)!.action;
    }
}
