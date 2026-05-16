import { GameAction, GameState } from "../types";
import { CPUPlayer, getRolloutAction } from "./cpu";

// Baseline CPU that picks a random legal action — the same distribution the
// MCTS rollouts use. Useful as a sanity floor for self-play evaluation: any
// non-trivial player should beat it consistently.
export class RandomPlayer implements CPUPlayer {
    chooseAction(state: GameState): GameAction {
        const action = getRolloutAction(state);
        if (!action)
            throw "RandomPlayer: no action available in this phase.";
        return action;
    }
}
