import type { GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { gameReducer, setSimMode } from "../game";
import {
    DEFAULT_OPTIONS,
    getLegalActions,
    playerToMove,
    rolloutToEnd,
} from "./cpu";

// Information Set Monte Carlo Tree Search (SO-ISMCTS).
//
// Reference: Cowling, Powley & Whitehouse, "Information Set Monte Carlo Tree
// Search" (https://www.aifactory.co.uk/newsletter/2013_01_reduce_burden.htm),
// and the algorithmic shape used by github.com/dbravender/mittmcts.
//
// Where flat MCTS-with-determinization throws away the tree on every iteration,
// ISMCTS keeps one tree shared across determinizations. A node is keyed by the
// sequence of *observed* actions from the root (an information-set path). When
// we descend into a sampled world, we only consider children whose actions are
// legal in *that* determinization; each child also tracks an "availability
// count" — how many iterations it was *available* to be chosen — and UCB1 uses
// that in place of the parent visit count.
//
// Without that adjustment, a sometimes-legal action looks artificially worse
// than an always-legal sibling: it accumulates visits only when its
// determinization happens to make it legal, so `ln(parent_visits)` would over-
// inflate its exploration term. `ln(availability)` instead measures "how often
// we got a fair shot at this child" — the right denominator for the bandit.

interface Node {
    visits: number;
    // Reward accumulator in the CPU's POV. Opponent nodes negate during
    // selection but the stored statistic stays root-centric.
    totalReward: number;
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

// Canonicalize an action so two structurally-equal actions hash to the same
// tree slot. Card identity is by `id`, which is stable across determinizations.
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

// Rewards are in [-1, 1], so the UCB1 exploration constant is doubled vs the
// textbook √2 (which assumes [0, 1] rewards).
const C = 1.41 * 2;

function runIteration(
    root: Node,
    rootState: GameState,
    cpuPlayer: number,
    options: Options,
): void {
    let node = root;
    let state = rootState;
    const path: Node[] = [root];

    // Selection + expansion. Each iteration adds at most one new node.
    let expanded = false;
    while (!expanded) {
        if (state.phase === "GAME_OVER" || state.phase === "ROUND_OVER") break;
        const legal = getLegalActions(state);
        if (legal.length === 0) break;

        // Bump availability for every legal child — including the one we end
        // up traversing — so the count reflects "I could have picked you".
        for (const a of legal) {
            const entry = node.children.get(actionKey(a));
            if (entry) entry.node.availability++;
        }

        const untried = legal.filter((a) => !node.children.has(actionKey(a)));
        if (untried.length > 0) {
            const a = untried[Math.floor(Math.random() * untried.length)];
            const child = newNode();
            // The new child was available this iteration too.
            child.availability = 1;
            node.children.set(actionKey(a), { action: a, node: child });
            state = gameReducer(state, a);
            path.push(child);
            expanded = true;
            break;
        }

        // All legal children exist — pick best by UCB1 with availability.
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

    // Rollout.
    const terminal = rolloutToEnd(state, options);
    const reward = options.evaluateRollout(terminal, cpuPlayer);

    // Backprop. All nodes on the path are updated with the same root-centric
    // reward; sign-flipping happens at selection time, not here.
    for (const n of path) {
        n.visits++;
        n.totalReward += reward;
    }
}

export class ISMCTSPlayer implements CPUPlayer {
    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    chooseAction(state: GameState): GameAction {
        const cpuPlayer = playerToMove(state);
        const sims =
            (this.options.budget as Record<string, number>)[state.phase] ??
            (() => {
                throw "No budget defined";
            })();

        // Single legal action — skip the search entirely.
        const legal = getLegalActions(state);
        if (legal.length === 0) throw "No available actions.";
        if (legal.length === 1) return legal[0];

        const root = newNode();
        setSimMode(true);
        try {
            for (let i = 0; i < sims; i++) {
                const det = this.options.randomize(state, cpuPlayer);
                runIteration(root, det, cpuPlayer, this.options);
            }
        } finally {
            setSimMode(false);
        }

        // Robust child: pick the most-visited action at the root. Visit count
        // is a more stable selector than reward rate (Cowling et al., §4.2).
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
        if (!bestKey) {
            throw "No move chosen."
        }
        console.log(
            "ISMCTS",
            state.phase,
            "visits",
            bestVisits,
            "rate",
            bestRate,
        );
        return root.children.get(bestKey)!.action;
    }
}
