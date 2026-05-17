import { GameAction, GameState } from "../types";
import { CPUPlayer, getLegalActions } from "./cpu";

// Baseline CPU that picks a random legal action uniformly.
// Useful as a sanity floor for self-play evaluation: any
// non-trivial player should beat it consistently.
export class RandomLegalPlayer implements CPUPlayer {
    chooseAction(state: GameState): GameAction {
        const avail = getLegalActions(state);
        if (!avail.length)
            throw "RandomPlayer: no action available in this phase.";
        return avail[Math.floor(Math.random() * avail.length)];
    }
}
