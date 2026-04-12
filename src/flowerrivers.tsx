import { useEffect, useReducer, useState } from 'preact/hooks';
import { type CSSProperties } from 'preact';
import {
    Card,
    RiverHighlightType,
    RoundScoreInfo,
    GameState,
    GameAction,
} from './types';
import { images } from './cardImages';
import { CARDS, isLightning, isRainMan, isWillow } from './cards';
import { computeYaku, nonJunkPoints, } from './yaku';

// --- GAME HELPERS ---
function shuffle(arr: Card[]): Card[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function canCaptureRiver(handCard: Card, river: Card[]) {
    if (river.length === 0) return false;
    // Lightning from hand is wild — captures any river
    if (isLightning(handCard)) return true;
    const riverHasLightning = river.some(isLightning);
    const riverHasRainMan = river.some(isRainMan);
    // Lightning in river overrides Rain Man — any card can capture
    if (riverHasLightning) return true;
    // Rain Man blocks non-Willow captures
    if (riverHasRainMan && !isWillow(handCard)) return false;
    // Standard month match
    return river.some(c => c.month === handCard.month);
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

// --- CONSTANTS ---
const TOTAL_ROUNDS = 3;

// Phases: MENU, DEALING, CAPTURING, FORCED_CAPTURE, YAKU_CHOICE, ROUND_OVER, GAME_OVER
function makeInitialState(): GameState {
    return {
        phase: 'MENU',
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
        koikoiCounts: [0, 0],
        scores: [0, 0],
        round: 1,
        turn: 1,
        drawMultiplier: 1,
        previousPoints: [0, 0],
        newYaku: [],
        yakuPlayer: -1,
        message: '',
        aiAction: null,
        roundScoreInfo: null,
    };
}

function startRound(state: GameState): GameState {
    const deal = dealNewRound(CARDS);
    return {
        ...state,
        phase: 'DEALING',
        deck: deal.deck,
        hands: deal.hands,
        captured: [[], []],
        rivers: deal.rivers,
        dealStep: 0,
        drawnCard: null,
        riversUsedThisTurn: [false, false, false],
        lightningRiver: null,
        selectedHandCard: null,
        koikoiCounts: [0, 0],
        previousPoints: [0, 0],
        newYaku: [],
        yakuPlayer: -1,
        turn: 1,
        message: '',
        aiAction: null,
        roundScoreInfo: null,
    };
}

let _simMode = false;

function gameReducer(state: GameState, action: GameAction): GameState {
    if (!_simMode) console.log(action)
    switch (action.type) {
        case 'START_GAME': {
            const s = makeInitialState();
            return startRound({ ...s, scores: [0, 0], round: 1, drawMultiplier: 1 });
        }

        case 'DRAW_CARD': {
            if (state.phase !== 'DEALING' || state.drawnCard) return state;
            if (state.deck.length === 0) return state;
            const card = state.deck[0];
            return {
                ...state,
                deck: state.deck.slice(1),
                drawnCard: card,
                message: state.dealerIdx === 0
                    ? `You drew ${card.name}. Choose a river.`
                    : `AI draws a card...`,
            };
        }

        case 'DROP_IN_RIVER': {
            if (state.phase !== 'DEALING' || !state.drawnCard) return state;
            const { riverIdx } = action;
            if (state.riversUsedThisTurn[riverIdx]) return state;

            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [...r, state.drawnCard!] : [...r]
            ) as [Card[], Card[], Card[]];
            const newUsed = [...state.riversUsedThisTurn] as [boolean, boolean, boolean];
            newUsed[riverIdx] = true;

            const nextStep = state.dealStep + 1;

            // Check if lightning was dropped
            let lightningRiver = state.lightningRiver;
            if (isLightning(state.drawnCard)) {
                lightningRiver = riverIdx;
            }

            if (nextStep < 3) {
                // More cards to deal
                return {
                    ...state,
                    rivers: newRivers,
                    riversUsedThisTurn: newUsed,
                    drawnCard: null,
                    dealStep: nextStep,
                    lightningRiver,
                    message: state.dealerIdx === 0
                        ? 'Draw the next card.'
                        : 'AI drops cards...',
                };
            }

            // All 3 dealt — move to capture phase
            // If lightning was dealt, capturer must capture that river
            if (lightningRiver !== null) {
                return {
                    ...state,
                    rivers: newRivers,
                    riversUsedThisTurn: newUsed,
                    drawnCard: null,
                    dealStep: nextStep,
                    lightningRiver,
                    phase: 'FORCED_CAPTURE',
                    message: state.capturerIdx === 0
                        ? `Lightning in River ${lightningRiver + 1}! You must capture it.`
                        : `Lightning in River ${lightningRiver + 1}! AI must capture it.`,
                };
            }

            return {
                ...state,
                rivers: newRivers,
                riversUsedThisTurn: newUsed,
                drawnCard: null,
                dealStep: nextStep,
                lightningRiver,
                phase: 'CAPTURING',
                message: state.capturerIdx === 0
                    ? 'Choose a card to play, then capture a river or discard.'
                    : 'AI is deciding...',
            };
        }

        case 'SELECT_HAND_CARD': {
            if (state.phase !== 'CAPTURING' && state.phase !== 'FORCED_CAPTURE') return state;
            if (action.card == state.selectedHandCard) {
                return { ...state, selectedHandCard: null };
            } else {
                return { ...state, selectedHandCard: action.card };
            }
        }

        case 'CAPTURE_RIVER': {
            const { riverIdx, handCard } = action;
            const who = state.capturerIdx;
            const card = handCard || state.selectedHandCard;
            if (!card) return state;
            const river = state.rivers[riverIdx];

            // For forced capture, any card works (lightning in river matches all)
            if (state.phase === 'FORCED_CAPTURE') {
                if (riverIdx !== state.lightningRiver) return state;
            } else {
                if (!canCaptureRiver(card, river)) return state;
            }

            // Remove card from hand
            const newHands = state.hands.map((h, i) =>
                i === who ? h.filter(c => c.id !== card.id) : [...h]
            ) as [Card[], Card[]];
            // Add river cards + hand card to captured
            const capturedCards = [...river, card];
            const newCaptured = state.captured.map((cp, i) =>
                i === who ? [...cp, ...capturedCards] : [...cp]
            ) as [Card[], Card[]];
            // Clear the river
            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [] : [...r]
            ) as [Card[], Card[], Card[]];

            // Check yaku — trigger choice if non-junk points increased
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
                    phase: 'YAKU_CHOICE',
                    yakuPlayer: who,
                    newYaku: yaku.yakuList.filter(y => !y.isJunk),
                    previousPoints: newPrev,
                    message: who === 0
                        ? `Yaku! ${yaku.yakuList.filter(y => !y.isJunk).map(y => y.name).join(', ')} (${currentNonJunk} pts). Stop or Koi-Koi?`
                        : `AI has ${currentNonJunk} pts: ${yaku.yakuList.filter(y => !y.isJunk).map(y => y.name).join(', ')}`,
                };
            }

            // No point increase — advance turn
            return advanceTurn({
                ...state,
                hands: newHands,
                captured: newCaptured,
                rivers: newRivers,
                selectedHandCard: null,
                lightningRiver: null,
            });
        }

        case 'DISCARD_TO_RIVER': {
            if (state.phase === 'FORCED_CAPTURE') return state; // can't discard during forced capture
            if (state.phase !== 'CAPTURING') return state;
            const { riverIdx, handCard } = action;
            const who = state.capturerIdx;
            const card = handCard || state.selectedHandCard;
            if (!card) return state;

            const newHands = state.hands.map((h, i) =>
                i === who ? h.filter(c => c.id !== card.id) : [...h]
            ) as [Card[], Card[]];
            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [...r, card] : [...r]
            ) as [Card[], Card[], Card[]];

            return advanceTurn({
                ...state,
                hands: newHands,
                rivers: newRivers,
                selectedHandCard: null,
                lightningRiver: null,
            });
        }

        case 'CALL_STOP': {
            if (state.phase !== 'YAKU_CHOICE') return state;
            const winner = state.yakuPlayer;
            const loser = 1 - winner;
            const yaku = computeYaku(state.captured[winner]);
            let pts = yaku.total;
            // 7+ doubling
            if (pts >= 7) pts *= 2;
            // Opponent's koikoi count doubles winner's points
            const oppKoikoi = state.koikoiCounts[loser];
            pts *= Math.pow(2, oppKoikoi);
            // Draw multiplier
            pts *= state.drawMultiplier;

            const newScores = [...state.scores] as [number, number];
            newScores[winner] += pts;

            const roundScoreInfo: RoundScoreInfo = {
                winner,
                yakuList: yaku.yakuList,
                basePoints: yaku.total,
                sevenBonus: yaku.total >= 7,
                oppKoikoi,
                drawMultiplier: state.drawMultiplier,
                finalPoints: pts,
            };

            if (state.round >= TOTAL_ROUNDS) {
                return {
                    ...state,
                    phase: 'GAME_OVER',
                    scores: newScores,
                    roundScoreInfo,
                    message: `Round over! ${winner === 0 ? 'You' : 'AI'} scored ${pts} points!`,
                };
            }

            return {
                ...state,
                phase: 'ROUND_OVER',
                scores: newScores,
                roundScoreInfo,
                drawMultiplier: 1,
                dealerIdx: loser,
                capturerIdx: winner,
                message: `Round over! ${winner === 0 ? 'You' : 'AI'} scored ${pts} points!`,
            };
        }

        case 'CALL_KOIKOI': {
            if (state.phase !== 'YAKU_CHOICE') return state;
            const who = state.yakuPlayer;
            const newKoikoi = [...state.koikoiCounts] as [number, number];
            newKoikoi[who] += 1;

            return advanceTurn({
                ...state,
                koikoiCounts: newKoikoi,
                message: `${who === 0 ? 'You' : 'AI'} called Koi-Koi!`,
            });
        }

        case 'NEXT_ROUND': {
            return startRound({
                ...state,
                round: state.round + 1,
            });
        }

        case 'SET_AI_ACTION': {
            return { ...state, aiAction: action.payload };
        }

        case 'CLEAR_MESSAGE': {
            return { ...state, message: '' };
        }

        default:
            return state;
    }
}

function advanceTurn(state: GameState): GameState {
    const nextTurn = state.turn + 1;

    // Swap roles
    const newDealer = state.capturerIdx;
    const newCapturer = state.dealerIdx;

    // Check if round is over (both players out of cards)
    if (state.hands[0].length === 0 && state.hands[1].length === 0) {
        // Draw — no one stopped
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
                phase: 'GAME_OVER',
                roundScoreInfo,
                drawMultiplier,
                message: 'Round drawn! No points awarded.',
            };
        }
        return {
            ...state,
            phase: 'ROUND_OVER',
            drawMultiplier,
            roundScoreInfo,
            dealerIdx: newDealer,
            capturerIdx: newCapturer,
            message: 'Round drawn! Points doubled next round.',
        };
    }


    return {
        ...state,
        phase: 'DEALING',
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
        message: newDealer === 0
            ? 'Your turn to deal. Draw a card.'
            : 'AI is dealing...',
    };
}

// --- AI LOGIC (Monte Carlo Tree Search) ---

// Randomize cards unknown to AI (player 1): opponent's hand and the deck
function randomizeHiddenCards(state: GameState): GameState {
    const hidden = [...state.deck, ...state.hands[0]];
    const shuffled = shuffle(hidden);
    const oppSize = state.hands[0].length;
    return {
        ...state,
        hands: [shuffled.slice(0, oppSize), state.hands[1]] as [Card[], Card[]],
        deck: shuffled.slice(oppSize),
    };
}

// Enumerate valid actions for AI (player 1) in the given state
function getAIActions(state: GameState): GameAction[] {
    if (state.phase === 'DEALING' && state.dealerIdx === 1 && state.drawnCard !== null) {
        const avail = [0, 1, 2].filter(i => !state.riversUsedThisTurn[i]);
        return avail.map(riverIdx => ({ type: 'DROP_IN_RIVER' as const, riverIdx }));
    }
    if (state.phase === 'CAPTURING' && state.capturerIdx === 1) {
        const actions: GameAction[] = [];
        for (const card of state.hands[1]) {
            for (let ri = 0; ri < 3; ri++) {
                if (state.rivers[ri].length > 0 && canCaptureRiver(card, state.rivers[ri])) {
                    actions.push({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: card });
                }
            }
        }
        // One discard per card: always to the smallest river to keep action space bounded
        const smallestRi = ([0, 1, 2] as const).reduce((a, b) =>
            state.rivers[a].length <= state.rivers[b].length ? a : b);
        for (const card of state.hands[1]) {
            actions.push({ type: 'DISCARD_TO_RIVER', riverIdx: smallestRi, handCard: card });
        }
        return actions;
    }
    if (state.phase === 'FORCED_CAPTURE' && state.capturerIdx === 1) {
        const ri = state.lightningRiver!;
        return state.hands[1].map(card => ({ type: 'CAPTURE_RIVER' as const, riverIdx: ri, handCard: card }));
    }
    if (state.phase === 'YAKU_CHOICE' && state.yakuPlayer === 1) {
        return [{ type: 'CALL_STOP' }, { type: 'CALL_KOIKOI' }];
    }
    return [];
}

// Get a random valid action for whichever player needs to act (used in rollouts)
function getSimAction(state: GameState): GameAction | null {
    if (state.phase === 'GAME_OVER') return null;
    if (state.phase === 'ROUND_OVER') return { type: 'NEXT_ROUND' };
    if (state.phase === 'DEALING') {
        if (!state.drawnCard) return { type: 'DRAW_CARD' };
        const avail = [0, 1, 2].filter(i => !state.riversUsedThisTurn[i]);
        if (avail.length === 0) return null;
        return { type: 'DROP_IN_RIVER', riverIdx: avail[Math.floor(Math.random() * avail.length)] };
    }
    if (state.phase === 'CAPTURING') {
        const who = state.capturerIdx;
        const hand = state.hands[who];
        if (hand.length === 0) return null;
        const caps: GameAction[] = [];
        for (const card of hand) {
            for (let ri = 0; ri < 3; ri++) {
                if (state.rivers[ri].length > 0 && canCaptureRiver(card, state.rivers[ri])) {
                    caps.push({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: card });
                }
            }
        }
        if (caps.length > 0) return caps[Math.floor(Math.random() * caps.length)];
        const card = hand[Math.floor(Math.random() * hand.length)];
        return { type: 'DISCARD_TO_RIVER', riverIdx: Math.floor(Math.random() * 3), handCard: card };
    }
    if (state.phase === 'FORCED_CAPTURE') {
        const hand = state.hands[state.capturerIdx];
        if (hand.length === 0) return null;
        return { type: 'CAPTURE_RIVER', riverIdx: state.lightningRiver!, handCard: hand[Math.floor(Math.random() * hand.length)] };
    }
    if (state.phase === 'YAKU_CHOICE') {
        return Math.random() < 0.5 ? { type: 'CALL_STOP' } : { type: 'CALL_KOIKOI' };
    }
    return null;
}

// Fast random rollout from a state to game over
function rolloutToEnd(state: GameState): GameState {
    let s = state;
    for (let i = 0; i < 600 && s.phase !== 'GAME_OVER'; i++) {
        const action = getSimAction(s);
        if (!action) break;
        const next = gameReducer(s, action);
        if (next === s) break; // action rejected — avoid infinite loop
        s = next;
    }
    return s;
}

// MCTS: choose the best action for AI given the current (partially observable) state.
// Uses determinization: hidden cards are randomized once per simulation.
function mctsChooseAction(state: GameState, simCount: number): GameAction {
    const actions = getAIActions(state);
    if (actions.length === 0) return { type: 'DRAW_CARD' };
    if (actions.length === 1) return actions[0];

    const wins = new Float64Array(actions.length);
    const visits = new Int32Array(actions.length);
    const C = 1.41; // UCB1 exploration constant

    _simMode = true;
    try {
        for (let sim = 0; sim < simCount; sim++) {
            // Determinize: randomly assign hidden cards for this simulation
            const detState = randomizeHiddenCards(state);

            // Select action via UCB1 (round-robin for the first pass)
            let ai: number;
            if (sim < actions.length) {
                ai = sim;
            } else {
                const logTotal = Math.log(sim);
                let bestUCB = -Infinity;
                ai = 0;
                for (let i = 0; i < actions.length; i++) {
                    const ucb = wins[i] / visits[i] + C * Math.sqrt(logTotal / visits[i]);
                    if (ucb > bestUCB) { bestUCB = ucb; ai = i; }
                }
            }

            // Apply chosen action then roll out to game over
            const next = gameReducer(detState, actions[ai]);
            const terminal = rolloutToEnd(next);

            if (terminal.scores[1] === terminal.scores[0]) {
                console.log("tie", terminal.scores)
            }

            // Score: win = 1, tie = 0.5, loss = 0
            const score = terminal.scores[1] > terminal.scores[0] ? 1
                : terminal.scores[1] === terminal.scores[0] ? 0.5 : 0;

            wins[ai] += score;
            visits[ai]++;
        }
    } finally {
        _simMode = false;
    }

    // Return the action with the highest win rate
    let bestIdx = 0, bestRate = -1;
    for (let i = 0; i < actions.length; i++) {
        if (visits[i] > 0) {
            const rate = wins[i] / visits[i];
            if (rate > bestRate) { bestRate = rate; bestIdx = i; }
        }
    }
    console.log("bestRate", bestRate)
    return actions[bestIdx];
}

type AIAction =
    | { type: 'capture'; card: Card; riverIdx: number }
    | { type: 'discard'; card: Card; riverIdx: number };

function aiChooseRiver(state: GameState): number {
    const action = mctsChooseAction(state, 2000);
    if (action.type === 'DROP_IN_RIVER') return action.riverIdx;
    return [0, 1, 2].find(i => !state.riversUsedThisTurn[i]) ?? 0;
}

function aiChooseCaptureAction(state: GameState): AIAction {
    const action = mctsChooseAction(state, 4000);
    if (action.type === 'CAPTURE_RIVER' && action.handCard) {
        return { type: 'capture', card: action.handCard, riverIdx: action.riverIdx };
    }
    if (action.type === 'DISCARD_TO_RIVER' && action.handCard) {
        return { type: 'discard', card: action.handCard, riverIdx: action.riverIdx };
    }
    return { type: 'discard', card: state.hands[1][0], riverIdx: 0 };
}

function aiChooseForcedCaptureCard(state: GameState): Card {
    const action = mctsChooseAction(state, 2000);
    if (action.type === 'CAPTURE_RIVER' && action.handCard) return action.handCard;
    return state.hands[1][0];
}

function aiDecideKoikoi(state: GameState): boolean {
    const action = mctsChooseAction(state, 2000);
    return action.type === 'CALL_KOIKOI';
}

// --- STYLE CONSTANTS ---
const CARD_W = 64;
const CARD_H = Math.round(CARD_W * 839 / 512);
const CARD_W_SM = 44;
const CARD_H_SM = Math.round(CARD_W_SM * 839 / 512);
const CARD_W_RIVER = 56;
const CARD_H_RIVER = Math.round(CARD_W_RIVER * 839 / 512);

const COLORS = {
    bg: 'var(--color-bg)',
    felt: 'var(--color-felt)',
    dark: 'var(--color-dark)',
    pink: 'var(--color-pink)',
    white: 'var(--color-text)',
    red: 'var(--color-red)',
    captureGlow: 'var(--color-capture-glow)',
    discardGlow: 'var(--color-discard-glow)',
    forcedGlow: 'var(--color-forced-glow)',
    hoverGlow: 'var(--color-hover-glow)',
    riverFrom: 'var(--color-river-from)',
    separator: 'var(--color-separator)',
    cardShadow: 'var(--color-card-shadow)',
    overlay: 'var(--color-overlay)',
};

// --- CARD COMPONENT ---
interface CardViewProps {
    card: Card;
    faceDown?: boolean;
    onClick?: () => void;
    selected?: boolean;
    small?: boolean;
    disabled?: boolean;
    highlighted?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    style?: CSSProperties;
}


function CardView({ card, faceDown, onClick, selected, small, disabled, highlighted, onMouseEnter, onMouseLeave, style: extraStyle }: CardViewProps) {
    const w = small ? CARD_W_SM : CARD_W;
    const h = small ? CARD_H_SM : CARD_H;
    const src = faceDown ? images.card_back : card.img;

    const baseStyle: CSSProperties = {
        width: w,
        height: h,
        borderRadius: 4,
        cursor: onClick && !disabled ? 'pointer' : 'default',
        transition: 'transform 0.2s, outline-color 0.2s',
        transform: selected ? 'translateY(-8px)' : 'none',
        boxShadow: `0 1px 4px ${COLORS.cardShadow}`,
        flexShrink: 0,
        outlineStyle: "solid",
        outlineWidth: "2px",
        outlineColor: highlighted ? COLORS.captureGlow : 'transparent',
        ...extraStyle,
    };

    return (
        <img
            src={src}
            alt={faceDown ? 'Card back' : card.name}
            title={faceDown ? '' : card.name}
            style={baseStyle}
            onClick={onClick && !disabled ? onClick : undefined}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            draggable={false}
        />
    );
}

// --- RIVER COMPONENT ---
interface RiverViewProps {
    cards: Card[];
    index: number;
    onClick?: () => void;
    onDiscard?: () => void;
    highlightType?: RiverHighlightType;
    hoverHighlight?: boolean | null;
    showDiscard?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function RiverView({ cards, index, onClick, onDiscard, highlightType, hoverHighlight, showDiscard, onMouseEnter, onMouseLeave }: RiverViewProps) {
    const outlineColor =
        highlightType === 'capture' ? COLORS.captureGlow
            : highlightType === 'forced' ? COLORS.forcedGlow
                : highlightType === 'drop' ? COLORS.discardGlow
                    : hoverHighlight ? COLORS.hoverGlow
                        : COLORS.riverFrom;

    const hasRainManCard = cards.some(isRainMan);
    const hasLightningCard = cards.some(isLightning);

    return (
        <div
            id={`river-${index}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                padding: '6px 6px',
                minHeight: CARD_H_RIVER + 16,
                background: `var(--gradient-river)`,
                outlineStyle: hasLightningCard || hasRainManCard
                    ? "dashed"
                    : 'solid',
                borderWidth: '0',
                borderRadius: '8px 0 0 8px',
                outlineWidth: "2px",
                marginLeft: "2px",
                outlineColor: outlineColor,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'outline-color 0.2s',
                position: 'relative',
                minWidth: 120,
            }}
        >
            {cards.length === 0 && (
                <div style={{ width: CARD_W_RIVER, height: CARD_H_RIVER, flexShrink: 0 }} />
            )}
            {cards.map(card => (
                <CardView
                    key={card.id}
                    card={card}
                    small={false}
                    style={{ width: CARD_W_RIVER, height: CARD_H_RIVER }}
                />
            ))}
            {showDiscard && (
                <button
                    id="discard"
                    class="discard-card"
                    onClick={(e) => { e.stopPropagation(); onDiscard && onDiscard(); }}
                    style={{
                        width: CARD_W_RIVER,
                        height: CARD_H_RIVER,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 33,
                        fontWeight: 600,
                        background: 'transparent',
                        color: COLORS.discardGlow,
                        border: `2px dashed ${COLORS.discardGlow}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    🍂
                </button>
            )}
            {highlightType === 'capture' && (<div
                class="river-icon"
                style={{
                    color: COLORS.discardGlow,
                }}>🫳</div>)}
            {highlightType === 'forced' && (<div
                class="river-icon"
                style={{
                    color: COLORS.forcedGlow,
                }}>🫳</div>)}
            {highlightType === 'drop' && (<div
                class="river-icon"
                style={{
                    color: COLORS.discardGlow,
                }}>🍂</div>)}
        </div>
    );
}

// --- HAND COMPONENT ---
interface HandViewProps {
    id?: string;
    cards: Card[];
    faceDown?: boolean;
    selectedCard?: Card | null;
    onSelect?: (card: Card) => void;
    disabled?: boolean;
    highlightedIds?: Set<string>;
    onCardHover?: (card: Card) => void;
    onCardLeave?: () => void;
}

function HandView({ id, cards, faceDown, selectedCard, onSelect, disabled, highlightedIds, onCardHover, onCardLeave }: HandViewProps) {
    return (
        <div id={id} style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            flexWrap: 'wrap',
        }}>
            {cards.map(card => {
                const isRevealed = selectedCard && selectedCard.id === card.id;
                return (
                    <CardView
                        key={card.id}
                        card={card}
                        faceDown={faceDown && !isRevealed}
                        selected={!!isRevealed}
                        highlighted={!!(highlightedIds?.has(card.id))}
                        onClick={!faceDown && onSelect ? () => onSelect(card) : undefined}
                        onMouseEnter={!faceDown && onCardHover ? () => onCardHover(card) : undefined}
                        onMouseLeave={onCardLeave}
                        disabled={disabled}
                    />
                );
            })}
        </div>
    );
}

// --- CAPTURED AREA ---
interface CapturedViewProps {
    id?: string;
    cards: Card[];
    label: string;
}

function CapturedView({ id, cards, label }: CapturedViewProps) {
    const brights = cards.filter(c => c.type === 'bright');
    const animals = cards.filter(c => c.type === 'animal');
    const ribbons = cards.filter(c => c.type === 'ribbon');
    const junk = cards.filter(c => c.type === 'junk');

    const groups = [
        { name: 'Brights', cards: brights, color: 'var(--color-bright)' },
        { name: 'Animals', cards: animals, color: 'var(--color-animal)' },
        { name: 'Ribbons', cards: ribbons, color: 'var(--color-ribbon)' },
        { name: 'Junk', cards: junk, color: 'var(--color-junk)' },
    ];

    const groupSizes = groups.map(g => g.cards.length).filter(s => s > 0)

    const groupsLength = groupSizes.length;

    const width: number = [
        () => 0,
        () => groupSizes[0],
        () => Math.max(...groupSizes),
        () => Math.min(
            Math.max(groupSizes[0] + 0.5 + groupSizes[1], groupSizes[2]),
            Math.max(groupSizes[0], groupSizes[1] + 0.5 + groupSizes[2])
        ),
        () => Math.min(
            Math.max(groupSizes[0] + 0.5 + groupSizes[1] + 0.5 + groupSizes[2], groupSizes[3]),
            Math.max(groupSizes[0] + 0.5 + groupSizes[1], groupSizes[2] + 0.5 + groupSizes[3]),
            Math.max(groupSizes[0], groupSizes[1] + 0.5 + groupSizes[2] + 0.5 + groupSizes[3]),
        ),
    ][groupsLength]() + 0.5;

    return (
        <>
            <span style={{
                color: COLORS.pink,
                fontSize: 11,
                fontWeight: 600,
                minWidth: 60,
                paddingTop: 2,
            }}>
                {label} ({cards.length})
            </span>
            <div id={id}
                class='captured-card-groups'
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'flex-start',
                    padding: '4px 0',
                    minHeight: ((CARD_H_SM + 8) * 2),
                    flexWrap: 'wrap',
                    width: (((width) * (CARD_W_SM + 2))),
                    background: "#f0f"
                }}>
                {groups.map(g => g.cards.length > 0 && (
                    <div key={g.name}
                        class='captured-card-group'
                        style={{
                            gap: 2,
                            display: 'flex',
                            alignItems: 'center',
                            flex: '0 1 auto'
                        }}>
                        <span style={{ fontSize: 9, color: g.color, marginRight: 2 }}>
                            {g.cards.length}
                        </span>
                        {g.cards.map(c => (
                            <CardView key={c.id} card={c} small style={{ width: CARD_W_SM, height: CARD_H_SM }} />
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}

// --- YAKU DISPLAY ---
interface YakuListProps {
    captured: Card[];
    label: string;
}

function YakuList({ captured, label }: YakuListProps) {
    const { yakuList, total } = computeYaku(captured);
    if (yakuList.length === 0) return null;
    return (
        <div style={{ fontSize: 11, color: COLORS.red, padding: '2px 8px' }}>
            <span style={{ fontWeight: 600 }}>{label}: </span>
            {yakuList.map(y => `${y.name} (${y.points})`).join(', ')}
            <span style={{ marginLeft: 6, fontWeight: 700 }}>= {total}</span>
        </div>
    );
}

// --- MAIN COMPONENT ---
export function FlowerRivers() {
    const [state, dispatch] = useReducer(gameReducer, makeInitialState());
    const [aiDelay] = useState(false);
    const [hoveredRiver, setHoveredRiver] = useState<number | null>(null);
    const [hoveredHandCard, setHoveredHandCard] = useState<Card | null>(null);
    const [revealedAiCard, setRevealedAiCard] = useState<Card | null>(null);

    const resetHover = () => {
        setHoveredRiver(null);
        setHoveredHandCard(null);
    };

    const {
        phase, deck, hands, captured, rivers, dealerIdx, capturerIdx,
        dealStep, drawnCard, riversUsedThisTurn, lightningRiver,
        selectedHandCard, koikoiCounts, scores, round, turn,
        drawMultiplier, newYaku, yakuPlayer, message, roundScoreInfo,
    } = state;

    const isHumanDealer = dealerIdx === 0;
    const isHumanCapturer = capturerIdx === 0;

    useEffect(() => { if (message) console.log('message:', message); }, [message]);

    // --- AI EFFECTS ---
    // Auto-draw: whenever it's the dealing phase and no card is drawn yet, draw automatically
    useEffect(() => {
        if (phase !== 'DEALING' || drawnCard) return;
        const delay = isHumanDealer ? 200 : 300;
        const timer = setTimeout(() => {
            dispatch({ type: 'DRAW_CARD' });
        }, delay);
        return () => clearTimeout(timer);
    }, [phase, drawnCard, dealStep]);

    // AI dealing: drop drawn cards
    useEffect(() => {
        if (phase !== 'DEALING' || isHumanDealer || !drawnCard) return;
        if (aiDelay) return;

        const timer = setTimeout(() => {
            const ri = aiChooseRiver(state);
            dispatch({ type: 'DROP_IN_RIVER', riverIdx: ri });
        }, 500);

        return () => clearTimeout(timer);
    }, [phase, isHumanDealer, drawnCard, dealStep, aiDelay]);

    // AI capturing
    useEffect(() => {
        if (phase !== 'CAPTURING' || isHumanCapturer) return;

        const action = aiChooseCaptureAction(state);
        setRevealedAiCard(action.card);

        const timer = setTimeout(() => {
            setRevealedAiCard(null);
            if (action.type === 'capture') {
                dispatch({ type: 'CAPTURE_RIVER', riverIdx: action.riverIdx, handCard: action.card });
            } else {
                dispatch({ type: 'DISCARD_TO_RIVER', riverIdx: action.riverIdx, handCard: action.card });
            }
        }, 700);

        return () => { clearTimeout(timer); setRevealedAiCard(null); };
    }, [phase, isHumanCapturer]);

    // AI forced capture
    useEffect(() => {
        if (phase !== 'FORCED_CAPTURE' || isHumanCapturer) return;

        const timer = setTimeout(() => {
            const card = aiChooseForcedCaptureCard(state);
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: lightningRiver!, handCard: card });
        }, 700);

        return () => clearTimeout(timer);
    }, [phase, isHumanCapturer, lightningRiver]);

    // AI yaku choice (koikoi or stop)
    useEffect(() => {
        if (phase !== 'YAKU_CHOICE' || yakuPlayer !== 1) return;

        const timer = setTimeout(() => {
            const koikoi = aiDecideKoikoi(state);
            dispatch({ type: koikoi ? 'CALL_KOIKOI' : 'CALL_STOP' });
        }, 1000);

        return () => clearTimeout(timer);
    }, [phase, yakuPlayer]);

    // --- HUMAN HANDLERS ---
    const handleDropInRiver = (ri: number) => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard) {
            dispatch({ type: 'DROP_IN_RIVER', riverIdx: ri });
        }
    };

    const handleSelectCard = (card: Card) => {
        if ((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer) {
            dispatch({ type: 'SELECT_HAND_CARD', card });
        }
    };

    const handleRiverClick = (ri: number) => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard) {
            handleDropInRiver(ri);
            return;
        }
        if (!selectedHandCard || !isHumanCapturer) return;

        if (phase === 'FORCED_CAPTURE') {
            if (ri === lightningRiver) {
                resetHover();
                dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: selectedHandCard });
            }
            return;
        }

        // Clicking the river body captures (if valid)
        if (phase === 'CAPTURING' && canCaptureRiver(selectedHandCard, rivers[ri])) {
            resetHover();
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: selectedHandCard });
        }
    };

    const handleDiscard = (ri: number) => {
        if (phase !== 'CAPTURING' || !selectedHandCard || !isHumanCapturer) return;
        resetHover();
        dispatch({ type: 'DISCARD_TO_RIVER', riverIdx: ri, handCard: selectedHandCard });
    };

    // --- RENDER ---
    // Menu screen
    if (phase === 'MENU') {
        return (
            <div id="menu-screen" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100vh', background: COLORS.bg,
                fontFamily: "'Inter', sans-serif", color: COLORS.white,
            }}>
                <div id="menu-title" style={{ fontSize: 48, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
                    花川
                </div>
                <div id="menu-subtitle" style={{ fontSize: 16, color: COLORS.pink, marginBottom: 32 }}>
                    Blossom Rivers
                </div>
                <button
                    onClick={() => dispatch({ type: 'START_GAME' })}
                    style={{
                        padding: '14px 48px', fontSize: 18, fontWeight: 600,
                        background: COLORS.red, color: COLORS.bg, border: 'none',
                        borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Start Game
                </button>
            </div>
        );
    }

    // Round over screen
    if (phase === 'ROUND_OVER') {
        const info = roundScoreInfo;
        return (
            <div id="round-over-screen" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100vh', background: COLORS.bg,
                fontFamily: "'Inter', sans-serif", color: COLORS.white,
            }}>
                <div id="round-over-title" style={{ fontSize: 32, fontWeight: 700, color: COLORS.red, marginBottom: 16 }}>
                    Round {round} Complete
                </div>
                {info && info.winner === -1 ? (
                    <div id="round-over-draw-info" style={{ fontSize: 18, marginBottom: 12 }}>
                        Draw! Points doubled next round.
                    </div>
                ) : (
                    <div id="round-over-winner-info" style={{ textAlign: 'center', marginBottom: 16 }}>
                        <div id="round-over-winner-text" style={{ fontSize: 20, marginBottom: 8 }}>
                            {info && info.winner === 0 ? 'You' : 'AI'} won the round!
                        </div>
                        {info && info.yakuList.map(y => (
                            <div key={y.name} style={{ fontSize: 14, color: COLORS.red }}>
                                {y.name}: {y.points} pts
                            </div>
                        ))}
                        <div id="round-over-multiplier" style={{ marginTop: 8, fontSize: 13, color: COLORS.pink }}>
                            Base: {info && info.basePoints}
                            {info && info.sevenBonus && ' × 2 (7+ bonus)'}
                            {info && info.oppKoikoi !== undefined && info.oppKoikoi > 0 && ` × ${Math.pow(2, info.oppKoikoi)} (opponent koi-koi)`}
                            {info && info.drawMultiplier > 1 && ` × ${info.drawMultiplier} (draw bonus)`}
                        </div>
                        <div id="round-over-final-points" style={{ fontSize: 22, fontWeight: 700, color: COLORS.red, marginTop: 6 }}>
                            = {info && info.finalPoints} points
                        </div>
                    </div>
                )}
                <div id="round-over-scores" style={{ fontSize: 16, marginBottom: 20 }}>
                    Score — You: {scores[0]} | AI: {scores[1]}
                </div>
                <button
                    onClick={() => dispatch({ type: 'NEXT_ROUND' })}
                    style={{
                        padding: '12px 40px', fontSize: 16, fontWeight: 600,
                        background: COLORS.red, color: COLORS.bg, border: 'none',
                        borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Next Round
                </button>
            </div>
        );
    }

    // Game over screen
    if (phase === 'GAME_OVER') {
        const info = roundScoreInfo;
        const finalS0 = scores[0];
        const finalS1 = scores[1];
        const winner = finalS0 > finalS1 ? 'You win!' : finalS0 < finalS1 ? 'AI wins!' : 'Tie game!';
        return (
            <div id="game-over-screen" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100vh', background: COLORS.bg,
                fontFamily: "'Inter', sans-serif", color: COLORS.white,
            }}>
                <div id="game-over-title" style={{ fontSize: 36, fontWeight: 700, color: COLORS.red, marginBottom: 8 }}>
                    Game Over
                </div>
                {info && info.winner !== -1 && (
                    <div id="game-over-round-info" style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div id="game-over-round-text" style={{ fontSize: 16, marginBottom: 6 }}>
                            {info.winner === 0 ? 'You' : 'AI'} won the final round with {info.finalPoints} pts
                        </div>
                        {info.yakuList.map(y => (
                            <div key={y.name} style={{ fontSize: 13, color: COLORS.red }}>
                                {y.name}: {y.points}
                            </div>
                        ))}
                    </div>
                )}
                {info && info.winner === -1 && (
                    <div id="game-over-draw-info" style={{ fontSize: 16, marginBottom: 12 }}>Final round was a draw.</div>
                )}
                <div id="game-over-scores" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                    You: {finalS0} — AI: {finalS1}
                </div>
                <div id="game-over-winner" style={{ fontSize: 28, color: COLORS.red, fontWeight: 700, marginBottom: 24 }}>
                    {winner}
                </div>
                <button
                    onClick={() => dispatch({ type: 'START_GAME' })}
                    style={{
                        padding: '12px 40px', fontSize: 16, fontWeight: 600,
                        background: COLORS.red, color: COLORS.bg, border: 'none',
                        borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    Play Again
                </button>
            </div>
        );
    }

    // --- MAIN GAME BOARD ---
    // Determine river highlights
    const getRiverHighlight = (ri: number): RiverHighlightType => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard && !riversUsedThisTurn[ri]) {
            return 'drop';
        }
        if (phase === 'FORCED_CAPTURE' && isHumanCapturer && ri === lightningRiver) {
            return 'forced';
        }
        if (phase === 'CAPTURING' && isHumanCapturer && selectedHandCard) {
            if (canCaptureRiver(selectedHandCard, rivers[ri])) return 'capture';
        }
        return null;
    };

    const showDiscardButton = (_ri: number): boolean => {
        return phase === 'CAPTURING' && isHumanCapturer && selectedHandCard !== null;
    };

    // Hover cross-highlighting
    const isCapturingPhase = (phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer;

    // Which hand card IDs to highlight (when hovering a river, or any-match when idle)
    const highlightedHandIds: Set<string> = (() => {
        const ids = new Set<string>();
        if (!isCapturingPhase) return ids;
        if (hoveredRiver !== null) {
            const river = rivers[hoveredRiver];
            if (river.length === 0) return ids;
            for (const card of hands[0]) {
                if (canCaptureRiver(card, river)) ids.add(card.id);
            }
            return ids;
        }
        // No river hovered — highlight cards that match any river
        for (const card of hands[0]) {
            for (let ri = 0; ri < 3; ri++) {
                if (rivers[ri].length > 0 && canCaptureRiver(card, rivers[ri])) {
                    ids.add(card.id);
                    break;
                }
            }
        }
        return ids;
    })();

    // Which river indices to highlight
    const highlightedRiverSet: Set<number> = (() => {
        const set = new Set<number>();
        if (!isCapturingPhase) return set;
        if (hoveredHandCard) {
            for (let ri = 0; ri < 3; ri++) {
                if (rivers[ri].length > 0 && canCaptureRiver(hoveredHandCard, rivers[ri])) set.add(ri);
            }
            return set;
        } else {
            for (let ri = 0; ri < 3; ri++) {
                if (rivers[ri].length > 0 && hands[0].some(c => canCaptureRiver(c, rivers[ri]))) set.add(ri);
            }
            return set;
        }
    })();

    const canHumanAct =
        (phase === 'DEALING' && isHumanDealer) ||
        ((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer);

    // Status message
    let statusText = message;
    if (phase === 'DEALING' && isHumanDealer && !drawnCard) {
        statusText = `Turn ${turn} — Drawing... (${dealStep + 1}/3)`;
    } else if (phase === 'DEALING' && isHumanDealer && drawnCard) {
        statusText = `Drop ${drawnCard.name} in a river. (${dealStep + 1}/3)`;
    } else if (phase === 'CAPTURING' && isHumanCapturer && !selectedHandCard) {
        statusText = 'Select a card from your hand.';
    } else if (phase === 'CAPTURING' && isHumanCapturer && selectedHandCard) {
        statusText = 'Click a river to capture or discard.';
    } else if (phase === 'FORCED_CAPTURE' && isHumanCapturer && !selectedHandCard) {
        statusText = `Lightning! Select a card to capture River ${lightningRiver !== null ? lightningRiver + 1 : ''}.`;
    } else if (phase === 'FORCED_CAPTURE' && isHumanCapturer && selectedHandCard) {
        statusText = `Click River ${lightningRiver !== null ? lightningRiver + 1 : ''} to capture it.`;
    } else if (phase === 'DEALING' && !isHumanDealer) {
        statusText = 'AI is dealing...';
    } else if ((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && !isHumanCapturer) {
        statusText = 'AI is choosing...';
    }

    return (
        <div id="game-board" style={{
            display: 'flex', flexDirection: 'column',
            height: '100vh', background: COLORS.bg,
            fontFamily: "'Inter', sans-serif", color: COLORS.white,
            overflow: 'hidden',
        }}>
            {/* Top Bar */}
            <div id="top-bar" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 16px', background: COLORS.dark,
                fontSize: 13, flexShrink: 0,
            }}>
                <span style={{ color: COLORS.pink, fontWeight: 700 }}>花川 - Blossom Rivers</span>
                <span>Round {round}/{TOTAL_ROUNDS} — Turn {turn}</span>
                <span>
                    You: <b>{scores[0]}</b> | AI: <b>{scores[1]}</b>
                    {drawMultiplier > 1 && (
                        <span style={{ color: COLORS.pink, marginLeft: 8 }}>×{drawMultiplier} next!</span>
                    )}
                </span>
            </div>

            {/* AI Area */}
            <div id="ai-area" style={{
                padding: '4px 16px',
                gap: '16px',
                flexShrink: 0,
                borderBottom: `1px solid ${COLORS.separator}`,
                display: 'flex',
            }}>
                <div id="ai-hand-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'end',
                    gap: 12,
                    marginBottom: 4,
                    flex: '0 1 50%',
                }}>
                    <HandView id="ai-hand" cards={hands[1]} faceDown disabled
                        selectedCard={revealedAiCard}
                    />
                    {koikoiCounts[1] > 0 && (
                        <span style={{ fontSize: 11, color: COLORS.red, fontWeight: 700 }}>
                            Koi-Koi ×{koikoiCounts[1]}
                        </span>
                    )}
                </div>
                <div id="ai-capture-row" style={{
                    flex: '0 1 50%',
                }}>
                    <CapturedView id="ai-captured" cards={captured[1]} label="AI captured" />
                    <YakuList captured={captured[1]} label="AI yaku" />
                </div>
            </div>

            {/* Deck + Rivers area */}
            <div id="play-area" style={{
                flex: 1, display: 'flex', flexDirection: 'row',
                padding: '8px 0px 8px 16px', gap: 16, minHeight: 0,
                overflow: 'hidden',
            }}>
                {/* Deck + Drawn card */}
                <div id="deck-column" style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 10, minWidth: 90,
                }}>
                    {/* Deck */}
                    <div
                        id="deck"
                        style={{
                            position: 'relative',
                        }}
                    >
                        {deck.length > 0 ? (
                            <CardView card={CARDS[0]} faceDown />
                        ) : (
                            <div id="deck-empty" style={{
                                width: CARD_W, height: CARD_H,
                                border: `2px dashed ${COLORS.separator}`,
                                borderRadius: 4,
                            }} />
                        )}
                        <span style={{
                            position: 'absolute', bottom: -14, left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 10, color: COLORS.pink,
                        }}>
                            {deck.length} left
                        </span>
                    </div>

                    {/* Drawn card */}
                    <div id="drawn-card" style={{ marginTop: 8, width: CARD_W, height: CARD_H, flexShrink: 0 }}>
                        {drawnCard && <CardView card={drawnCard} />}
                    </div>

                    {/* Dealing indicator */}
                    {phase === 'DEALING' && (
                        <div id="deal-indicator" style={{ fontSize: 11, color: COLORS.pink, textAlign: 'center', whiteSpace: 'nowrap' }}>
                            Deal {dealStep + 1}/3
                        </div>
                    )}
                </div>

                {/* Rivers */}
                <div id="rivers-column" style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    gap: 12, justifyContent: 'center',
                    overflow: 'auto',
                }}>
                    {rivers.map((river, ri) => (
                        <RiverView
                            key={ri}
                            cards={river}
                            index={ri}
                            highlightType={getRiverHighlight(ri)}
                            hoverHighlight={!!(highlightedRiverSet?.has(ri))}
                            onClick={canHumanAct ? () => handleRiverClick(ri) : undefined}
                            onDiscard={() => handleDiscard(ri)}
                            showDiscard={showDiscardButton(ri)}
                            onMouseEnter={isCapturingPhase ? () => setHoveredRiver(ri) : undefined}
                            onMouseLeave={isCapturingPhase ? () => setHoveredRiver(null) : undefined}
                        />
                    ))}
                </div>
            </div>

            {/* Status bar */}
            <div id="status-bar" style={{
                padding: '6px 16px', textAlign: 'center',
                fontSize: 14, fontWeight: 500,
                background: COLORS.dark,
                color: COLORS.white,
                flexShrink: 0,
                minHeight: 32,
            }}>
                {statusText}
            </div>

            {/* Yaku Choice Dialog */}
            {phase === 'YAKU_CHOICE' && yakuPlayer === 0 && (
                <div id="yaku-dialog-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: COLORS.overlay, zIndex: 100,
                }}>
                    <div id="yaku-dialog" style={{
                        background: COLORS.felt, border: `2px solid ${COLORS.red}`,
                        borderRadius: 12, padding: 32, textAlign: 'center',
                        maxWidth: 400,
                    }}>
                        <div id="yaku-dialog-title" style={{ fontSize: 22, fontWeight: 700, color: COLORS.red, marginBottom: 12 }}>
                            Yaku!
                        </div>
                        {newYaku.map(y => (
                            <div key={y.name} style={{ fontSize: 16, marginBottom: 4 }}>
                                {y.name} — {y.points} pts
                            </div>
                        ))}
                        <div id="yaku-dialog-total" style={{ margin: '16px 0 6px', fontSize: 14, color: COLORS.pink }}>
                            Total so far: {computeYaku(captured[0]).total} pts
                            {koikoiCounts[1] > 0 && (
                                <span> (opponent called koi-koi ×{koikoiCounts[1]})</span>
                            )}
                        </div>
                        <div id="yaku-dialog-buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
                            <button
                                onClick={() => dispatch({ type: 'CALL_STOP' })}
                                style={{
                                    padding: '10px 28px', fontSize: 15, fontWeight: 600,
                                    background: COLORS.red, color: COLORS.bg, border: 'none',
                                    borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Stop
                            </button>
                            <button
                                disabled={hands[0].length == 0}
                                onClick={() => dispatch({ type: 'CALL_KOIKOI' })}
                                style={{
                                    padding: '10px 28px', fontSize: 15, fontWeight: 600,
                                    background: 'transparent', color: COLORS.red,
                                    border: `2px solid ${COLORS.red}`, borderRadius: 6,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Koi-Koi!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Human Area */}
            <div id="human-area" style={{
                padding: '4px 16px',
                gap: '16px',
                flexShrink: 0,
                borderTop: `1px solid ${COLORS.separator}`,
                display: 'flex',
            }}>
                <div id="human-hand-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'end',
                    gap: 12,
                    marginTop: 4,
                    flex: '1 1 50%',
                }}>
                    <HandView
                        id="human-hand"
                        cards={hands[0]}
                        selectedCard={selectedHandCard}
                        onSelect={handleSelectCard}
                        disabled={!((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer)}
                        highlightedIds={highlightedHandIds}
                        onCardHover={isCapturingPhase ? (card) => setHoveredHandCard(card) : undefined}
                        onCardLeave={isCapturingPhase ? () => setHoveredHandCard(null) : undefined}
                    />
                    {koikoiCounts[0] > 0 && (
                        <span style={{ fontSize: 11, color: COLORS.red, fontWeight: 700 }}>
                            Koi-Koi ×{koikoiCounts[0]}
                        </span>
                    )}
                </div>
                <div id="human-capture-row" style={{
                    flex: '1 1 50%',
                }}>
                    <CapturedView id="human-captured" cards={captured[0]} label="Yours captured" />
                    <YakuList captured={captured[0]} label="Your yaku" />
                </div>
            </div>
        </div>
    );
}
