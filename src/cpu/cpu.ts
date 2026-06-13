import type { Card, CardId, GameAction, GameState } from "../types";
import {
    canCaptureRiver,
    gameReducer,
    shuffle,
    TOTAL_ROUNDS,
} from "../game";

// Player 1 is the CPU. The interface is phase-agnostic — implementations
// decide what to do based on `state.phase`.
export interface CPUPlayer {
    chooseAction(state: GameState): GameAction;
}

// Phases at which a CPU implementation needs to make a real decision. Other
// phases (MENU / ROUND_OVER / GAME_OVER) never reach a player's `chooseAction`.
export type DecisionPhase =
    | "DEALING"
    | "CAPTURING"
    | "FORCED_CAPTURE"
    | "YAKU_CHOICE";

// Per-phase simulation budget. Players accept this in their constructor so
// callers (benchmarks, UI, self-play harnesses) can tune compute without
// touching the player code.
export type CPUBudget = Record<DecisionPhase, number>;

export const DEFAULT_BUDGET: CPUBudget = {
    DEALING: 2000,
    CAPTURING: 4000,
    FORCED_CAPTURE: 2000,
    YAKU_CHOICE: 2000,
};


export const DEFAULT_OPTIONS = {
    stop_bias: false,
    junk_bias: false,
    randomize: randomizeHiddenCards,
    budget: DEFAULT_BUDGET,
    evaluateRollout: evaluateRolloutSigmoid
};

export type Options = typeof DEFAULT_OPTIONS;

// Which seat is to act in this state — used by ISMCTS to flip the sign of
// reward at opponent nodes.
export function playerToMove(state: GameState): number {
    if (state.phase === "DEALING") return state.dealerIdx;
    if (state.phase === "CAPTURING" || state.phase === "FORCED_CAPTURE")
        return state.capturerIdx;
    if (state.phase === "YAKU_CHOICE") return state.yakuPlayer;
    return -1;
}

// Re-deal the opponent's hand and remaining deck from the union of unseen
// cards. Everything visible (the searcher's hand, rivers, captures) is kept.
export function randomizeHiddenCards(
    state: GameState,
    fromPlayer: number,
): GameState {
    const opp = 1 - fromPlayer;
    const hidden = [...state.deck, ...state.hands[opp]];
    const shuffled = shuffle(hidden);
    const oppSize = state.hands[opp].length;
    const newHands: [Card[], Card[]] = [state.hands[0], state.hands[1]];
    newHands[opp] = shuffled.splice(0, oppSize);
    const newDeck = shuffled.splice(0, state.deck.length);
    if (shuffled.length != 0) throw "Not all cards redistributed"
    return {
        ...state,
        hands: newHands,
        deck: newDeck,
    };
}

// Re-deal the opponent's hand & captures, and remaining deck from the union of unseen
// cards. Everything visible (the searcher's hand & captures, and rivers) is kept.
export function randomizeHiddenAndCapturedCards(
    state: GameState,
    fromPlayer: number,
): GameState {
    const opp = 1 - fromPlayer;
    const hidden = [...state.deck, ...state.hands[opp], ...state.captured[opp]];
    const shuffled = shuffle(hidden);
    const oppHandSize = state.hands[opp].length;
    const oppCapSize = state.captured[opp].length;
    const newHands: [Card[], Card[]] = [state.hands[0], state.hands[1]];
    const newCaptured: [Card[], Card[]] = [state.captured[0], state.captured[1]];
    newHands[opp] = shuffled.splice(0, oppHandSize);
    newCaptured[opp] = shuffled.splice(0, oppCapSize);
    const newDeck = shuffled.splice(0, state.deck.length);
    if (shuffled.length != 0) throw "Not all cards redistributed"
    return {
        ...state,
        hands: newHands,
        captured: newCaptured,
        deck: newDeck,
    };
}


type Category =
    | 'animal'
    | 'bdb'
    | 'blue'
    | 'bright'
    | 'grass'
    | 'junk'
    | 'poetry'
    | 'sake'
    | 'wbright'
    | 'wjunk'
    | 'wribbon'

const category: Record<CardId, Category> = {
    // 1: Pine
    '1-bright': 'bright',
    '1-ribbon': 'poetry',
    '1-junk-1': 'junk',
    '1-junk-2': 'junk',
    // 2: Plum
    '2-animal': 'animal',
    '2-ribbon': 'poetry',
    '2-junk-1': 'junk',
    '2-junk-2': 'junk',
    // 3: Cherry
    '3-bright': 'bright',
    '3-ribbon': 'poetry',
    '3-junk-1': 'junk',
    '3-junk-2': 'junk',
    // 4: Wisteria
    '4-animal': 'animal',
    '4-ribbon': 'grass',
    '4-junk-1': 'junk',
    '4-junk-2': 'junk',
    // 5: Iris
    '5-animal': 'animal',
    '5-ribbon': 'grass',
    '5-junk-1': 'junk',
    '5-junk-2': 'junk',
    // 6: Peony
    '6-animal': 'bdb',
    '6-ribbon': 'blue',
    '6-junk-1': 'junk',
    '6-junk-2': 'junk',
    // 7: Bush Clover
    '7-animal': 'bdb',
    '7-ribbon': 'grass',
    '7-junk-1': 'junk',
    '7-junk-2': 'junk',
    // 8: Pampas
    '8-bright': 'bright',
    '8-animal': 'animal',
    '8-junk-1': 'junk',
    '8-junk-2': 'junk',
    // 9: Chrysanthemum
    '9-animal': 'sake',
    '9-ribbon': 'blue',
    '9-junk-1': 'junk',
    '9-junk-2': 'junk',
    // 10: Maple
    '10-animal': 'bdb',
    '10-ribbon': 'blue',
    '10-junk-1': 'junk',
    '10-junk-2': 'junk',
    // 11: Willow
    '11-bright-rainman': 'wbright',
    '11-animal': 'animal',
    '11-ribbon': 'wribbon',
    '11-junk-lightning': 'wjunk',
    // 12: Paulownia
    '12-bright': 'bright',
    '12-junk-1': 'junk',
    '12-junk-2': 'junk',
    '12-junk-3': 'junk',
}

// Like randomizeHiddenCards (re-deal the opponent's hand and deck from the
// unseen pool), but additionally swap each of fromPlayer's own captured cards
// for a similar card — one in the same scoring category — drawn from that pool.
// The displaced captured card returns to the pool, so every category's totals
// are preserved while the exact identities of fromPlayer's captures are blurred.
export function randomizeHiddenAndAllCapturedCards(
    state: GameState,
    fromPlayer: number,
): GameState {
    const opp = 1 - fromPlayer;

    // Cards the searcher can't see: the deck plus the opponent's hand.
    const hidden = shuffle([...state.deck, ...state.hands[opp], ...state.captured[opp], ...state.captured[fromPlayer]]);

    // Swap each captured card for a same-category card from the hidden pool when
    // one exists, putting the captured card back into the pool in its place.
    const counts: Record<Category, number> = {
        'animal': 0,
        'bdb': 0,
        'blue': 0,
        'bright': 0,
        'grass': 0,
        'junk': 0,
        'poetry': 0,
        'sake': 0,
        'wbright': 0,
        'wjunk': 0,
        'wribbon': 0,
    }

    for (const card of state.captured[fromPlayer]) {
        counts[category[card.id]]++;
    }

    const restHidden: Card[] = [];
    const newOwnCaptured: Card[] = [];

    // Refill the captures with same-category cards drawn from the shuffled pool,
    // matching the original category distribution; everything else stays hidden.
    for (const card of hidden) {
        const cat = category[card.id];
        if (counts[cat] > 0) {
            counts[cat]--;
            newOwnCaptured.push(card);
        } else {
            restHidden.push(card);
        }
    }

    const oppHandSize = state.hands[opp].length;
    const oppCapSize = state.captured[opp].length;
    const newHands: [Card[], Card[]] = [state.hands[0], state.hands[1]];
    const newCaptured: [Card[], Card[]] = [state.captured[0], state.captured[1]];
    newHands[opp] = restHidden.splice(0, oppHandSize);
    newCaptured[opp] = restHidden.splice(0, oppCapSize);
    newCaptured[fromPlayer] = newOwnCaptured;
    const newDeck = restHidden.splice(0, state.deck.length);
    if (restHidden.length != 0) throw "Not all cards redistributed"
    return {
        ...state,
        hands: newHands,
        captured: newCaptured,
        deck: newDeck,
    };
}

// All legal actions in the given state, regardless of who is to move.
// Phases that don't require a decision (MENU, ROUND_OVER, GAME_OVER) return [].
export function getLegalActions(state: GameState): GameAction[] {
    if (state.phase === "DEALING") {
        if (!state.drawnCard) return [{ type: "DRAW_CARD" }];
        const avail = [0, 1, 2].filter((i) => !state.riversUsedThisTurn[i]);

        // If every remaining river is empty, the choice doesn't matter —
        // collapse to a single action so we don't waste sim budget on it.
        if (avail.every((river) => state.rivers[river].length === 0)) {
            return [{ type: "DROP_IN_RIVER", riverIdx: avail[0] }];
        }
        return avail.map((riverIdx) => ({ type: "DROP_IN_RIVER", riverIdx }));
    }
    if (state.phase === "CAPTURING") {
        const who = state.capturerIdx;
        const actions: GameAction[] = [];
        for (const card of state.hands[who]) {
            for (let ri = 0; ri < 3; ri++) {
                actions.push({
                    type: "DISCARD_TO_RIVER",
                    riverIdx: ri,
                    handCard: card,
                });
                if (
                    state.rivers[ri].length > 0 &&
                    canCaptureRiver(card, state.rivers[ri])
                ) {
                    actions.push({
                        type: "CAPTURE_RIVER",
                        riverIdx: ri,
                        handCard: card,
                    });
                }
            }
        }
        return actions;
    }
    if (state.phase === "FORCED_CAPTURE") {
        const ri = state.lightningRiver!;
        return state.hands[state.capturerIdx].map((card) => ({
            type: "CAPTURE_RIVER" as const,
            riverIdx: ri,
            handCard: card,
        }));
    }
    if (state.phase === "YAKU_CHOICE") {
        const actions: GameAction[] = [{ type: "CALL_STOP" }];
        if (state.hands[state.yakuPlayer].length > 0) {
            actions.push({ type: "CALL_KOIKOI" });
        }
        return actions;
    }
    return [];
}

// Cheap random action for rollouts — biased toward capturing when available.
export function getRolloutAction(state: GameState, options = DEFAULT_OPTIONS): GameAction {
    if (state.phase === "GAME_OVER") throw "Already GAME_OVER";
    if (state.phase === "ROUND_OVER") throw "Already ROUND_OVER";
    if (state.phase === "DEALING") {
        if (!state.drawnCard) return { type: "DRAW_CARD" };
        const avail = [0, 1, 2].filter((i) => !state.riversUsedThisTurn[i]);
        if (avail.length === 0) throw "No rivers to deal to.";
        return {
            type: "DROP_IN_RIVER",
            riverIdx: avail[Math.floor(Math.random() * avail.length)],
        };
    }
    if (state.phase === "CAPTURING") {
        const who = state.capturerIdx;
        const hand = state.hands[who];
        if (hand.length === 0) throw "Nothing to capture with.";
        const caps: GameAction[] = [];
        for (const card of hand) {
            for (let ri = 0; ri < 3; ri++) {
                if (
                    state.rivers[ri].length > 0 &&
                    canCaptureRiver(card, state.rivers[ri])
                ) {
                    caps.push({
                        type: "CAPTURE_RIVER",
                        riverIdx: ri,
                        handCard: card,
                    });
                }
            }
        }
        if (caps.length > 0) {
            return caps[Math.floor(Math.random() * caps.length)];
        }

        let avail: Card[]
        if (options.junk_bias) {
            const hand_junk = hand.filter((c) => c.type === "junk");
            avail = hand_junk.length > 0 ? hand_junk : hand;
        } else {
            avail = hand;
        }
        const card = avail[Math.floor(Math.random() * avail.length)];
        return {
            type: "DISCARD_TO_RIVER",
            riverIdx: Math.floor(Math.random() * 3),
            handCard: card,
        };
    }
    if (state.phase === "FORCED_CAPTURE") {
        const hand = state.hands[state.capturerIdx];
        if (hand.length === 0) throw "Nothing to capture with.";
        return {
            type: "CAPTURE_RIVER",
            riverIdx: state.lightningRiver!,
            handCard: hand[Math.floor(Math.random() * hand.length)],
        };
    }
    if (state.phase === "YAKU_CHOICE") {
        if (state.hands[state.yakuPlayer].length == 0) {
            return { type: "CALL_STOP" };
        } else {
            let r: number;
            if (options.stop_bias) {
                const next = gameReducer(state, { type: "CALL_STOP" });
                const diff = next.scores[state.yakuPlayer] - next.scores[1 - state.yakuPlayer];
                r = (diff / (1 + Math.abs(diff))) / 2 + .5;
            }
            else {
                r = 0.5;
            }
            return Math.random() < r
                ? { type: "CALL_STOP" }
                : { type: "CALL_KOIKOI" };
        }
    }
    throw "Nothing to do.";
}



// Roll out random actions until the current round (or game) ends.
// Inter-round variance is folded into `evaluateRolloutSigmoid` rather than dealing
// fresh rounds inside the rollout itself.
export function rolloutToEnd(state: GameState, options = DEFAULT_OPTIONS): GameState {
    let s = state;
    for (
        let i = 0;
        i < 500;
        i++
    ) {
        if (s.phase === "GAME_OVER" || s.phase === "ROUND_OVER") return s;
        const action = getRolloutAction(s, options);
        if (!action) throw "No rollout action available.";
        const next = gameReducer(s, action);
        if (next === s) throw "No change.";
        s = next;
    }
    throw "Rollout didn't end.";
}

// Std dev of per-round score differential — tune via self-play.
const ROUND_SIGMA = 5;

// Normal CDF (Abramowitz & Stegun 26.2.17).
function normCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
    const p =
        d *
        t *
        (0.31938153 +
            t *
                (-0.356563782 +
                    t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z >= 0 ? 1 - p : p;
}

// Score a terminal rollout state from `forPlayer`'s POV, in [-1, 1].
// At GAME_OVER: sigmoid of score diff (ties punished).
// At ROUND_OVER (rounds left): Gaussian P(win match) — naturally rewards
// widening variance when behind and tightening it when ahead.
export function evaluateRolloutSigmoid(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    const diff = state.scores[me] - state.scores[them];
    if (state.phase === "GAME_OVER") {
        return diff === 0 ? -1 : diff / (1 + Math.abs(diff));
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    const mult = state.drawMultiplier;
    const totalStd = ROUND_SIGMA * Math.sqrt(mult * mult + roundsLeft - 1);
    const z = diff / totalStd;
    const cdf = 2 * normCdf(z) - 1;
    return cdf
}

export function evaluateRolloutSigmoidS(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    const diff = (state.scores[me] - state.scores[them]) / 40.;
    if (state.phase === "GAME_OVER") {
        return diff === 0 ? -1 : diff / (1 + Math.abs(diff));
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    const mult = state.drawMultiplier;
    const totalStd = ROUND_SIGMA * Math.sqrt(mult * mult + roundsLeft - 1);
    const z = diff / totalStd;
    const cdf = 2 * normCdf(z) - 1;
    return cdf
}

export function evaluateRolloutSigmoidSW(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    let diff = (state.scores[me] - state.scores[them]);
    if (diff > 0) {
        diff = diff / (40. / state.scores[me])
    }
    if (state.phase === "GAME_OVER") {
        return diff === 0 ? -1 : diff / (1 + Math.abs(diff));
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    const mult = state.drawMultiplier;
    const totalStd = ROUND_SIGMA * Math.sqrt(mult * mult + roundsLeft - 1);
    const z = diff / totalStd;
    const cdf = 2 * normCdf(z) - 1;
    return cdf
}

export function evaluateRolloutCut(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    const diff = state.scores[me] - state.scores[them];
    if (state.phase === "GAME_OVER") {
        return diff > 0 ? 1 : -1;
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    const mult = state.drawMultiplier;
    const totalStd = ROUND_SIGMA * Math.sqrt(mult * mult + roundsLeft - 1);
    const OPTIMISM_SIGMAS = 1; // how favourable a future swing we're willing to bank on
    return diff + OPTIMISM_SIGMAS * totalStd > 0 ? 1 : -1;
}


export function evaluateRolloutDiv(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    const diff = state.scores[me] - state.scores[them];
    if (state.phase === "GAME_OVER") {
        return diff / 70;
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    if (diff > 0) {
        return diff / 70;
    }
    if ((diff + 7) > 0 && state.drawMultiplier) {
        return (diff + 7) / 70;
    }
    return diff / 70;
}




export function evaluateRolloutInv(state: GameState, forPlayer: number): number {
    const me = forPlayer;
    const them = 1 - forPlayer;
    const diff = state.scores[me] - state.scores[them];
    if (state.phase === "GAME_OVER") {
        return diff > 0 ? 1 / diff : -1;
    }
    const roundsLeft = TOTAL_ROUNDS - state.round;
    const mult = state.drawMultiplier;
    const totalStd = ROUND_SIGMA * Math.sqrt(mult * mult + roundsLeft - 1);
    const OPTIMISM_SIGMAS = 1; // how favourable a future swing we're willing to bank on
    return diff + OPTIMISM_SIGMAS * totalStd > 0 ? 1 / diff : -1;
}
