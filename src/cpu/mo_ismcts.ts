import type { GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { gameReducer, setSimMode } from "../game";
import {
    DEFAULT_OPTIONS,
    getLegalActions,
    playerToMove,
    rolloutToEnd,
} from "./cpu";

// Multi-Observer ISMCTS (MO-ISMCTS).
//
// Reference: Cowling, Powley & Whitehouse (2012), §3.2.
//
// Where SO-ISMCTS uses one tree and flips the sign of reward at opponent
// nodes, MO-ISMCTS keeps a separate tree per player. Every iteration walks
// both trees in lockstep along the path of observations: when the active
// player p decides, p selects from p's *own* tree via UCB1; the non-active
// player q's tree merely advances to the child for the observed action
// (creating a passthrough node if missing). At backprop each tree records
// the reward from its own owner's POV — no sign juggling.
//
// Note on this game: every action is public and `evaluateRolloutSigmoid` is almost
// strictly zero-sum (the tie penalty is the only asymmetry), so MO-ISMCTS is
// numerically near-equivalent to SO-ISMCTS here. Specifically: opp's MO-stats
// are the negation of CPU's SO-stats edge-for-edge, and UCB picks the same
// action either way. We still split it out because:
//   * Cleaner mental model: each tree maximizes its owner's reward without
//     any sign hack, which matches the literature and avoids edge cases when
//     the reward function isn't strictly zero-sum.
//   * It does *not* fix the chance-reveal strategy fusion at `DRAW_CARD` —
//     that requires adding observation nodes keyed by the drawn card. MO is
//     the natural framework for layering that on later.

interface Node {
    visits: number;
    // Reward accumulator in the *owning tree's* player POV.
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
        default:
            throw "Not for CPU"
    }
}

// Rewards are in [-1, 1], so the UCB1 exploration constant is doubled.
const C = 1.41 * 2;

function runIteration(roots: [Node, Node], rootState: GameState, options: Options): void {
    let state = rootState;
    // Current node in each player's tree.
    const here: [Node, Node] = [roots[0], roots[1]];
    const paths: [Node[], Node[]] = [[roots[0]], [roots[1]]];
    let expanded = false;

    while (!expanded) {
        if (state.phase === "GAME_OVER" || state.phase === "ROUND_OVER") break;
        const legal = getLegalActions(state);
        if (legal.length === 0) break;
        const p = playerToMove(state);
        if (p !== 0 && p !== 1) break;
        const q = (1 - p) as 0 | 1;

        // Bump availability for legal children in BOTH trees. The active
        // player's tree uses this for UCB at the current node. The non-active
        // tree's count is incremented in lockstep so its semantics stay
        // consistent for whenever its own owner is the decider elsewhere.
        for (const a of legal) {
            const key = actionKey(a);
            const pEntry = here[p].children.get(key);
            if (pEntry) pEntry.node.availability++;
            const qEntry = here[q].children.get(key);
            if (qEntry) qEntry.node.availability++;
        }

        // Untried in active player's tree → expand once and break out.
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

            // Mirror into q's tree (create passthrough if q hasn't seen it).
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

        // All legal children exist in p's tree — UCB1 selection in p's tree.
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

        // q's tree may lag p's in expansion shape (e.g. q hasn't yet had an
        // iteration that descended this branch). Create the passthrough node
        // on demand so q has somewhere to be while p makes its decisions.
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

    // Rollout from current state (or use it directly if already terminal).
    const terminal =
        state.phase === "GAME_OVER" || state.phase === "ROUND_OVER"
            ? state
            : rolloutToEnd(state, options);

    // Backprop each tree with its own owner's POV reward.
    for (const pl of [0, 1] as const) {
        const reward = options.evaluateRollout(terminal, pl);
        for (const n of paths[pl]) {
            n.visits++;
            n.totalReward += reward;
        }
    }
}

export class MOISMCTSPlayer implements CPUPlayer {
    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    chooseAction(state: GameState): GameAction {
        const me = playerToMove(state);
        const sims =
            (this.options.budget as Record<string, number>)[state.phase] ??
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

        // Robust child from the calling player's *own* tree.
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
            "MO-ISMCTS",
            state.phase,
            "visits",
            bestVisits,
            "rate",
            bestRate,
        );
        return myRoot.children.get(bestKey)!.action;
    }
}
