import type { GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { DEFAULT_OPTIONS, getRolloutAction } from "./cpu";

// Baseline CPU that picks a random legal action with the same heuristic the
// MCTS rollouts uses. Useful as a sanity floor for self-play evaluation: any
// non-trivial player should beat it consistently.
export class RandomPlayer implements CPUPlayer {
    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    chooseAction(state: GameState): GameAction {
        const action = getRolloutAction(state, this.options);
        if (!action)
            throw "RandomPlayer: no action available in this phase.";
        return action;
    }
}
