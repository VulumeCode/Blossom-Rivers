import type { GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { gameReducer, setSimMode } from "../game";
import {
    DEFAULT_OPTIONS,
    getLegalActions,
    playerToMove,
    rolloutToEnd,
} from "./cpu";


export class SimpleMCTSPlayer implements CPUPlayer {

    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }


    // Flat MCTS with determinization: each iteration draws a fresh assignment of
    // the opponent's hand and the deck order, then plays a single root action
    // followed by a random rollout to round/game end.
    //
    // "Flat" because the tree is one level deep — only the root's child actions
    // are evaluated. That makes it simple and surprisingly strong for one-shot
    // decisions, but it can't reason about how its action shapes the rest of the
    // trajectory beyond what a random rollout captures.
    mctsChooseAction(
        state: GameState,
        simCount: number,
        cpuPlayer: number,
    ): GameAction {
        const actions = getLegalActions(state);
        if (actions.length === 0) throw "No available actions.";
        if (actions.length === 1) return actions[0];

        const wins = new Float64Array(actions.length);
        const visits = new Int32Array(actions.length);
        // Rewards are in [-1, 1] (twice the usual [0, 1]), so C is doubled.
        const C = 1.41 * 2;

        setSimMode(true);
        try {
            for (let sim = 0; sim < simCount; sim++) {
                const detState = this.options.randomize(state, cpuPlayer);

                let idx: number;
                if (sim < actions.length) {
                    // Round-robin first pass guarantees every action is sampled.
                    idx = sim;
                } else {
                    const logTotal = Math.log(sim);
                    let bestUCB = -Infinity;
                    idx = 0;
                    for (let i = 0; i < actions.length; i++) {
                        const ucb =
                            wins[i] / visits[i] +
                            C * Math.sqrt(logTotal / visits[i]);
                        if (ucb > bestUCB) {
                            bestUCB = ucb;
                            idx = i;
                        }
                    }
                }

                const next = gameReducer(detState, actions[idx]);
                // Rollout.
                const terminal = rolloutToEnd(next, this.options);
                const reward = this.options.evaluateRollout(terminal, cpuPlayer);

                wins[idx] += reward;
                visits[idx]++;
            }
        } finally {
            setSimMode(false);
        }

        let bestIdx = 0,
            bestRate = -Infinity;
        for (let i = 0; i < actions.length; i++) {
            if (visits[i] > 0) {
                const rate = wins[i] / visits[i];
                if (rate > bestRate) {
                    bestRate = rate;
                    bestIdx = i;
                }
            }
        }
        console.log("SimpleMCTS bestRate", state.phase, bestRate);
        return actions[bestIdx];
    }

    chooseAction(state: GameState): GameAction {
        const cpuPlayer = playerToMove(state);
        const sims =
            (this.options.budget as Record<string, number>)[state.phase] ??
            (() => {
                throw "No budget defined";
            })();
        return this.mctsChooseAction(state, sims, cpuPlayer);
    }
}
