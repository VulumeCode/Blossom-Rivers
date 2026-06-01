import type { Card, GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { gameReducer, setSimMode } from "../game";
import {
    DEFAULT_OPTIONS,
    getLegalActions,
    playerToMove,
    rolloutToEnd,
} from "./cpu";

// MO-ISMCTS with chance-observation nodes.
//
// Combines the two extensions from ./mo_ismcts.ts and ./ismcts_obs.ts:
//   * Per-player trees: each player p maintains their own tree T_p, with
//     stats accumulated in p's reward POV. Selection uses the active
//     player's own tree's UCB1; no sign-flip hack at opponent nodes.
//   * Chance-observation nodes: when the iteration hits a pre-`DRAW_CARD`
//     state, we apply the draw and descend through an *observation* child in
//     both trees, keyed by the drawn card's id. Each possible reveal lives in
//     its own subtree, so the subsequent `DROP_IN_RIVER` decision is no
//     longer averaged over cards.
//
// This is the variant that actually targets the strategy-fusion problem we
// identified: post-draw decisions are now conditioned on the *observed* card,
// not the (averaged-over-deck) action sequence. In our public-actions
// near-zero-sum game the MO half is mostly a cleaner restructuring; the obs
// half is where the real expected gain lives.

interface Node {
    visits: number;
    totalReward: number; // owning tree's player POV
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

function runIteration(roots: [Node, Node], rootState: GameState, options: Options): void {
    let state = rootState;
    const here: [Node, Node] = [roots[0], roots[1]];
    const paths: [Node[], Node[]] = [[roots[0]], [roots[1]]];
    let expanded = false;

    while (!expanded) {
        if (state.phase === "GAME_OVER" || state.phase === "ROUND_OVER") break;

        // Chance routing — mirror the observation hop into both trees.
        if (state.phase === "DEALING" && !state.drawnCard) {
            const drawAction: GameAction = { type: "DRAW_CARD" };
            state = gameReducer(state, drawAction);
            const drawn = state.drawnCard!;
            const key = drawObsKey(drawn);
            for (const pl of [0, 1] as const) {
                let entry = here[pl].children.get(key);
                if (!entry) {
                    entry = { action: drawAction, node: newNode() };
                    here[pl].children.set(key, entry);
                }
                entry.node.availability++;
                here[pl] = entry.node;
                paths[pl].push(here[pl]);
            }
            continue;
        }

        const legal = getLegalActions(state);
        if (legal.length === 0) break;
        const p = playerToMove(state);
        if (p !== 0 && p !== 1) break;
        const q = (1 - p) as 0 | 1;

        // Bump availability for legal children in both trees.
        for (const a of legal) {
            const key = actionKey(a);
            const pEntry = here[p].children.get(key);
            if (pEntry) pEntry.node.availability++;
            const qEntry = here[q].children.get(key);
            if (qEntry) qEntry.node.availability++;
        }

        // Untried in active player's tree → expand once.
        const untried = legal.filter(
            (a) => !here[p].children.has(actionKey(a)),
        );
        let chosen: GameAction;
        if (untried.length > 0) {
            chosen = untried[Math.floor(Math.random() * untried.length)];
            const key = actionKey(chosen);
            const pChild = newNode();
            pChild.availability = 1;
            here[p].children.set(key, { action: chosen, node: pChild });

            let qEntry = here[q].children.get(key);
            if (!qEntry) {
                qEntry = { action: chosen, node: newNode() };
                qEntry.node.availability = 1;
                here[q].children.set(key, qEntry);
            }

            state = gameReducer(state, chosen);
            here[p] = pChild;
            here[q] = qEntry.node;
            paths[0].push(here[0]);
            paths[1].push(here[1]);
            expanded = true;
            break;
        }

        // UCB1 selection in p's tree.
        let bestKey: string | null = null;
        let bestUCB = -Infinity;
        for (const a of legal) {
            const key = actionKey(a);
            const c = here[p].children.get(key)!.node;
            const exploit = c.totalReward / c.visits;
            const explore = C * Math.sqrt(Math.log(c.availability) / c.visits);
            const ucb = exploit + explore;
            if (ucb > bestUCB) {
                bestUCB = ucb;
                bestKey = key;
            }
        }
        const pEntry = here[p].children.get(bestKey!)!;
        chosen = pEntry.action;

        // Advance q's tree, creating a passthrough if missing.
        let qEntry = here[q].children.get(bestKey!);
        if (!qEntry) {
            qEntry = { action: chosen, node: newNode() };
            qEntry.node.availability = 1;
            here[q].children.set(bestKey!, qEntry);
        }

        state = gameReducer(state, chosen);
        here[p] = pEntry.node;
        here[q] = qEntry.node;
        paths[0].push(here[0]);
        paths[1].push(here[1]);
    }

    const terminal =
        state.phase === "GAME_OVER" || state.phase === "ROUND_OVER"
            ? state
            : rolloutToEnd(state, options);

    for (const pl of [0, 1] as const) {
        const reward = options.evaluateRollout(terminal, pl);
        for (const n of paths[pl]) {
            n.visits++;
            n.totalReward += reward;
        }
    }
}

export class MOISMCTSObsPlayer implements CPUPlayer {
    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    chooseAction(state: GameState): GameAction {
        const me = playerToMove(state);
        const sims =
            (this.budget as Record<string, number>)[state.phase] ??
            (() => {
                throw "No budget defined";
            })();

        const legal = getLegalActions(state);
        if (legal.length === 0) throw "No available actions.";
        if (legal.length === 1) return legal[0];

        const roots: [Node, Node] = [newNode(), newNode()];
        setSimMode(true);
        try {
            for (let i = 0; i < sims; i++) {
                const det = this.options.randomize(state, me);
                runIteration(roots, det, this.options);
            }
        } finally {
            setSimMode(false);
        }

        const myRoot = roots[me];
        let bestKey: string | null = null;
        let bestVisits = -1;
        let bestRate = 0;
        for (const [key, { node }] of myRoot.children) {
            if (node.visits > bestVisits) {
                bestVisits = node.visits;
                bestKey = key;
                bestRate = node.totalReward / Math.max(1, node.visits);
            }
        }
        if (!bestKey) throw "No move chosen.";
        console.log(
            "MO-ISMCTS+obs",
            state.phase,
            "visits",
            bestVisits,
            "rate",
            bestRate,
        );
        return myRoot.children.get(bestKey)!.action;
    }
}
