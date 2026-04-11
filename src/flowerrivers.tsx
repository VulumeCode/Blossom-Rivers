import { createSignal, createEffect, createMemo, onCleanup, Show, Switch, Match, For, type JSX } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import {
    Card,
    RiverHighlightType,
    RoundScoreInfo,
    GameState,
    GameAction,
} from './types';
import { images } from './cardImages';
import { CARDS, countType, hasCard, isLightning, isRainMan, isWillow } from './cards';
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
const TURNS_PER_ROUND = 6; // each player has 6 hand cards, one used per turn

// Phases: MENU, DEALING, CAPTURING, FORCED_CAPTURE, YAKU_CHOICE, ROUND_OVER, GAME_OVER
function makeInitialState(): GameState {
    return {
        phase: 'MENU',
        deck: [],
        hands: [[], []],
        captured: [[], []],
        rivers: [[], [], []],
        dealerIdx: 0,
        capturerIdx: 1,
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
        dealerIdx: state.round % 2,
        capturerIdx: (state.round + 1) % 2,
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

function gameReducer(state: GameState, action: GameAction): GameState {
    console.log(action)
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
            const yaku = computeYaku(state.captured[winner]);
            let pts = yaku.total;
            // 7+ doubling
            if (pts >= 7) pts *= 2;
            // Opponent's koikoi count doubles winner's points
            const oppKoikoi = state.koikoiCounts[1 - winner];
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
            message: 'Round drawn! Points doubled next round.',
        };
    }

    // Swap roles
    const newDealer = state.capturerIdx;
    const newCapturer = state.dealerIdx;

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

// --- AI LOGIC ---
// Score a potential capture for AI: how much yaku-building value does it add?
function aiScoreCapture(aiCaptured: Card[], riverCards: Card[], handCard: Card) {
    const combined = [...aiCaptured, ...riverCards, handCard];
    const currentYaku = computeYaku(aiCaptured);
    const newYaku = computeYaku(combined);
    let score = (newYaku.total - currentYaku.total) * 10;
    // Value non-junk types higher
    for (const c of [...riverCards, handCard]) {
        if (c.type === 'bright') score += 8;
        else if (c.type === 'animal') score += 4;
        else if (c.type === 'ribbon') score += 3;
        else score += 1;
    }
    // Bonus for river size (bigger captures = more value)
    score += riverCards.length * 2;
    return score;
}

// AI chooses where to drop a drawn card (dealing phase)
// Does NOT look at opponent's hand — infers threat from their captured cards
function aiChooseRiver(state: GameState) {
    const available = [0, 1, 2].filter(i => !state.riversUsedThisTurn[i]);
    if (available.length === 0) return 0;
    if (available.length === 1) return available[0];

    const card = state.drawnCard!;
    const aiHand = state.hands[1];
    const oppCaptured = state.captured[0];

    // Infer which specific cards the opponent wants based on yaku progress
    const oppWantedIds = new Set<string>();
    // Poetry Ribbons progress → they want the missing poetry ribbons
    const poetryIds = ['1-ribbon', '2-ribbon', '3-ribbon'];
    if (poetryIds.filter(id => hasCard(oppCaptured, id)).length >= 1) {
        poetryIds.forEach(id => { if (!hasCard(oppCaptured, id)) oppWantedIds.add(id); });
    }
    // Blue Ribbons progress
    const blueIds = ['6-ribbon', '9-ribbon', '10-ribbon'];
    if (blueIds.filter(id => hasCard(oppCaptured, id)).length >= 1) {
        blueIds.forEach(id => { if (!hasCard(oppCaptured, id)) oppWantedIds.add(id); });
    }
    // Boar-Deer-Butterfly progress
    const bdbIds = ['7-animal', '10-animal', '6-animal'];
    if (bdbIds.filter(id => hasCard(oppCaptured, id)).length >= 1) {
        bdbIds.forEach(id => { if (!hasCard(oppCaptured, id)) oppWantedIds.add(id); });
    }
    // Viewing yaku progress
    if (hasCard(oppCaptured, '3-bright') || hasCard(oppCaptured, '9-animal')) {
        if (!hasCard(oppCaptured, '3-bright')) oppWantedIds.add('3-bright');
        if (!hasCard(oppCaptured, '9-animal')) oppWantedIds.add('9-animal');
    }
    if (hasCard(oppCaptured, '8-bright') || hasCard(oppCaptured, '9-animal')) {
        if (!hasCard(oppCaptured, '8-bright')) oppWantedIds.add('8-bright');
        if (!hasCard(oppCaptured, '9-animal')) oppWantedIds.add('9-animal');
    }
    // Opponent wants brights if they already have some
    const oppBrights = countType(oppCaptured, 'bright');
    if (oppBrights >= 2) {
        CARDS.filter(c => c.type === 'bright' && !hasCard(oppCaptured, c.id)).forEach(c => oppWantedIds.add(c.id));
    }

    let bestIdx = available[0];
    let bestScore = -Infinity;

    for (const ri of available) {
        let score = 0;
        const riverAfter = [...state.rivers[ri], card];

        // Penalize if river contains cards the opponent needs for yaku
        const oppWouldWant = riverAfter.some(c => oppWantedIds.has(c.id));
        if (oppWouldWant) score -= 3;

        // Bigger penalty for larger rivers (more cards = juicier target)
        score -= state.rivers[ri].length;

        // Bonus if AI could capture this river later
        const aiCanCapture = aiHand.some(hc => canCaptureRiver(hc, riverAfter));
        if (aiCanCapture) score += 3;

        // Prefer dropping in already-matching rivers (month consolidation)
        const monthMatch = state.rivers[ri].some(c => c.month === card.month);
        if (monthMatch) score += 1;

        // Prefer smaller rivers when discarding (less value given away)
        if (!aiCanCapture) score -= state.rivers[ri].length;

        // Small random tiebreak
        score += Math.random() * 0.5;

        if (score > bestScore) {
            bestScore = score;
            bestIdx = ri;
        }
    }
    return bestIdx;
}

type AIAction =
    | { type: 'capture'; card: Card; riverIdx: number }
    | { type: 'discard'; card: Card; riverIdx: number };

// AI chooses capture or discard action
function aiChooseCaptureAction(state: GameState): AIAction {
    const aiHand = state.hands[1];
    const aiCaptured = state.captured[1];

    let bestAction: AIAction | null = null;
    let bestScore = -Infinity;

    // Evaluate each hand card × each river for capture
    for (const card of aiHand) {
        for (let ri = 0; ri < 3; ri++) {
            if (state.rivers[ri].length === 0) continue;
            if (!canCaptureRiver(card, state.rivers[ri])) continue;

            const score = aiScoreCapture(aiCaptured, state.rivers[ri], card);
            if (score > bestScore) {
                bestScore = score;
                bestAction = { type: 'capture', card, riverIdx: ri };
            }
        }
    }

    // If no capture found or best capture is low value, consider discarding
    if (!bestAction || bestScore < 2) {
        // Find least valuable card to discard
        const cardValues = aiHand.map(c => {
            let v = 0;
            if (c.type === 'bright') v = 8;
            else if (c.type === 'animal') v = 4;
            else if (c.type === 'ribbon') v = 3;
            else v = 1;
            // Keep cards that could capture in future
            const futureCapture = state.rivers.some(r => r.length > 0 && canCaptureRiver(c, r));
            if (futureCapture) v += 2;
            return { card: c, value: v };
        });
        cardValues.sort((a, b) => a.value - b.value);
        const discardCard = cardValues[0].card;

        // Discard to river that benefits AI least / hurts opponent most
        let bestRiver = 0;
        let bestRiverScore = -Infinity;
        for (let ri = 0; ri < 3; ri++) {
            let rs = 0;
            // Prefer smaller rivers (don't give opponent big captures)
            rs -= state.rivers[ri].length;
            rs += Math.random() * 0.5;
            if (rs > bestRiverScore) {
                bestRiverScore = rs;
                bestRiver = ri;
            }
        }

        // Only discard if no capture exists or capture is really bad
        if (!bestAction) {
            return { type: 'discard', card: discardCard, riverIdx: bestRiver };
        }
    }

    return bestAction;
}

// AI forced capture: choose which hand card to use
function aiChooseForcedCaptureCard(state: GameState): Card {
    const aiHand = state.hands[1];
    const ri = state.lightningRiver!;
    const river = state.rivers[ri];

    // Pick card that benefits AI most (least valuable standalone card, to save good cards)
    let bestCard = aiHand[0];
    let bestScore = -Infinity;
    for (const card of aiHand) {
        const score = aiScoreCapture(state.captured[1], river, card);
        if (score > bestScore) {
            bestScore = score;
            bestCard = card;
        }
    }
    return bestCard;
}

// AI koikoi decision: weighted by turns remaining
function aiDecideKoikoi(state: GameState) {
    const yaku = computeYaku(state.captured[1]);
    const pts = yaku.total;
    if (pts >= 12) return false; // very high score — stop to lock it in
    if (pts < 5) return true;   // low score — always continue
    const turnsLeft = TURNS_PER_ROUND - state.turn;
    if (turnsLeft <= 1) return false; // last turn — take what you have
    const prob = (turnsLeft / TURNS_PER_ROUND) * 0.85;
    return Math.random() < prob;
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
    style?: JSX.CSSProperties;
}

function CardView(props: CardViewProps) {
    const baseStyle = (): JSX.CSSProperties => ({
        width: `${props.small ? CARD_W_SM : CARD_W}px`,
        height: `${props.small ? CARD_H_SM : CARD_H}px`,
        "border-radius": '4px',
        cursor: props.onClick && !props.disabled ? 'pointer' : 'default',
        transition: 'transform 0.2s, outline-color 0.2s',
        transform: props.selected ? 'translateY(-8px)' : 'none',
        "box-shadow": `0 1px 4px ${COLORS.cardShadow}`,
        "flex-shrink": 0,
        "outline-style": "solid",
        "outline-width": "2px",
        "outline-color": props.highlighted ? COLORS.captureGlow : 'transparent',
        ...props.style,
    });

    return (
        <img
            src={props.faceDown ? images.card_back : props.card.img}
            alt={props.faceDown ? 'Card back' : props.card.name}
            title={props.faceDown ? '' : props.card.name}
            style={baseStyle()}
            onClick={() => { if (props.onClick && !props.disabled) props.onClick(); }}
            onMouseEnter={() => props.onMouseEnter?.()}
            onMouseLeave={() => props.onMouseLeave?.()}
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

function RiverView(props: RiverViewProps) {
    const outlineColor = () =>
        props.highlightType === 'capture' ? COLORS.captureGlow
            : props.highlightType === 'forced' ? COLORS.forcedGlow
                : props.highlightType === 'drop' ? COLORS.discardGlow
                    : props.hoverHighlight ? COLORS.hoverGlow
                        : COLORS.riverFrom;

    const hasRainManCard = () => props.cards.some(isRainMan);
    const hasLightningCard = () => props.cards.some(isLightning);

    return (
        <div
            id={`river-${props.index}`}
            onClick={() => props.onClick?.()}
            onMouseEnter={() => props.onMouseEnter?.()}
            onMouseLeave={() => props.onMouseLeave?.()}
            style={{
                display: 'flex',
                "flex-direction": 'row',
                "align-items": 'center',
                gap: '4px',
                padding: '6px 6px',
                "min-height": `${CARD_H_RIVER + 16}px`,
                background: `var(--gradient-river)`,
                "outline-style": hasLightningCard() || hasRainManCard()
                    ? "dashed"
                    : 'solid',
                "border-width": '0',
                "border-radius": '8px 0 0 8px',
                "outline-width": "2px",
                "margin-left": "2px",
                "outline-color": outlineColor(),
                cursor: props.onClick ? 'pointer' : 'default',
                transition: 'outline-color 0.2s',
                position: 'relative',
                "min-width": '120px',
            }}
        >
            <Show when={props.cards.length === 0}>
                <div style={{ width: `${CARD_W_RIVER}px`, height: `${CARD_H_RIVER}px`, "flex-shrink": 0 }} />
            </Show>
            <For each={props.cards}>{(card) =>
                <CardView
                    card={card}
                    small={false}
                    style={{ width: `${CARD_W_RIVER}px`, height: `${CARD_H_RIVER}px` }}
                />
            }</For>
            <Show when={props.showDiscard}>
                <button
                    id="discard"
                    class="discard-card"
                    onClick={() => { props.onDiscard && props.onDiscard(); }}
                    style={{
                        width: `${CARD_W_RIVER}px`,
                        height: `${CARD_H_RIVER}px`,
                        display: 'flex',
                        "align-items": 'center',
                        "justify-content": 'center',
                        "font-size": '33px',
                        "font-weight": 600,
                        background: 'transparent',
                        color: COLORS.discardGlow,
                        border: `2px dashed ${COLORS.discardGlow}`,
                        "border-radius": '4px',
                        cursor: 'pointer',
                        "white-space": 'nowrap',
                        "flex-shrink": 0,
                    }}
                >
                    🍂
                </button>
            </Show>
            <Switch>
                <Match when={props.highlightType === 'capture'}>
                    <div class="river-icon" style={{ color: COLORS.discardGlow }}>🫳</div>
                </Match>
                <Match when={props.highlightType === 'forced'}>
                    <div class="river-icon" style={{ color: COLORS.forcedGlow }}>🫳</div>
                </Match>
                <Match when={props.highlightType === 'drop'}>
                    <div class="river-icon" style={{ color: COLORS.discardGlow }}>🍂</div>
                </Match>
            </Switch>
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

function HandView(props: HandViewProps) {
    return (
        <div id={props.id} style={{
            display: 'flex',
            "flex-direction": 'row',
            gap: '6px',
            "justify-content": 'center',
            "flex-wrap": 'wrap',
        }}>
            <For each={props.cards}>{(card) => {
                const isRevealed = () => props.selectedCard && props.selectedCard.id === card.id;
                return (
                    <CardView
                        card={card}
                        faceDown={props.faceDown && !isRevealed()}
                        selected={!!isRevealed()}
                        highlighted={!!(props.highlightedIds?.has(card.id))}
                        onClick={props.onSelect ? () => { if (!props.faceDown) props.onSelect!(card); } : undefined}
                        onMouseEnter={props.onCardHover ? () => { if (!props.faceDown) props.onCardHover!(card); } : undefined}
                        onMouseLeave={props.onCardLeave}
                        disabled={props.disabled}
                    />
                );
            }}</For>
        </div>
    );
}

// --- CAPTURED AREA ---
interface CapturedViewProps {
    id?: string;
    cards: Card[];
    label: string;
}

function CapturedView(props: CapturedViewProps) {
    const computed = createMemo(() => {
        const cards = props.cards;
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

        const groupSizes = groups.map(g => g.cards.length).filter(s => s > 0);
        const groupsLength = groupSizes.length;

        console.log(props.id, groupSizes, groupsLength)
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
        console.log(width)

        return { groups, width, count: cards.length };
    });

    return (
        <>
            <span style={{
                color: COLORS.pink,
                "font-size": '11px',
                "font-weight": 600,
                "min-width": '60px',
                "padding-top": '2px',
            }}>
                {props.label} ({computed().count})
            </span>
            <div id={props.id}
                class='captured-card-groups'
                style={{
                    display: 'flex',
                    "flex-direction": 'row',
                    gap: '12px',
                    "align-items": 'flex-start',
                    padding: '4px 0',
                    "min-height": `${(CARD_H_SM + 8) * 2}px`,
                    "flex-wrap": 'wrap',
                    width: `${computed().width * (CARD_W_SM + 2)}px`,
                    // background: "#f0f"
                }}>
                {computed().groups.map(g => (
                    <Show when={g.cards.length > 0}>
                        <div
                            class='captured-card-group'
                            style={{
                                gap: '2px',
                                display: 'flex',
                                "align-items": 'center',
                                flex: '0 1 auto'
                            }}>
                            <span style={{ "font-size": '9px', color: g.color, "margin-right": '2px' }}>
                                {g.cards.length}
                            </span>
                            <For each={g.cards}>{(c) =>
                                <CardView card={c} small style={{ width: `${CARD_W_SM}px`, height: `${CARD_H_SM}px` }} />
                            }</For>
                        </div>
                    </Show>
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

function YakuList(props: YakuListProps) {
    const result = createMemo(() => computeYaku(props.captured));
    return (
        <Show when={result().yakuList.length > 0}>
            <div style={{ "font-size": '11px', color: COLORS.red, padding: '2px 8px' }}>
                <span style={{ "font-weight": 600 }}>{props.label}: </span>
                {result().yakuList.map(y => `${y.name} (${y.points})`).join(', ')}
                <span style={{ "margin-left": '6px', "font-weight": 700 }}>= {result().total}</span>
            </div>
        </Show>
    );
}

// --- MAIN COMPONENT ---
export function FlowerRivers() {
    const [state, setState] = createStore<GameState>(makeInitialState());
    const dispatch = (action: GameAction) => {
        setState(reconcile(gameReducer(state, action)));
    };
    const [aiDelay] = createSignal(false);
    const [hoveredRiver, setHoveredRiver] = createSignal<number | null>(null);
    const [hoveredHandCard, setHoveredHandCard] = createSignal<Card | null>(null);
    const [revealedAiCard, setRevealedAiCard] = createSignal<Card | null>(null);

    const resetHover = () => {
        setHoveredRiver(null);
        setHoveredHandCard(null);
    };

    const isHumanDealer = createMemo(() => state.dealerIdx === 0);
    const isHumanCapturer = createMemo(() => state.capturerIdx === 0);

    createEffect(() => { if (state.message) console.log('message:', state.message); });

    // --- AI EFFECTS ---
    // Auto-draw: whenever it's the dealing phase and no card is drawn yet, draw automatically
    createEffect(() => {
        if (state.phase !== 'DEALING' || state.drawnCard) return;
        const delay = isHumanDealer() ? 200 : 300;
        const timer = setTimeout(() => {
            dispatch({ type: 'DRAW_CARD' });
        }, delay);
        onCleanup(() => clearTimeout(timer));
    });

    // AI dealing: drop drawn cards
    createEffect(() => {
        if (state.phase !== 'DEALING' || isHumanDealer() || !state.drawnCard) return;
        if (aiDelay()) return;

        const timer = setTimeout(() => {
            const ri = aiChooseRiver(state);
            dispatch({ type: 'DROP_IN_RIVER', riverIdx: ri });
        }, 500);

        onCleanup(() => clearTimeout(timer));
    });

    // AI capturing
    createEffect(() => {
        if (state.phase !== 'CAPTURING' || isHumanCapturer()) return;

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

        onCleanup(() => { clearTimeout(timer); setRevealedAiCard(null); });
    });

    // AI forced capture
    createEffect(() => {
        if (state.phase !== 'FORCED_CAPTURE' || isHumanCapturer()) return;

        const timer = setTimeout(() => {
            const card = aiChooseForcedCaptureCard(state);
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: state.lightningRiver!, handCard: card });
        }, 700);

        onCleanup(() => clearTimeout(timer));
    });

    // AI yaku choice (koikoi or stop)
    createEffect(() => {
        if (state.phase !== 'YAKU_CHOICE' || state.yakuPlayer !== 1) return;

        const timer = setTimeout(() => {
            const koikoi = aiDecideKoikoi(state);
            dispatch({ type: koikoi ? 'CALL_KOIKOI' : 'CALL_STOP' });
        }, 1000);

        onCleanup(() => clearTimeout(timer));
    });

    // --- HUMAN HANDLERS ---
    const handleDropInRiver = (ri: number) => {
        if (state.phase === 'DEALING' && isHumanDealer() && state.drawnCard) {
            dispatch({ type: 'DROP_IN_RIVER', riverIdx: ri });
        }
    };

    const handleSelectCard = (card: Card) => {
        console.log("handleSelectCard")
        if ((state.phase === 'CAPTURING' || state.phase === 'FORCED_CAPTURE') && isHumanCapturer()) {
            dispatch({ type: 'SELECT_HAND_CARD', card });
        }
    };

    const handleRiverClick = (ri: number) => {
        if (state.phase === 'DEALING' && isHumanDealer() && state.drawnCard) {
            handleDropInRiver(ri);
            return;
        }
        if (!state.selectedHandCard || !isHumanCapturer()) return;

        if (state.phase === 'FORCED_CAPTURE') {
            if (ri === state.lightningRiver) {
                resetHover();
                dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: state.selectedHandCard });
            }
            return;
        }

        // Clicking the river body captures (if valid)
        if (state.phase === 'CAPTURING' && canCaptureRiver(state.selectedHandCard, state.rivers[ri])) {
            resetHover();
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: state.selectedHandCard });
        }
    };

    const handleDiscard = (ri: number) => {
        if (state.phase !== 'CAPTURING' || !state.selectedHandCard || !isHumanCapturer()) return;
        resetHover();
        dispatch({ type: 'DISCARD_TO_RIVER', riverIdx: ri, handCard: state.selectedHandCard });
    };

    // --- DERIVED RENDER VALUES ---
    const getRiverHighlight = (ri: number): RiverHighlightType => {
        if (state.phase === 'DEALING' && isHumanDealer() && state.drawnCard && !state.riversUsedThisTurn[ri]) {
            return 'drop';
        }
        if (state.phase === 'FORCED_CAPTURE' && isHumanCapturer() && ri === state.lightningRiver) {
            return 'forced';
        }
        if (state.phase === 'CAPTURING' && isHumanCapturer() && state.selectedHandCard) {
            if (canCaptureRiver(state.selectedHandCard, state.rivers[ri])) return 'capture';
        }
        return null;
    };

    const showDiscardButton = (_ri: number): boolean => {
        return state.phase === 'CAPTURING' && isHumanCapturer() && state.selectedHandCard !== null;
    };

    const isCapturingPhase = createMemo(() =>
        (state.phase === 'CAPTURING' || state.phase === 'FORCED_CAPTURE') && isHumanCapturer()
    );

    const highlightedHandIds = createMemo(() => {
        const ids = new Set<string>();
        if (!isCapturingPhase()) return ids;
        if (hoveredRiver() !== null) {
            const river = state.rivers[hoveredRiver()!];
            if (river.length === 0) return ids;
            for (const card of state.hands[0]) {
                if (canCaptureRiver(card, river)) ids.add(card.id);
            }
            return ids;
        }
        for (const card of state.hands[0]) {
            for (let ri = 0; ri < 3; ri++) {
                if (state.rivers[ri].length > 0 && canCaptureRiver(card, state.rivers[ri])) {
                    ids.add(card.id);
                    break;
                }
            }
        }
        return ids;
    });

    const highlightedRiverSet = createMemo(() => {
        const set = new Set<number>();
        if (!isCapturingPhase()) return set;
        if (hoveredHandCard()) {
            for (let ri = 0; ri < 3; ri++) {
                if (state.rivers[ri].length > 0 && canCaptureRiver(hoveredHandCard()!, state.rivers[ri])) set.add(ri);
            }
            return set;
        } else {
            for (let ri = 0; ri < 3; ri++) {
                if (state.rivers[ri].length > 0 && state.hands[0].some(c => canCaptureRiver(c, state.rivers[ri]))) set.add(ri);
            }
            return set;
        }
    });

    const canHumanAct = createMemo(() =>
        (state.phase === 'DEALING' && isHumanDealer()) ||
        ((state.phase === 'CAPTURING' || state.phase === 'FORCED_CAPTURE') && isHumanCapturer())
    );

    const statusText = createMemo(() => {
        if (state.phase === 'DEALING' && isHumanDealer() && !state.drawnCard) {
            return `Turn ${state.turn} — Drawing... (${state.dealStep + 1}/3)`;
        } else if (state.phase === 'DEALING' && isHumanDealer() && state.drawnCard) {
            return `Drop ${state.drawnCard.name} in a river. (${state.dealStep + 1}/3)`;
        } else if (state.phase === 'CAPTURING' && isHumanCapturer() && !state.selectedHandCard) {
            return 'Select a card from your hand.';
        } else if (state.phase === 'CAPTURING' && isHumanCapturer() && state.selectedHandCard) {
            return 'Click a river to capture or discard.';
        } else if (state.phase === 'FORCED_CAPTURE' && isHumanCapturer() && !state.selectedHandCard) {
            return `Lightning! Select a card to capture River ${state.lightningRiver !== null ? state.lightningRiver + 1 : ''}.`;
        } else if (state.phase === 'FORCED_CAPTURE' && isHumanCapturer() && state.selectedHandCard) {
            return `Click River ${state.lightningRiver !== null ? state.lightningRiver + 1 : ''} to capture it.`;
        } else if (state.phase === 'DEALING' && !isHumanDealer()) {
            return 'AI is dealing...';
        } else if ((state.phase === 'CAPTURING' || state.phase === 'FORCED_CAPTURE') && !isHumanCapturer()) {
            return 'AI is choosing...';
        }
        return state.message;
    });

    // --- RENDER ---
    return (
        <Switch>
            {/* Menu screen */}
            <Match when={state.phase === 'MENU'}>
                <div id="menu-screen" style={{
                    display: 'flex', "flex-direction": 'column', "align-items": 'center',
                    "justify-content": 'center', height: '100vh', background: COLORS.bg,
                    "font-family": "'Inter', sans-serif", color: COLORS.white,
                }}>
                    <div id="menu-title" style={{ "font-size": '48px', "font-weight": 700, color: COLORS.red, "margin-bottom": '8px' }}>
                        Flower Rivers
                    </div>
                    <div id="menu-subtitle" style={{ "font-size": '16px', color: COLORS.pink, "margin-bottom": '32px' }}>
                        A Hanafuda game for two
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'START_GAME' })}
                        style={{
                            padding: '14px 48px', "font-size": '18px', "font-weight": 600,
                            background: COLORS.red, color: COLORS.bg, border: 'none',
                            "border-radius": '8px', cursor: 'pointer', "font-family": 'inherit',
                        }}
                    >
                        Start Game
                    </button>
                </div>
            </Match>

            {/* Round over screen */}
            <Match when={state.phase === 'ROUND_OVER'}>
                <div id="round-over-screen" style={{
                    display: 'flex', "flex-direction": 'column', "align-items": 'center',
                    "justify-content": 'center', height: '100vh', background: COLORS.bg,
                    "font-family": "'Inter', sans-serif", color: COLORS.white,
                }}>
                    <div id="round-over-title" style={{ "font-size": '32px', "font-weight": 700, color: COLORS.red, "margin-bottom": '16px' }}>
                        Round {state.round} Complete
                    </div>
                    <Show when={state.roundScoreInfo?.winner === -1}
                        fallback={
                            <div id="round-over-winner-info" style={{ "text-align": 'center', "margin-bottom": '16px' }}>
                                <div id="round-over-winner-text" style={{ "font-size": '20px', "margin-bottom": '8px' }}>
                                    {state.roundScoreInfo && state.roundScoreInfo.winner === 0 ? 'You' : 'AI'} won the round!
                                </div>
                                <For each={state.roundScoreInfo?.yakuList ?? []}>{(y) =>
                                    <div style={{ "font-size": '14px', color: COLORS.red }}>
                                        {y.name}: {y.points} pts
                                    </div>
                                }</For>
                                <div id="round-over-multiplier" style={{ "margin-top": '8px', "font-size": '13px', color: COLORS.pink }}>
                                    Base: {state.roundScoreInfo?.basePoints}
                                    {state.roundScoreInfo?.sevenBonus && ' × 2 (7+ bonus)'}
                                    {state.roundScoreInfo?.oppKoikoi !== undefined && state.roundScoreInfo.oppKoikoi! > 0 && ` × ${Math.pow(2, state.roundScoreInfo.oppKoikoi!)} (opponent koi-koi)`}
                                    {state.roundScoreInfo && state.roundScoreInfo.drawMultiplier > 1 && ` × ${state.roundScoreInfo.drawMultiplier} (draw bonus)`}
                                </div>
                                <div id="round-over-final-points" style={{ "font-size": '22px', "font-weight": 700, color: COLORS.red, "margin-top": '6px' }}>
                                    = {state.roundScoreInfo?.finalPoints} points
                                </div>
                            </div>
                        }
                    >
                        <div id="round-over-draw-info" style={{ "font-size": '18px', "margin-bottom": '12px' }}>
                            Draw! Points doubled next round.
                        </div>
                    </Show>
                    <div id="round-over-scores" style={{ "font-size": '16px', "margin-bottom": '20px' }}>
                        Score — You: {state.scores[0]} | AI: {state.scores[1]}
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
                        style={{
                            padding: '12px 40px', "font-size": '16px', "font-weight": 600,
                            background: COLORS.red, color: COLORS.bg, border: 'none',
                            "border-radius": '8px', cursor: 'pointer', "font-family": 'inherit',
                        }}
                    >
                        Next Round
                    </button>
                </div>
            </Match>

            {/* Game over screen */}
            <Match when={state.phase === 'GAME_OVER'}>
                <div id="game-over-screen" style={{
                    display: 'flex', "flex-direction": 'column', "align-items": 'center',
                    "justify-content": 'center', height: '100vh', background: COLORS.bg,
                    "font-family": "'Inter', sans-serif", color: COLORS.white,
                }}>
                    <div id="game-over-title" style={{ "font-size": '36px', "font-weight": 700, color: COLORS.red, "margin-bottom": '8px' }}>
                        Game Over
                    </div>
                    <Show when={state.roundScoreInfo && state.roundScoreInfo.winner !== -1}>
                        <div id="game-over-round-info" style={{ "text-align": 'center', "margin-bottom": '12px' }}>
                            <div id="game-over-round-text" style={{ "font-size": '16px', "margin-bottom": '6px' }}>
                                {state.roundScoreInfo!.winner === 0 ? 'You' : 'AI'} won the final round with {state.roundScoreInfo!.finalPoints} pts
                            </div>
                            <For each={state.roundScoreInfo!.yakuList}>{(y) =>
                                <div style={{ "font-size": '13px', color: COLORS.red }}>
                                    {y.name}: {y.points}
                                </div>
                            }</For>
                        </div>
                    </Show>
                    <Show when={state.roundScoreInfo && state.roundScoreInfo.winner === -1}>
                        <div id="game-over-draw-info" style={{ "font-size": '16px', "margin-bottom": '12px' }}>Final round was a draw.</div>
                    </Show>
                    <div id="game-over-scores" style={{ "font-size": '24px', "font-weight": 700, "margin-bottom": '8px' }}>
                        You: {state.scores[0]} — AI: {state.scores[1]}
                    </div>
                    <div id="game-over-winner" style={{ "font-size": '28px', color: COLORS.red, "font-weight": 700, "margin-bottom": '24px' }}>
                        {state.scores[0] > state.scores[1] ? 'You win!' : state.scores[0] < state.scores[1] ? 'AI wins!' : 'Tie game!'}
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'START_GAME' })}
                        style={{
                            padding: '12px 40px', "font-size": '16px', "font-weight": 600,
                            background: COLORS.red, color: COLORS.bg, border: 'none',
                            "border-radius": '8px', cursor: 'pointer', "font-family": 'inherit',
                        }}
                    >
                        Play Again
                    </button>
                </div>
            </Match>

            {/* Main game board */}
            <Match when={true}>
                <div id="game-board" style={{
                    display: 'flex', "flex-direction": 'column',
                    height: '100vh', background: COLORS.bg,
                    "font-family": "'Inter', sans-serif", color: COLORS.white,
                    overflow: 'hidden',
                }}>
                    {/* Top Bar */}
                    <div id="top-bar" style={{
                        display: 'flex', "justify-content": 'space-between', "align-items": 'center',
                        padding: '6px 16px', background: COLORS.dark,
                        "font-size": '13px', "flex-shrink": 0,
                    }}>
                        <span style={{ color: COLORS.pink, "font-weight": 700 }}>Flower Rivers</span>
                        <span>Round {state.round}/{TOTAL_ROUNDS} — Turn {state.turn}</span>
                        <span>
                            You: <b>{state.scores[0]}</b> | AI: <b>{state.scores[1]}</b>
                            <Show when={state.drawMultiplier > 1}>
                                <span style={{ color: COLORS.pink, "margin-left": '8px' }}>×{state.drawMultiplier} next!</span>
                            </Show>
                        </span>
                    </div>

                    {/* AI Area */}
                    <div id="ai-area" style={{
                        padding: '4px 16px',
                        gap: '16px',
                        "flex-shrink": 0,
                        "border-bottom": `1px solid ${COLORS.separator}`,
                        display: 'flex',
                    }}>
                        <div id="ai-hand-row" style={{
                            display: 'flex',
                            "align-items": 'center',
                            "justify-content": 'end',
                            gap: '12px',
                            "margin-bottom": '4px',
                            flex: '0 1 50%',
                        }}>
                            <HandView id="ai-hand" cards={state.hands[1]} faceDown disabled
                                selectedCard={revealedAiCard()}
                            />
                            <Show when={state.koikoiCounts[1] > 0}>
                                <span style={{ "font-size": '11px', color: COLORS.red, "font-weight": 700 }}>
                                    Koi-Koi ×{state.koikoiCounts[1]}
                                </span>
                            </Show>
                        </div>
                        <div id="ai-capture-row" style={{
                            flex: '0 1 50%',
                        }}>
                            <CapturedView id="ai-captured" cards={state.captured[1]} label="AI captured" />
                            <YakuList captured={state.captured[1]} label="AI yaku" />
                        </div>
                    </div>

                    {/* Deck + Rivers area */}
                    <div id="play-area" style={{
                        flex: 1, display: 'flex', "flex-direction": 'row',
                        padding: '8px 0px 8px 16px', gap: '16px', "min-height": 0,
                        overflow: 'hidden',
                    }}>
                        {/* Deck + Drawn card */}
                        <div id="deck-column" style={{
                            display: 'flex', "flex-direction": 'column',
                            "align-items": 'center', "justify-content": 'center',
                            gap: '10px', "min-width": '90px',
                        }}>
                            {/* Deck */}
                            <div id="deck" style={{ position: 'relative' }}>
                                <Show when={state.deck.length > 0}
                                    fallback={
                                        <div id="deck-empty" style={{
                                            width: `${CARD_W}px`, height: `${CARD_H}px`,
                                            border: `2px dashed ${COLORS.separator}`,
                                            "border-radius": '4px',
                                        }} />
                                    }
                                >
                                    <CardView card={CARDS[0]} faceDown />
                                </Show>
                                <span style={{
                                    position: 'absolute', bottom: '-14px', left: '50%',
                                    transform: 'translateX(-50%)',
                                    "font-size": '10px', color: COLORS.pink,
                                }}>
                                    {state.deck.length} left
                                </span>
                            </div>

                            {/* Drawn card */}
                            <div id="drawn-card" style={{ "margin-top": '8px', width: `${CARD_W}px`, height: `${CARD_H}px`, "flex-shrink": 0 }}>
                                <Show when={state.drawnCard}>
                                    <CardView card={state.drawnCard!} />
                                </Show>
                            </div>

                            {/* Dealing indicator */}
                            <Show when={state.phase === 'DEALING'}>
                                <div id="deal-indicator" style={{ "font-size": '11px', color: COLORS.pink, "text-align": 'center', "white-space": 'nowrap' }}>
                                    Deal {state.dealStep + 1}/3
                                </div>
                            </Show>
                        </div>

                        {/* Rivers */}
                        <div id="rivers-column" style={{
                            flex: 1, display: 'flex', "flex-direction": 'column',
                            gap: '12px', "justify-content": 'center',
                            overflow: 'auto',
                        }}>
                            <For each={state.rivers}>{(river, ri) =>
                                <RiverView
                                    cards={river}
                                    index={ri()}
                                    highlightType={getRiverHighlight(ri())}
                                    hoverHighlight={!!(highlightedRiverSet()?.has(ri()))}
                                    onClick={canHumanAct() ? () => handleRiverClick(ri()) : undefined}
                                    onDiscard={() => handleDiscard(ri())}
                                    showDiscard={showDiscardButton(ri())}
                                    onMouseEnter={isCapturingPhase() ? () => setHoveredRiver(ri()) : undefined}
                                    onMouseLeave={isCapturingPhase() ? () => setHoveredRiver(null) : undefined}
                                />
                            }</For>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div id="status-bar" style={{
                        padding: '6px 16px', "text-align": 'center',
                        "font-size": '14px', "font-weight": 500,
                        background: COLORS.dark,
                        color: COLORS.white,
                        "flex-shrink": 0,
                        "min-height": '32px',
                    }}>
                        {statusText()}
                    </div>

                    {/* Yaku Choice Dialog */}
                    <Show when={state.phase === 'YAKU_CHOICE' && state.yakuPlayer === 0}>
                        <div id="yaku-dialog-overlay" style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', "align-items": 'center', "justify-content": 'center',
                            background: COLORS.overlay, "z-index": 100,
                        }}>
                            <div id="yaku-dialog" style={{
                                background: COLORS.felt, border: `2px solid ${COLORS.red}`,
                                "border-radius": '12px', padding: '32px', "text-align": 'center',
                                "max-width": '400px',
                            }}>
                                <div id="yaku-dialog-title" style={{ "font-size": '22px', "font-weight": 700, color: COLORS.red, "margin-bottom": '12px' }}>
                                    Yaku!
                                </div>
                                <For each={state.newYaku}>{(y) =>
                                    <div style={{ "font-size": '16px', "margin-bottom": '4px' }}>
                                        {y.name} — {y.points} pts
                                    </div>
                                }</For>
                                <div id="yaku-dialog-total" style={{ margin: '16px 0 6px', "font-size": '14px', color: COLORS.pink }}>
                                    Total so far: {computeYaku(state.captured[0]).total} pts
                                    <Show when={state.koikoiCounts[1] > 0}>
                                        <span> (opponent called koi-koi ×{state.koikoiCounts[1]})</span>
                                    </Show>
                                </div>
                                <div id="yaku-dialog-buttons" style={{ display: 'flex', gap: '16px', "justify-content": 'center', "margin-top": '16px' }}>
                                    <button
                                        onClick={() => dispatch({ type: 'CALL_STOP' })}
                                        style={{
                                            padding: '10px 28px', "font-size": '15px', "font-weight": 600,
                                            background: COLORS.red, color: COLORS.bg, border: 'none',
                                            "border-radius": '6px', cursor: 'pointer', "font-family": 'inherit',
                                        }}
                                    >
                                        Stop
                                    </button>
                                    <button
                                        onClick={() => dispatch({ type: 'CALL_KOIKOI' })}
                                        style={{
                                            padding: '10px 28px', "font-size": '15px', "font-weight": 600,
                                            background: 'transparent', color: COLORS.red,
                                            border: `2px solid ${COLORS.red}`, "border-radius": '6px',
                                            cursor: 'pointer', "font-family": 'inherit',
                                        }}
                                    >
                                        Koi-Koi!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Human Area */}
                    <div id="human-area" style={{
                        padding: '4px 16px',
                        gap: '16px',
                        "flex-shrink": 0,
                        "border-top": `1px solid ${COLORS.separator}`,
                        display: 'flex',
                    }}>
                        <div id="human-hand-row" style={{
                            display: 'flex',
                            "align-items": 'center',
                            "justify-content": 'end',
                            gap: '12px',
                            "margin-top": '4px',
                            flex: '1 1 50%',
                        }}>
                            <HandView
                                id="human-hand"
                                cards={state.hands[0]}
                                selectedCard={state.selectedHandCard}
                                onSelect={handleSelectCard}
                                disabled={!((state.phase === 'CAPTURING' || state.phase === 'FORCED_CAPTURE') && isHumanCapturer())}
                                highlightedIds={highlightedHandIds()}
                                onCardHover={isCapturingPhase() ? (card: Card) => setHoveredHandCard(card) : undefined}
                                onCardLeave={isCapturingPhase() ? () => setHoveredHandCard(null) : undefined}
                            />
                            <Show when={state.koikoiCounts[0] > 0}>
                                <span style={{ "font-size": '11px', color: COLORS.red, "font-weight": 700 }}>
                                    Koi-Koi ×{state.koikoiCounts[0]}
                                </span>
                            </Show>
                        </div>
                        <div id="human-capture-row" style={{
                            flex: '1 1 50%',
                        }}>
                            <CapturedView id="human-captured" cards={state.captured[0]} label="Yours captured" />
                            <YakuList captured={state.captured[0]} label="Your yaku" />
                        </div>
                    </div>
                </div>
            </Match>
        </Switch>
    );
}
