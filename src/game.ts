import type {
    Card,
    GameAction,
    GameState,
    RoundScoreInfo,
} from "./types";
import { CARDS, isLightning, isRainMan, isWillow } from "./cards";
import { computeYaku, nonJunkPoints } from "./yaku";

export const TOTAL_ROUNDS = 3;

export function shuffle(arr: Card[]): Card[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function playerName(p: number): string {
    return p === 0 ? "You" : "CPU";
}

export function canCaptureRiver(handCard: Card, river: Card[]) {
    if (river.length === 0) return false;
    if (isLightning(handCard)) return true;
    const riverHasLightning = river.some(isLightning);
    const riverHasRainMan = river.some(isRainMan);
    if (riverHasLightning) return true;
    if (riverHasRainMan && !isWillow(handCard)) return false;
    return river.some((c) => c.month === handCard.month);
}

interface DealResult {
    deck: Card[];
    hands: [Card[], Card[]];
    rivers: [Card[], Card[], Card[]];
}

function dealNewRound(deckIn: Card[]): DealResult {
    const d = shuffle(deckIn);
    return {
        deck: d.slice(12),
        hands: [d.slice(0, 6), d.slice(6, 12)] as [Card[], Card[]],
        rivers: [[], [], []] as [Card[], Card[], Card[]],
    };
}

export function makeInitialState(): GameState {
    return {
        phase: "MENU",
        deck: [],
        hands: [[], []],
        captured: [[], []],
        rivers: [[], [], []],
        dealerIdx: 1,
        capturerIdx: 0,
        dealStep: 0,
        drawnCard: null,
        riversUsedThisTurn: [false, false, false],
        lightningRiver: null,
        selectedHandCard: null,
        koikoi: [false, false],
        scores: [0, 0],
        round: 1,
        turn: 1,
        drawMultiplier: 1,
        previousPoints: [0, 0],
        newYaku: [],
        yakuPlayer: -1,
        message: "",
        roundScoreInfo: null,
    };
}

function startRound(state: GameState): GameState {
    const deal = dealNewRound(CARDS);
    return {
        ...state,
        phase: "DEALING",
        deck: deal.deck,
        hands: deal.hands,
        captured: [[], []],
        rivers: deal.rivers,
        dealStep: 0,
        drawnCard: null,
        riversUsedThisTurn: [false, false, false],
        lightningRiver: null,
        selectedHandCard: null,
        koikoi: [false, false],
        previousPoints: [0, 0],
        newYaku: [],
        yakuPlayer: -1,
        turn: 1,
        message: "",
        roundScoreInfo: null,
    };
}

// Toggle to suppress action logging while CPU runs simulations.
let _simMode = false;
export function setSimMode(on: boolean): void {
    _simMode = on;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
    const go: () => GameState = () => {
        switch (action.type) {

            case "GO_TO_MENU": {
                return makeInitialState();
            }

            case "START_GAME": {
                return startRound({
                    ...state,
                    scores: [0, 0],
                    round: 1,
                    drawMultiplier: 1,
                });
            }

            case "DRAW_CARD": {
                if (state.phase !== "DEALING" || state.drawnCard)
                    throw "Can't draw a card right now.";
                if (state.deck.length === 0) throw "Can't draw from an empty deck.";
                const card = state.deck[0];
                return {
                    ...state,
                    deck: state.deck.slice(1),
                    drawnCard: card,
                    message:
                        state.dealerIdx === 0
                            ? `You drew ${card.name}. Choose a river.`
                            : `CPU draws a card...`,
                };
            }

            case "DROP_IN_RIVER": {
                if (state.phase !== "DEALING" || !state.drawnCard)
                    throw "Can't drop right now.";
                const { riverIdx } = action;
                if (state.riversUsedThisTurn[riverIdx])
                    throw "Can't drop in this river anymore.";

                const newRivers = state.rivers.map((r, i) =>
                    i === riverIdx ? [state.drawnCard!, ...r] : [...r],
                ) as [Card[], Card[], Card[]];
                const newUsed = [...state.riversUsedThisTurn] as [
                    boolean,
                    boolean,
                    boolean,
                ];
                newUsed[riverIdx] = true;

                const nextStep = state.dealStep + 1;

                let lightningRiver = state.lightningRiver;
                if (isLightning(state.drawnCard)) {
                    lightningRiver = riverIdx;
                }

                if (nextStep < 3) {
                    return {
                        ...state,
                        rivers: newRivers,
                        riversUsedThisTurn: newUsed,
                        drawnCard: null,
                        dealStep: nextStep,
                        lightningRiver,
                        message:
                            state.dealerIdx === 0
                                ? "Draw the next card."
                                : "CPU drops cards...",
                    };
                }

                if (lightningRiver !== null) {
                    return {
                        ...state,
                        rivers: newRivers,
                        riversUsedThisTurn: newUsed,
                        drawnCard: null,
                        dealStep: nextStep,
                        lightningRiver,
                        phase: "FORCED_CAPTURE",
                        message:
                            state.capturerIdx === 0
                                ? `Lightning in River ${lightningRiver + 1}! You must capture it.`
                                : `Lightning in River ${lightningRiver + 1}! CPU must capture it.`,
                    };
                }

                return {
                    ...state,
                    rivers: newRivers,
                    riversUsedThisTurn: newUsed,
                    drawnCard: null,
                    dealStep: nextStep,
                    lightningRiver,
                    phase: "CAPTURING",
                    message:
                        state.capturerIdx === 0
                            ? "Choose a card to play, then capture a river or discard."
                            : "CPU is deciding...",
                };
            }

            case "SELECT_HAND_CARD": {
                if (state.phase !== "CAPTURING" && state.phase !== "FORCED_CAPTURE")
                    throw "Can't select right now.";
                if (action.card == state.selectedHandCard) {
                    return { ...state, selectedHandCard: null };
                } else {
                    return { ...state, selectedHandCard: action.card };
                }
            }

            case "CAPTURE_RIVER": {
                const { riverIdx, handCard } = action;
                const who = state.capturerIdx;
                const card = handCard || state.selectedHandCard;
                if (!card) throw "Can't capture without a selected card.";
                const river = state.rivers[riverIdx];

                if (state.phase === "FORCED_CAPTURE") {
                    if (riverIdx !== state.lightningRiver)
                        throw "Must capture the lightning river.";
                } else {
                    if (!canCaptureRiver(card, river))
                        throw "Can't capture this river with selected card.";
                }

                const newHands = state.hands.map((h, i) =>
                    i === who ? h.filter((c) => c.id !== card.id) : [...h],
                ) as [Card[], Card[]];
                const capturedCards = [...river, card];
                const newCaptured = state.captured.map((cp, i) =>
                    i === who ? [...cp, ...capturedCards] : [...cp],
                ) as [Card[], Card[]];
                const newRivers = state.rivers.map((r, i) =>
                    i === riverIdx ? [] : [...r],
                ) as [Card[], Card[], Card[]];

                const yaku = computeYaku(newCaptured[who]);
                const currentNonJunk = nonJunkPoints(yaku.yakuList);
                const improved = currentNonJunk > state.previousPoints[who];

                if (improved) {
                    const newPrev = [...state.previousPoints] as [number, number];
                    newPrev[who] = currentNonJunk;
                    return {
                        ...state,
                        hands: newHands,
                        captured: newCaptured,
                        rivers: newRivers,
                        selectedHandCard: null,
                        lightningRiver: null,
                        phase: "YAKU_CHOICE",
                        yakuPlayer: who,
                        newYaku: yaku.yakuList.filter((y) => !y.isJunk),
                        previousPoints: newPrev,
                        message: "Yaku! Stop or Koi-Koi?",
                    };
                }

                return advanceTurn({
                    ...state,
                    hands: newHands,
                    captured: newCaptured,
                    rivers: newRivers,
                    selectedHandCard: null,
                    lightningRiver: null,
                });
            }

            case "DISCARD_TO_RIVER": {
                if (state.phase === "FORCED_CAPTURE")
                    throw "Can't discard during forced capture.";
                if (state.phase !== "CAPTURING") throw "Can't discard right now.";
                const { riverIdx, handCard } = action;
                const who = state.capturerIdx;
                const card = handCard || state.selectedHandCard;
                if (!card) throw "Must select a card to discard.";

                const newHands = state.hands.map((h, i) =>
                    i === who ? h.filter((c) => c.id !== card.id) : [...h],
                ) as [Card[], Card[]];
                const newRivers = state.rivers.map((r, i) =>
                    i === riverIdx ? [card, ...r] : [...r],
                ) as [Card[], Card[], Card[]];

                return advanceTurn({
                    ...state,
                    hands: newHands,
                    rivers: newRivers,
                    selectedHandCard: null,
                    lightningRiver: null,
                });
            }

            case "CALL_STOP": {
                if (state.phase !== "YAKU_CHOICE")
                    throw "Can't call stop right now.";
                const winner = state.yakuPlayer;
                const loser = 1 - winner;
                const yaku = computeYaku(state.captured[winner]);
                let pts = yaku.total;
                if (pts >= 7) pts *= 2;
                if (state.koikoi[loser]) pts *= 2;
                pts *= state.drawMultiplier;

                const newScores = [...state.scores] as [number, number];
                newScores[winner] += pts;

                const roundScoreInfo: RoundScoreInfo = {
                    winner,
                    yakuList: yaku.yakuList,
                    basePoints: yaku.total,
                    sevenBonus: yaku.total >= 7,
                    oppKoikoi: state.koikoi[loser],
                    drawMultiplier: state.drawMultiplier,
                    finalPoints: pts,
                };

                if (state.round >= TOTAL_ROUNDS) {
                    return {
                        ...state,
                        phase: "GAME_OVER",
                        scores: newScores,
                        roundScoreInfo,
                        message: `Round over! ${playerName(winner)} scored ${pts} points!`,
                    };
                }

                return {
                    ...state,
                    phase: "ROUND_OVER",
                    scores: newScores,
                    roundScoreInfo,
                    drawMultiplier: 1,
                    dealerIdx: loser,
                    capturerIdx: winner,
                    message: `Round over! ${playerName(winner)} scored ${pts} points!`,
                };
            }

            case "CALL_KOIKOI": {
                if (state.phase !== "YAKU_CHOICE")
                    throw "Can't call koikoi right now.";
                const who = state.yakuPlayer;
                if (state.hands[who].length == 0)
                    throw "Can't call koikoi with an empty hand.";
                const newKoikoi = [...state.koikoi] as [boolean, boolean];
                newKoikoi[who] = true;

                return advanceTurn({
                    ...state,
                    koikoi: newKoikoi,
                    message: `${playerName(who)} called Koi-Koi!`,
                });
            }

            case "NEXT_ROUND": {
                return startRound({
                    ...state,
                    round: state.round + 1,
                });
            }

            case "CLEAR_MESSAGE": {
                return { ...state, message: "" };
            }
        }
    }
    const result = go();
    if (!_simMode) console.log(result);
    return result;
}

function advanceTurn(state: GameState): GameState {
    const nextTurn = state.turn + 1;

    const newDealer = state.capturerIdx;
    const newCapturer = state.dealerIdx;

    if (state.hands[0].length === 0 && state.hands[1].length === 0) {
        const drawMultiplier = state.drawMultiplier * 2;
        const roundScoreInfo: RoundScoreInfo = {
            winner: -1,
            yakuList: [],
            basePoints: 0,
            finalPoints: 0,
            drawMultiplier,
        };
        if (state.round >= TOTAL_ROUNDS) {
            return {
                ...state,
                phase: "GAME_OVER",
                roundScoreInfo,
                drawMultiplier,
                message: "Round drawn! No points awarded.",
            };
        }
        return {
            ...state,
            phase: "ROUND_OVER",
            drawMultiplier,
            roundScoreInfo,
            dealerIdx: newDealer,
            capturerIdx: newCapturer,
            message: "Round drawn! Points doubled next round.",
        };
    }

    return {
        ...state,
        phase: "DEALING",
        dealerIdx: newDealer,
        capturerIdx: newCapturer,
        dealStep: 0,
        drawnCard: null,
        riversUsedThisTurn: [false, false, false],
        lightningRiver: null,
        selectedHandCard: null,
        turn: nextTurn,
        newYaku: [],
        yakuPlayer: -1,
        message:
            newDealer === 0
                ? "Your turn to deal. Draw a card."
                : "CPU is dealing...",
    };
}
