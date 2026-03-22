const { useEffect, useReducer, useState } = React;

// --- DECK DEFINITION ---
const getWikiUrl = (filename) => `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;

const CARDS = [
    // 1: Pine
    { id: '1-bright', month: 1, type: 'bright', name: 'Pine Crane', img: getWikiUrl('Hanafuda_January_Hikari.svg') },
    { id: '1-ribbon', month: 1, type: 'ribbon', name: 'Pine Poetry', img: getWikiUrl('Hanafuda_January_Tanzaku.svg') },
    { id: '1-junk-1', month: 1, type: 'junk', name: 'Pine', img: getWikiUrl('Hanafuda_January_Kasu_1.svg') },
    { id: '1-junk-2', month: 1, type: 'junk', name: 'Pine', img: getWikiUrl('Hanafuda_January_Kasu_2.svg') },
    // 2: Plum
    { id: '2-animal', month: 2, type: 'animal', name: 'Plum Nightingale', img: getWikiUrl('Hanafuda_February_Tane.svg') },
    { id: '2-ribbon', month: 2, type: 'ribbon', name: 'Plum Poetry', img: getWikiUrl('Hanafuda_February_Tanzaku.svg') },
    { id: '2-junk-1', month: 2, type: 'junk', name: 'Plum', img: getWikiUrl('Hanafuda_February_Kasu_1.svg') },
    { id: '2-junk-2', month: 2, type: 'junk', name: 'Plum', img: getWikiUrl('Hanafuda_February_Kasu_2.svg') },
    // 3: Cherry
    { id: '3-bright', month: 3, type: 'bright', name: 'Cherry Curtain', img: getWikiUrl('Hanafuda_March_Hikari.svg') },
    { id: '3-ribbon', month: 3, type: 'ribbon', name: 'Cherry Poetry', img: getWikiUrl('Hanafuda_March_Tanzaku.svg') },
    { id: '3-junk-1', month: 3, type: 'junk', name: 'Cherry', img: getWikiUrl('Hanafuda_March_Kasu_1.svg') },
    { id: '3-junk-2', month: 3, type: 'junk', name: 'Cherry', img: getWikiUrl('Hanafuda_March_Kasu_2.svg') },
    // 4: Wisteria
    { id: '4-animal', month: 4, type: 'animal', name: 'Wisteria Cuckoo', img: getWikiUrl('Hanafuda_April_Tane.svg') },
    { id: '4-ribbon', month: 4, type: 'ribbon', name: 'Wisteria Plain', img: getWikiUrl('Hanafuda_April_Tanzaku.svg') },
    { id: '4-junk-1', month: 4, type: 'junk', name: 'Wisteria', img: getWikiUrl('Hanafuda_April_Kasu_1.svg') },
    { id: '4-junk-2', month: 4, type: 'junk', name: 'Wisteria', img: getWikiUrl('Hanafuda_April_Kasu_2.svg') },
    // 5: Iris
    { id: '5-animal', month: 5, type: 'animal', name: 'Iris Bridge', img: getWikiUrl('Hanafuda_May_Tane.svg') },
    { id: '5-ribbon', month: 5, type: 'ribbon', name: 'Iris Plain', img: getWikiUrl('Hanafuda_May_Tanzaku.svg') },
    { id: '5-junk-1', month: 5, type: 'junk', name: 'Iris', img: getWikiUrl('Hanafuda_May_Kasu_1.svg') },
    { id: '5-junk-2', month: 5, type: 'junk', name: 'Iris', img: getWikiUrl('Hanafuda_May_Kasu_2.svg') },
    // 6: Peony
    { id: '6-animal', month: 6, type: 'animal', name: 'Peony Butterflies', img: getWikiUrl('Hanafuda_June_Tane.svg') },
    { id: '6-ribbon', month: 6, type: 'ribbon', name: 'Peony Blue', img: getWikiUrl('Hanafuda_June_Tanzaku.svg') },
    { id: '6-junk-1', month: 6, type: 'junk', name: 'Peony', img: getWikiUrl('Hanafuda_June_Kasu_1.svg') },
    { id: '6-junk-2', month: 6, type: 'junk', name: 'Peony', img: getWikiUrl('Hanafuda_June_Kasu_2.svg') },
    // 7: Bush Clover
    { id: '7-animal', month: 7, type: 'animal', name: 'Clover Boar', img: getWikiUrl('Hanafuda_July_Tane.svg') },
    { id: '7-ribbon', month: 7, type: 'ribbon', name: 'Clover Plain', img: getWikiUrl('Hanafuda_July_Tanzaku.svg') },
    { id: '7-junk-1', month: 7, type: 'junk', name: 'Clover', img: getWikiUrl('Hanafuda_July_Kasu_1.svg') },
    { id: '7-junk-2', month: 7, type: 'junk', name: 'Clover', img: getWikiUrl('Hanafuda_July_Kasu_2.svg') },
    // 8: Pampas
    { id: '8-bright', month: 8, type: 'bright', name: 'Pampas Moon', img: getWikiUrl('Hanafuda_August_Hikari.svg') },
    { id: '8-animal', month: 8, type: 'animal', name: 'Pampas Geese', img: getWikiUrl('Hanafuda_August_Tane.svg') },
    { id: '8-junk-1', month: 8, type: 'junk', name: 'Pampas', img: getWikiUrl('Hanafuda_August_Kasu_1.svg') },
    { id: '8-junk-2', month: 8, type: 'junk', name: 'Pampas', img: getWikiUrl('Hanafuda_August_Kasu_2.svg') },
    // 9: Chrysanthemum
    { id: '9-animal', month: 9, type: 'animal', name: 'Chrysanthemum Sake', img: getWikiUrl('Hanafuda_September_Tane.svg') },
    { id: '9-ribbon', month: 9, type: 'ribbon', name: 'Chrysanthemum Blue', img: getWikiUrl('Hanafuda_September_Tanzaku.svg') },
    { id: '9-junk-1', month: 9, type: 'junk', name: 'Chrysanthemum', img: getWikiUrl('Hanafuda_September_Kasu_1.svg') },
    { id: '9-junk-2', month: 9, type: 'junk', name: 'Chrysanthemum', img: getWikiUrl('Hanafuda_September_Kasu_2.svg') },
    // 10: Maple
    { id: '10-animal', month: 10, type: 'animal', name: 'Maple Deer', img: getWikiUrl('Hanafuda_October_Tane.svg') },
    { id: '10-ribbon', month: 10, type: 'ribbon', name: 'Maple Blue', img: getWikiUrl('Hanafuda_October_Tanzaku.svg') },
    { id: '10-junk-1', month: 10, type: 'junk', name: 'Maple', img: getWikiUrl('Hanafuda_October_Kasu_1.svg') },
    { id: '10-junk-2', month: 10, type: 'junk', name: 'Maple', img: getWikiUrl('Hanafuda_October_Kasu_2.svg') },
    // 11: Willow
    { id: '11-bright-rainman', month: 11, type: 'bright', name: 'Willow Rain Man', img: getWikiUrl('Hanafuda_November_Hikari.svg') },
    { id: '11-animal', month: 11, type: 'animal', name: 'Willow Swallow', img: getWikiUrl('Hanafuda_November_Tane.svg') },
    { id: '11-ribbon', month: 11, type: 'ribbon', name: 'Willow Plain', img: getWikiUrl('Hanafuda_November_Tanzaku.svg') },
    { id: '11-junk-lightning', month: 11, type: 'junk', name: 'Willow Lightning', img: getWikiUrl('Hanafuda_November_Kasu.svg') },
    // 12: Paulownia
    { id: '12-bright', month: 12, type: 'bright', name: 'Paulownia Phoenix', img: getWikiUrl('Hanafuda_December_Hikari.svg') },
    { id: '12-junk-1', month: 12, type: 'junk', name: 'Paulownia', img: getWikiUrl('Hanafuda_December_Kasu_1.svg') },
    { id: '12-junk-2', month: 12, type: 'junk', name: 'Paulownia', img: getWikiUrl('Hanafuda_December_Kasu_2.svg') },
    { id: '12-junk-3', month: 12, type: 'junk', name: 'Paulownia', img: getWikiUrl('Hanafuda_December_Kasu_3.svg') }
];

const CARD_BACK_URL = getWikiUrl('Hanafuda_card_back.svg');

// PRELOAD IMAGES immediately so they are cached by the time the user clicks Start
// Keep references alive at module scope to prevent GC before download completes
const _preloaded = typeof window !== 'undefined'
    ? [...CARDS.map(c => c.img), CARD_BACK_URL].map(url => {
        const img = new Image();
        img.src = url;
        return img;
    })
    : [];

// --- CARD HELPERS ---
const isLightning = (c) => c.id === '11-junk-lightning';
const isRainMan = (c) => c.id === '11-bright-rainman';
const isWillow = (c) => c.month === 11;

const hasCard = (cards, id) => cards.some(c => c.id === id);
const countType = (cards, type) => cards.filter(c => c.type === type).length;

// --- YAKU DEFINITIONS ---
const YAKU_DEFS = [
    {
        name: 'Five Brights', points: 15, isJunk: false,
        check: (c) => countType(c, 'bright') === 5,
        group: 'bright', rank: 5,
    },
    {
        name: 'Four Brights', points: 8, isJunk: false,
        check: (c) => countType(c, 'bright') === 4 && !hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 4,
    },
    {
        name: 'Rainy Four Brights', points: 7, isJunk: false,
        check: (c) => countType(c, 'bright') >= 4 && hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 3,
    },
    {
        name: 'Three Brights', points: 6, isJunk: false,
        check: (c) => countType(c, 'bright') >= 3 && !hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 2,
    },
    {
        name: 'Poetry Ribbons', points: 5, isJunk: false,
        check: (c) => hasCard(c, '1-ribbon') && hasCard(c, '2-ribbon') && hasCard(c, '3-ribbon'),
    },
    {
        name: 'Blue Ribbons', points: 5, isJunk: false,
        check: (c) => hasCard(c, '6-ribbon') && hasCard(c, '9-ribbon') && hasCard(c, '10-ribbon'),
    },
    {
        name: 'Boar-Deer-Butterfly', points: 5, isJunk: false,
        check: (c) => hasCard(c, '7-animal') && hasCard(c, '10-animal') && hasCard(c, '6-animal'),
    },
    {
        name: 'Flower Viewing', points: 3, isJunk: false,
        check: (c) => hasCard(c, '3-bright') && hasCard(c, '9-animal'),
    },
    {
        name: 'Moon Viewing', points: 3, isJunk: false,
        check: (c) => hasCard(c, '8-bright') && hasCard(c, '9-animal'),
    },
    {
        name: 'Animals', points: 1, isJunk: false,
        check: (c) => countType(c, 'animal') >= 5,
        extra: (c) => Math.max(0, countType(c, 'animal') - 5),
    },
    {
        name: 'Ribbons', points: 1, isJunk: false,
        check: (c) => countType(c, 'ribbon') >= 5,
        extra: (c) => Math.max(0, countType(c, 'ribbon') - 5),
    },
    {
        name: 'Junk', points: 1, isJunk: true,
        check: (c) => countType(c, 'junk') >= 10,
        extra: (c) => Math.max(0, countType(c, 'junk') - 10),
    },
];

function computeYaku(captured) {
    const matched = [];
    let bestBright = null;
    for (const y of YAKU_DEFS) {
        if (!y.check(captured)) continue;
        if (y.group === 'bright') {
            if (!bestBright || y.rank > bestBright.rank) bestBright = y;
        } else {
            const pts = y.points + (y.extra ? y.extra(captured) : 0);
            matched.push({ name: y.name, points: pts, isJunk: y.isJunk });
        }
    }
    if (bestBright) {
        matched.unshift({ name: bestBright.name, points: bestBright.points, isJunk: false });
    }
    const total = matched.reduce((s, m) => s + m.points, 0);
    return { yakuList: matched, total };
}

function nonJunkPoints(yakuList) {
    return yakuList.filter(y => !y.isJunk).reduce((s, y) => s + y.points, 0);
}

// --- GAME HELPERS ---
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function canCaptureRiver(handCard, river) {
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

function riverHasLightningCard(river) {
    return river.some(isLightning);
}

function dealNewRound(deckIn) {
    const d = shuffle(deckIn);
    return {
        deck: d.slice(12),
        hands: [d.slice(0, 6), d.slice(6, 12)],
        rivers: [[], [], []],
    };
}

// --- CONSTANTS ---
const TOTAL_ROUNDS = 3;
const TURNS_PER_ROUND = 6; // each player has 6 hand cards, one used per turn

// Phases: MENU, DEALING, CAPTURING, FORCED_CAPTURE, YAKU_CHOICE, ROUND_OVER, GAME_OVER
function makeInitialState() {
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
        lightningRiver: null, // river index forced by lightning deal
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
        aiAction: null, // queued AI action descriptor
        roundScoreInfo: null, // breakdown shown at round end
    };
}

function startRound(state) {
    const deal = dealNewRound(CARDS);
    return {
        ...state,
        phase: 'DEALING',
        deck: deal.deck,
        hands: deal.hands,
        captured: [[], []],
        rivers: deal.rivers,
        dealerIdx: (state.round - 1) % 2,
        capturerIdx: ((state.round - 1) + 1) % 2,
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

function gameReducer(state, action) {
    console.dir(action);
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

        case 'PLACE_IN_RIVER': {
            if (state.phase !== 'DEALING' || !state.drawnCard) return state;
            const { riverIdx } = action;
            if (state.riversUsedThisTurn[riverIdx]) return state;

            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [...r, state.drawnCard] : [...r]
            );
            const newUsed = [...state.riversUsedThisTurn];
            newUsed[riverIdx] = true;
            const nextStep = state.dealStep + 1;

            // Check if lightning was placed
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
                        : 'AI places cards...',
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
            return { ...state, selectedHandCard: action.card };
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
            );
            // Add river cards + hand card to captured
            const capturedCards = [...river, card];
            const newCaptured = state.captured.map((cp, i) =>
                i === who ? [...cp, ...capturedCards] : [...cp]
            );
            // Clear the river
            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [] : [...r]
            );

            // Check yaku — trigger choice if non-junk points increased
            const yaku = computeYaku(newCaptured[who]);
            const currentNonJunk = nonJunkPoints(yaku.yakuList);
            const improved = currentNonJunk > state.previousPoints[who];

            if (improved) {
                const newPrev = [...state.previousPoints];
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
            );
            const newRivers = state.rivers.map((r, i) =>
                i === riverIdx ? [...r, card] : [...r]
            );

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

            const newScores = [...state.scores];
            newScores[winner] += pts;

            const roundScoreInfo = {
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
            const newKoikoi = [...state.koikoiCounts];
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

function advanceTurn(state) {
    const nextTurn = state.turn + 1;
    // Check if round is over (both players out of cards)
    if (state.hands[0].length === 0 && state.hands[1].length === 0) {
        // Draw — no one stopped
        const drawMultiplier = state.drawMultiplier * 2;
        const roundScoreInfo = {
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
function aiScoreCapture(aiCaptured, riverCards, handCard) {
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

// AI chooses where to place a drawn card (dealing phase)
// Does NOT look at opponent's hand — infers threat from their captured cards
function aiChooseRiver(state) {
    const available = [0, 1, 2].filter(i => !state.riversUsedThisTurn[i]);
    if (available.length === 0) return 0;
    if (available.length === 1) return available[0];

    const card = state.drawnCard;
    const aiHand = state.hands[1];
    const oppCaptured = state.captured[0];

    // Infer which specific cards the opponent wants based on yaku progress
    const oppWantedIds = new Set();
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

        // Prefer placing in already-matching rivers (month consolidation)
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

// AI chooses capture or discard action
function aiChooseCaptureAction(state) {
    const aiHand = state.hands[1];
    const aiCaptured = state.captured[1];

    let bestAction = null;
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
function aiChooseForcedCaptureCard(state) {
    const aiHand = state.hands[1];
    const ri = state.lightningRiver;
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
function aiDecideKoikoi(state) {
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
    bgLight: 'var(--color-bg-light)',
    felt: 'var(--color-felt)',
    dark: 'var(--color-dark)',
    darkOverlay: 'var(--color-dark-overlay)',
    gold: 'var(--color-gold)',
    pink: 'var(--color-pink)',
    white: 'var(--color-text)',
    red: 'var(--color-red)',
    blue: 'var(--color-blue)',
    highlight: 'var(--color-highlight)',
    captureGlow: 'var(--color-capture-glow)',
    discardGlow: 'var(--color-discard-glow)',
    forcedGlow: 'var(--color-forced-glow)',
    hoverGlow: 'var(--color-hover-glow)',
    riverFrom: 'var(--color-river-from)',
    riverMid: 'var(--color-river-mid)',
    riverTo: 'var(--color-river-to)',
    separator: 'var(--color-separator)',
    cardShadow: 'var(--color-card-shadow)',
    overlay: 'var(--color-overlay)',
};

// --- CARD COMPONENT ---
function CardView({ card, faceDown, onClick, selected, small, disabled, highlighted, onMouseEnter, onMouseLeave, style: extraStyle }) {
    const w = small ? CARD_W_SM : CARD_W;
    const h = small ? CARD_H_SM : CARD_H;
    const src = faceDown ? CARD_BACK_URL : card.img;

    const baseStyle = {
        width: w,
        height: h,
        borderRadius: 4,
        cursor: onClick && !disabled ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        transform: selected ? 'translateY(-8px)' : 'none',
        boxShadow: selected
            ? `0 4px 16px ${COLORS.red}`
            : highlighted
                ? `0 0 10px 3px ${COLORS.captureGlow}`
                : `0 1px 4px ${COLORS.cardShadow}`,
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
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
function RiverView({ cards, index, onClick, onDiscard, highlightType, hoverHighlight, showDiscard, label, onMouseEnter, onMouseLeave }) {
    const borderColor =
        highlightType === 'capture' ? COLORS.captureGlow
            : highlightType === 'forced' ? COLORS.forcedGlow
                : highlightType === 'place' ? COLORS.discardGlow
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
                padding: '6px 10px',
                minHeight: CARD_H_RIVER + 16,
                background: `linear-gradient(160deg, ${COLORS.riverFrom}, ${COLORS.riverMid})`,
                opacity: hoverHighlight && !highlightType ? 0.85 : 1,
                borderStyle: 'solid',
                borderColor: borderColor,
                borderWidth: '2px 0 2px 2px',
                borderRadius: '8px 0 0 8px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'border-color 0.2s, background 0.2s',
                position: 'relative',
                minWidth: 120,
            }}
        >
            <span style={{
                position: 'absolute',
                top: 2,
                left: 8,
                fontSize: 10,
                color: COLORS.pink,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: 'uppercase',
            }}>
                {label}
                {hasRainManCard && !hasLightningCard && ' 🌧'}
                {hasLightningCard && ' ⚡'}
            </span>
            {cards.length === 0 && (
                <div style={{ width: CARD_W_RIVER, height: CARD_H_RIVER, marginTop: 12, flexShrink: 0 }} />
            )}
            {cards.map(card => (
                <CardView
                    key={card.id}
                    card={card}
                    small={false}
                    style={{ width: CARD_W_RIVER, height: CARD_H_RIVER, marginTop: 12 }}
                />
            ))}
            {showDiscard && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDiscard(); }}
                    style={{
                        marginTop: 13,
                        width: CARD_W_RIVER,
                        height: CARD_H_RIVER,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'transparent',
                        color: COLORS.white,
                        border: `2px dashed ${COLORS.discardGlow}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    Discard
                </button>
            )}
        </div>
    );
}

// --- HAND COMPONENT ---
function HandView({ id, cards, faceDown, selectedCard, onSelect, disabled, highlightedIds, onCardHover, onCardLeave }) {
    return (
        <div id={id} style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            flexWrap: 'wrap',
        }}>
            {cards.map(card => (
                <CardView
                    key={card.id}
                    card={card}
                    faceDown={faceDown}
                    selected={selectedCard && selectedCard.id === card.id}
                    highlighted={highlightedIds && highlightedIds.has(card.id)}
                    onClick={!faceDown && onSelect ? () => onSelect(card) : undefined}
                    onMouseEnter={!faceDown && onCardHover ? () => onCardHover(card) : undefined}
                    onMouseLeave={onCardLeave}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}

// --- CAPTURED AREA ---
function CapturedView({ id, cards, label }) {
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

    return (
        <div id={id} style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
            padding: '4px 0',
            minHeight: CARD_H_SM + 8,
        }}>
            <span style={{
                color: COLORS.red,
                fontSize: 11,
                fontWeight: 600,
                minWidth: 60,
                paddingTop: 2,
            }}>
                {label} ({cards.length})
            </span>
            {groups.map(g => g.cards.length > 0 && (
                <div key={g.name} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: g.color, marginRight: 2 }}>
                        {g.name[0]}{g.cards.length}
                    </span>
                    {g.cards.map(c => (
                        <CardView key={c.id} card={c} small style={{ width: CARD_W_SM, height: CARD_H_SM }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

// --- YAKU DISPLAY ---
function YakuList({ captured, label }) {
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
function FlowerRivers() {
    const [state, dispatch] = useReducer(gameReducer, null, makeInitialState);
    const [aiDelay, setAiDelay] = useState(false);
    const [hoveredRiver, setHoveredRiver] = useState(null);   // river index
    const [hoveredHandCard, setHoveredHandCard] = useState(null); // card object

    const {
        phase, deck, hands, captured, rivers, dealerIdx, capturerIdx,
        dealStep, drawnCard, riversUsedThisTurn, lightningRiver,
        selectedHandCard, koikoiCounts, scores, round, turn,
        drawMultiplier, newYaku, yakuPlayer, message, roundScoreInfo,
    } = state;

    const isHumanDealer = dealerIdx === 0;
    const isHumanCapturer = capturerIdx === 0;

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

    // AI dealing: place drawn cards
    useEffect(() => {
        if (phase !== 'DEALING' || isHumanDealer || !drawnCard) return;
        if (aiDelay) return;

        const timer = setTimeout(() => {
            const ri = aiChooseRiver(state);
            dispatch({ type: 'PLACE_IN_RIVER', riverIdx: ri });
        }, 500);

        return () => clearTimeout(timer);
    }, [phase, isHumanDealer, drawnCard, dealStep, aiDelay]);

    // AI capturing
    useEffect(() => {
        if (phase !== 'CAPTURING' || isHumanCapturer) return;

        const timer = setTimeout(() => {
            const action = aiChooseCaptureAction(state);
            if (action.type === 'capture') {
                dispatch({ type: 'CAPTURE_RIVER', riverIdx: action.riverIdx, handCard: action.card });
            } else {
                dispatch({ type: 'DISCARD_TO_RIVER', riverIdx: action.riverIdx, handCard: action.card });
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [phase, isHumanCapturer]);

    // AI forced capture
    useEffect(() => {
        if (phase !== 'FORCED_CAPTURE' || isHumanCapturer) return;

        const timer = setTimeout(() => {
            const card = aiChooseForcedCaptureCard(state);
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: lightningRiver, handCard: card });
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
    const handlePlaceInRiver = (ri) => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard) {
            dispatch({ type: 'PLACE_IN_RIVER', riverIdx: ri });
        }
    };

    const handleSelectCard = (card) => {
        if ((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer) {
            dispatch({ type: 'SELECT_HAND_CARD', card });
        }
    };

    const handleRiverClick = (ri) => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard) {
            handlePlaceInRiver(ri);
            return;
        }
        if (!selectedHandCard || !isHumanCapturer) return;

        if (phase === 'FORCED_CAPTURE') {
            if (ri === lightningRiver) {
                dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: selectedHandCard });
            }
            return;
        }

        // Clicking the river body captures (if valid)
        if (phase === 'CAPTURING' && canCaptureRiver(selectedHandCard, rivers[ri])) {
            dispatch({ type: 'CAPTURE_RIVER', riverIdx: ri, handCard: selectedHandCard });
        }
    };

    const handleDiscard = (ri) => {
        if (phase !== 'CAPTURING' || !selectedHandCard || !isHumanCapturer) return;
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
                    Flower Rivers
                </div>
                <div id="menu-subtitle" style={{ fontSize: 16, color: COLORS.pink, marginBottom: 32 }}>
                    A Hanafuda game for two
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
                {info.winner === -1 ? (
                    <div id="round-over-draw-info" style={{ fontSize: 18, marginBottom: 12 }}>
                        Draw! Points doubled next round.
                    </div>
                ) : (
                        <div id="round-over-winner-info" style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div id="round-over-winner-text" style={{ fontSize: 20, marginBottom: 8 }}>
                            {info.winner === 0 ? 'You' : 'AI'} won the round!
                        </div>
                        {info.yakuList.map(y => (
                            <div key={y.name} style={{ fontSize: 14, color: COLORS.red }}>
                                {y.name}: {y.points} pts
                            </div>
                        ))}
                            <div id="round-over-multiplier" style={{ marginTop: 8, fontSize: 13, color: COLORS.pink }}>
                            Base: {info.basePoints}
                            {info.sevenBonus && ' × 2 (7+ bonus)'}
                            {info.oppKoikoi > 0 && ` × ${Math.pow(2, info.oppKoikoi)} (opponent koi-koi)`}
                            {info.drawMultiplier > 1 && ` × ${info.drawMultiplier} (draw bonus)`}
                        </div>
                            <div id="round-over-final-points" style={{ fontSize: 22, fontWeight: 700, color: COLORS.red, marginTop: 6 }}>
                            = {info.finalPoints} points
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
    const getRiverHighlight = (ri) => {
        if (phase === 'DEALING' && isHumanDealer && drawnCard && !riversUsedThisTurn[ri]) {
            return 'place';
        }
        if (phase === 'FORCED_CAPTURE' && isHumanCapturer && ri === lightningRiver) {
            return 'forced';
        }
        if (phase === 'CAPTURING' && isHumanCapturer && selectedHandCard) {
            if (canCaptureRiver(selectedHandCard, rivers[ri])) return 'capture';
        }
        return null;
    };

    const showDiscardButton = (ri) => {
        return phase === 'CAPTURING' && isHumanCapturer && selectedHandCard !== null;
    };

    // Hover cross-highlighting
    const isCapturingPhase = (phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer;

    // Which hand card IDs to highlight (when hovering a river)
    const highlightedHandIds = (() => {
        if (!isCapturingPhase || hoveredRiver === null) return null;
        const river = rivers[hoveredRiver];
        if (river.length === 0) return null;
        const ids = new Set();
        for (const card of hands[0]) {
            if (canCaptureRiver(card, river)) ids.add(card.id);
        }
        return ids.size > 0 ? ids : null;
    })();

    // Which river indices to highlight (when hovering a hand card)
    const highlightedRiverSet = (() => {
        if (!isCapturingPhase || !hoveredHandCard) return null;
        const set = new Set();
        for (let ri = 0; ri < 3; ri++) {
            if (rivers[ri].length > 0 && canCaptureRiver(hoveredHandCard, rivers[ri])) set.add(ri);
        }
        return set.size > 0 ? set : null;
    })();

    const canHumanAct =
        (phase === 'DEALING' && isHumanDealer) ||
        ((phase === 'CAPTURING' || phase === 'FORCED_CAPTURE') && isHumanCapturer);

    // Status message
    let statusText = message;
    if (phase === 'DEALING' && isHumanDealer && !drawnCard) {
        statusText = `Turn ${turn} — Drawing... (${dealStep + 1}/3)`;
    } else if (phase === 'DEALING' && isHumanDealer && drawnCard) {
        statusText = `Place ${drawnCard.name} in a river. (${dealStep + 1}/3)`;
    } else if (phase === 'CAPTURING' && isHumanCapturer && !selectedHandCard) {
        statusText = 'Select a card from your hand.';
    } else if (phase === 'CAPTURING' && isHumanCapturer && selectedHandCard) {
        statusText = 'Click a river to capture or discard.';
    } else if (phase === 'FORCED_CAPTURE' && isHumanCapturer && !selectedHandCard) {
        statusText = `Lightning! Select a card to capture River ${lightningRiver + 1}.`;
    } else if (phase === 'FORCED_CAPTURE' && isHumanCapturer && selectedHandCard) {
        statusText = `Click River ${lightningRiver + 1} to capture it.`;
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
                <span style={{ color: COLORS.red, fontWeight: 700 }}>Flower Rivers</span>
                <span>Round {round}/{TOTAL_ROUNDS} — Turn {turn}</span>
                <span>
                    You: <b>{scores[0]}</b> | AI: <b>{scores[1]}</b>
                    {drawMultiplier > 1 && (
                        <span style={{ color: COLORS.red, marginLeft: 8 }}>×{drawMultiplier} next!</span>
                    )}
                </span>
            </div>

            {/* AI Area */}
            <div id="ai-area" style={{
                padding: '4px 16px', flexShrink: 0,
                borderBottom: `1px solid ${COLORS.separator}`,
            }}>
                <div id="ai-hand-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: COLORS.pink, minWidth: 30 }}>AI</span>
                    <HandView id="ai-hand" cards={hands[1]} faceDown disabled />
                    {koikoiCounts[1] > 0 && (
                        <span style={{ fontSize: 11, color: COLORS.red, fontWeight: 700 }}>
                            Koi-Koi ×{koikoiCounts[1]}
                        </span>
                    )}
                </div>
                <CapturedView id="ai-captured" cards={captured[1]} label="AI captured" />
                <YakuList captured={captured[1]} label="AI yaku" />
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
                    gap: 8, justifyContent: 'center',
                    overflow: 'auto',
                }}>
                    {rivers.map((river, ri) => (
                        <RiverView
                            key={ri}
                            cards={river}
                            index={ri}
                            label={`River ${ri + 1}`}
                            highlightType={getRiverHighlight(ri)}
                            hoverHighlight={highlightedRiverSet && highlightedRiverSet.has(ri)}
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
                padding: '4px 16px', flexShrink: 0,
                borderTop: `1px solid ${COLORS.separator}`,
            }}>
                <CapturedView id="human-captured" cards={captured[0]} label="Your captured" />
                <YakuList captured={captured[0]} label="Your yaku" />
                <div id="human-hand-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: COLORS.pink, minWidth: 30 }}>You</span>
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
            </div>
        </div>
    );
}
