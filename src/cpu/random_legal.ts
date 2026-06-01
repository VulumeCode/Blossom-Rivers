import type { GameAction, GameState } from "../types";
import type { CPUPlayer, Options } from "./cpu";
import { DEFAULT_OPTIONS, getLegalActions } from "./cpu";

// Baseline CPU that picks a random legal action uniformly.
// Useful as a sanity floor for self-play evaluation: any
// non-trivial player should beat it consistently.
export class RandomLegalPlayer implements CPUPlayer {
    options: Options

    constructor(options?: Partial<Options>) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    chooseAction(state: GameState): GameAction {
        const avail = getLegalActions(state);
        if (!avail.length)
            throw "RandomPlayer: no action available in this phase.";
        return avail[Math.floor(Math.random() * avail.length)];
    }
}
