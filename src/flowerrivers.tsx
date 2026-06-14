import { useEffect, useReducer, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { Card, GameState, RiverHighlightType } from "./types";
import { cardImageById, images } from "./cardImages";
import { isLightning, isRainMan } from "./cards";
import { computeYaku } from "./yaku";
import { Flipped, Flipper } from "react-flip-toolkit";
import {
    canCaptureRiver,
    gameReducer,
    makeInitialState,
    playerName,
    TOTAL_ROUNDS,
} from "./game";
import {
    type CPUPlayer,
    randomizeRedealOppBlurOwnCaptures,
} from "../src/cpu/cpu";
import { SimpleMCTSPlayer } from "../src/cpu/simple_mcts";

// CPU players:
const cpu: CPUPlayer = new SimpleMCTSPlayer({
    stop_bias: true,
    randomize: randomizeRedealOppBlurOwnCaptures,
    budget: {
        DEALING: 8000,
        CAPTURING: 8000,
        FORCED_CAPTURE: 4000,
        YAKU_CHOICE: 4000,
    },
});

// --- CPU ADAPTERS ---
// The CPU returns a generic GameAction; these helpers narrow it down for each
// of the UI's CPU-effect hooks (so the UI can show the chosen card before the
// reducer applies the action, etc.).

type cpuAction =
    | { type: "capture"; card: Card; riverIdx: number }
    | { type: "discard"; card: Card; riverIdx: number };

function cpuChooseRiver(state: GameState): number {
    const action = cpu.chooseAction(state);
    if (action.type === "DROP_IN_RIVER") return action.riverIdx;
    throw "Illegal choice";
}

function cpuChooseCaptureAction(state: GameState): cpuAction {
    const action = cpu.chooseAction(state);
    if (action.type === "CAPTURE_RIVER" && action.handCard) {
        return {
            type: "capture",
            card: action.handCard,
            riverIdx: action.riverIdx,
        };
    }
    if (action.type === "DISCARD_TO_RIVER" && action.handCard) {
        return {
            type: "discard",
            card: action.handCard,
            riverIdx: action.riverIdx,
        };
    }
    throw "Illegal choice";
}

function cpuChooseForcedCaptureCard(state: GameState): Card {
    const action = cpu.chooseAction(state);
    if (action.type === "CAPTURE_RIVER" && action.handCard)
        return action.handCard;
    throw "Illegal choice";
}

function cpuDecideKoikoi(state: GameState): boolean {
    const action = cpu.chooseAction(state);
    if (action.type === "CALL_KOIKOI") return true;
    if (action.type === "CALL_STOP") return false;
    throw "Illegal choice";
}

// --- CARD COMPONENT ---
interface CardViewProps {
    card: Card;
    faceDown?: boolean;
    onClick?: () => void;
    selected?: boolean;
    disabled?: boolean;
    highlighted?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    flipped?: boolean;
}

function CardView({
    card,
    faceDown,
    onClick,
    selected,
    disabled,
    highlighted,
    onMouseEnter,
    onMouseLeave,
    flipped = true,
}: CardViewProps) {
    const Svg = faceDown ? images.card_back : cardImageById[card.id];
    const clickable = !!(onClick && !disabled);

    const view = (
        <card-view
            id={card.id}
            title={faceDown ? undefined : card.name}
            data-clickable={clickable || undefined}
            data-selected={selected || undefined}
            data-highlighted={highlighted || undefined}
            onClick={clickable ? onClick : undefined}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Svg />
        </card-view>
    );
    return flipped ? (
        <Flipped
            flipId={card.id}
            scale
            translate
            stagger
            onStartImmediate={(el) => el.setAttribute("data-flipping", "")}
        >
            {view}
        </Flipped>
    ) : (
        view
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

function RiverView({
    cards,
    index,
    onClick,
    onDiscard,
    highlightType, // TODO better name
    hoverHighlight,
    showDiscard,
    onMouseEnter,
    onMouseLeave,
}: RiverViewProps) {
    const hasSpecial = cards.some(isRainMan) || cards.some(isLightning);

    return (
        <river-lane
            id={`river-${index}`}
            data-highlight={highlightType || undefined}
            data-hover-highlight={hoverHighlight || undefined}
            data-has-special={hasSpecial || undefined}
            data-clickable={(!!onClick && !!highlightType) || undefined}
            onClick={(!!highlightType && onClick) || undefined}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <card-squish key="capture">
                {(highlightType === "capture" ||
                    highlightType === "forced") && (
                    <river-icon data-highlight={highlightType}>
                        <icon class="reverse">🫳</icon>
                    </river-icon>
                )}
            </card-squish>
            {cards
                .slice()
                .reverse()
                .map((card) => (
                    <card-squish key={card.id}>
                        <CardView card={card} />
                    </card-squish>
                ))}

            {showDiscard ? (
                <card-squish key={"drop"}>
                    <CardButton
                        variant="discard"
                        onClick={() => {
                            onDiscard && onDiscard();
                        }}
                    >
                        <icon>🍃</icon>
                    </CardButton>
                </card-squish>
            ) : highlightType === "human_drop" ? (
                <card-squish key={"drop"}>
                    <CardButton variant="drop">
                        <icon>🍃</icon>
                    </CardButton>
                </card-squish>
            ) : highlightType === "cpu_drop" ? (
                <card-squish key={"drop"}>
                    <CardButton variant="drop"></CardButton>
                </card-squish>
            ) : null}
        </river-lane>
    );
}

interface CardButtonProps {
    variant: "discard" | "drop";
    onClick?: () => void;
    children?: ComponentChildren;
}

function CardButton({ variant, onClick, children }: CardButtonProps) {
    return (
        <button
            data-role="card-button"
            data-variant={variant}
            onClick={onClick}
        >
            {children}
        </button>
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

function HandView({
    id,
    cards,
    faceDown,
    selectedCard,
    onSelect,
    disabled,
    highlightedIds,
    onCardHover,
    onCardLeave,
}: HandViewProps) {
    return (
        <hand-view id={id}>
            {cards.map((card) => {
                const isRevealed = selectedCard && selectedCard.id === card.id;
                return (
                    <CardView
                        key={card.id}
                        card={card}
                        faceDown={faceDown && !isRevealed}
                        selected={!!isRevealed}
                        highlighted={!!highlightedIds?.has(card.id)}
                        onClick={
                            !faceDown && onSelect
                                ? () => onSelect(card)
                                : undefined
                        }
                        onMouseEnter={
                            !faceDown && onCardHover
                                ? () => onCardHover(card)
                                : undefined
                        }
                        onMouseLeave={onCardLeave}
                        disabled={disabled}
                    />
                );
            })}
        </hand-view>
    );
}

// --- CAPTURED AREA ---
interface CapturedViewProps {
    id?: string;
    cards: Card[];
}

function minBy<T>(items: T[], rank: (item: T) => number): T {
    return items.reduce((best, next) =>
        rank(next) < rank(best) ? next : best,
    );
}

function CapturedView({ id, cards }: CapturedViewProps) {
    cards = cards.slice().sort((a, b) => a.month - b.month);

    const groups = [
        { name: "Brights", type: "bright" },
        { name: "Animals", type: "animal" },
        { name: "Ribbons", type: "ribbon" },
        { name: "Junk", type: "junk" },
    ]
        .map((g) => ({ ...g, cards: cards.filter((c) => c.type === g.type) }))
        .filter((g) => g.cards.length > 0);

    type Group = (typeof groups)[number];

    // A group occupies its card count plus 0.5 "card units" for the count label.
    const footprint = (gs: Group[]) =>
        gs.reduce((sum, g) => sum + g.cards.length + 0.5, 0);

    // Distribute the groups over (up to) two rows of (up to) three columns,
    // keeping group order. Pick the consecutive split that makes the wider row
    // as narrow as possible, so both rows end up roughly balanced.
    const rows: Group[][] =
        groups.length <= 1
            ? [groups]
            : (() => {
                  const splits = Array.from(
                      { length: groups.length - 1 },
                      (_, i) => i + 1,
                  );
                  const k = minBy(splits, (k) =>
                      Math.max(
                          footprint(groups.slice(0, k)),
                          footprint(groups.slice(k)),
                      ),
                  );
                  return [groups.slice(0, k), groups.slice(k)];
              })();

    // Width of the captured area (in card units) is the wider of the two rows.
    const cols = Math.max(0, ...rows.map(footprint));

    return (
        <captured-view id={id} style={{ "--cols": cols + 1 }}>
            {rows.map((row, i) => {
                // One Nfr column per group (cards + count label), then a slack
                // column so the narrower row is left-aligned and every card
                // across both rows renders at the same width.
                const slack = cols - footprint(row);
                const template =
                    row.map((g) => `${g.cards.length + 0.5}fr`).join(" ") +
                    ` ${slack}fr` +
                    " 1fr";

                return (
                    <captured-row key={i} style={{ "--template": template }}>
                        {row.map((g) => (
                            <captured-group key={g.name} data-type={g.type}>
                                <group-count>{g.cards.length}</group-count>
                                {g.cards.map((c) => (
                                    <card-squish key={c.id}>
                                        <CardView card={c} />
                                    </card-squish>
                                ))}
                            </captured-group>
                        ))}
                    </captured-row>
                );
            })}
        </captured-view>
    );
}

// --- YAKU DISPLAY ---
interface YakuListProps {
    captured: Card[];
}

function YakuList({ captured }: YakuListProps) {
    const { yakuList, total } = computeYaku(captured);
    if (yakuList.length === 0) return null;
    return (
        <yaku-list>
            {yakuList.map((y) => `${y.name} (${y.points})`).join(", ")}
            <yaku-total> = {total}</yaku-total>
        </yaku-list>
    );
}

// --- MAIN COMPONENT ---
export function FlowerRivers() {
    const [state, dispatch] = useReducer(gameReducer, makeInitialState());
    const [ping, setPing] = useState(123); // Changes on animation ended.
    const [hoveredRiver, setHoveredRiver] = useState<number | null>(null);
    const [hoveredHandCard, setHoveredHandCard] = useState<Card | null>(null);
    const [revealedCpuCard, setRevealedCpuCard] = useState<Card | null>(null);

    const resetHover = () => {
        setHoveredRiver(null);
        setHoveredHandCard(null);
    };

    const {
        phase,
        deck,
        hands,
        captured,
        rivers,
        dealerIdx,
        capturerIdx,
        dealStep,
        drawnCard,
        riversUsedThisTurn,
        lightningRiver,
        selectedHandCard,
        koikoiCounts,
        scores,
        round,
        turn,
        drawMultiplier,
        newYaku,
        yakuPlayer,
        message,
        roundScoreInfo,
    } = state;

    const isHumanDealer = dealerIdx === 0;
    const isHumanCapturer = capturerIdx === 0;

    useEffect(() => {
        if (message) console.log("message:", message);
    }, [message]);

    // --- CPU EFFECTS ---
    // Auto-draw: whenever it's the dealing phase and no card is drawn yet, draw automatically
    useEffect(() => {
        if (phase !== "DEALING" || drawnCard) return;
        console.log("DEALING");
        dispatch({ type: "DRAW_CARD" });
    }, [phase, ping]);

    // CPU dealing: drop drawn cards
    useEffect(() => {
        if (phase !== "DEALING" || isHumanDealer || !drawnCard) return;

        const ri = cpuChooseRiver(state);
        const timer = setTimeout(() => {
            dispatch({ type: "DROP_IN_RIVER", riverIdx: ri });
        }, 0);

        return () => clearTimeout(timer);
    }, [ping]);

    // CPU capturing
    useEffect(() => {
        if (phase !== "CAPTURING" || isHumanCapturer) return;
        console.log("CAPTURING");
        const action = cpuChooseCaptureAction(state);
        setRevealedCpuCard(action.card);

        const timer = setTimeout(() => {
            setRevealedCpuCard(null);
            if (action.type === "capture") {
                dispatch({
                    type: "CAPTURE_RIVER",
                    riverIdx: action.riverIdx,
                    handCard: action.card,
                });
            } else {
                dispatch({
                    type: "DISCARD_TO_RIVER",
                    riverIdx: action.riverIdx,
                    handCard: action.card,
                });
            }
        }, 700);

        return () => {
            clearTimeout(timer);
            setRevealedCpuCard(null);
        };
    }, [ping]);

    // CPU forced capture
    useEffect(() => {
        if (phase !== "FORCED_CAPTURE" || isHumanCapturer) return;

        const card = cpuChooseForcedCaptureCard(state);
        setRevealedCpuCard(card);

        const timer = setTimeout(() => {
            setRevealedCpuCard(null);
            dispatch({
                type: "CAPTURE_RIVER",
                riverIdx: lightningRiver!,
                handCard: card,
            });
        }, 700);

        return () => {
            clearTimeout(timer);
            setRevealedCpuCard(null);
        };
    }, [ping]);

    // CPU yaku choice (koikoi or stop)
    useEffect(() => {
        if (phase !== "YAKU_CHOICE" || yakuPlayer !== 1) return;

        const timer = setTimeout(() => {
            const koikoi = cpuDecideKoikoi(state);
            dispatch({ type: koikoi ? "CALL_KOIKOI" : "CALL_STOP" });
        }, 2000);

        return () => clearTimeout(timer);
    }, [ping]);

    // --- HUMAN HANDLERS ---
    const handleDropInRiver = (ri: number) => {
        if (phase === "DEALING" && isHumanDealer && drawnCard) {
            dispatch({ type: "DROP_IN_RIVER", riverIdx: ri });
        }
    };

    const handleSelectCard = (card: Card) => {
        if (
            (phase === "CAPTURING" || phase === "FORCED_CAPTURE") &&
            isHumanCapturer
        ) {
            dispatch({ type: "SELECT_HAND_CARD", card });
        }
    };

    const handleRiverClick = (ri: number) => {
        if (phase === "DEALING" && isHumanDealer && drawnCard) {
            handleDropInRiver(ri);
            return;
        }
        if (!selectedHandCard || !isHumanCapturer) return;

        if (phase === "FORCED_CAPTURE") {
            if (ri === lightningRiver) {
                resetHover();
                dispatch({
                    type: "CAPTURE_RIVER",
                    riverIdx: ri,
                    handCard: selectedHandCard,
                });
            }
            return;
        }

        // Clicking the river body captures (if valid)
        if (
            phase === "CAPTURING" &&
            canCaptureRiver(selectedHandCard, rivers[ri])
        ) {
            resetHover();
            dispatch({
                type: "CAPTURE_RIVER",
                riverIdx: ri,
                handCard: selectedHandCard,
            });
        }
    };

    const handleDiscard = (ri: number) => {
        if (phase !== "CAPTURING" || !selectedHandCard || !isHumanCapturer)
            return;
        resetHover();
        dispatch({
            type: "DISCARD_TO_RIVER",
            riverIdx: ri,
            handCard: selectedHandCard,
        });
    };

    // --- RENDER ---
    // Menu screen
    if (phase === "MENU") {
        return (
            <div id="menu-screen">
                <div id="menu-title">
                    <span data-side="left">Blossom</span>
                    <span data-side="left" data-kanji>
                        花
                    </span>
                    <span />
                    <span />
                    <span data-side="right" data-kanji>
                        川
                    </span>
                    <span data-side="right">Rivers</span>
                </div>
                <button
                    id="start-button"
                    onClick={() => dispatch({ type: "START_GAME" })}
                >
                    Start Game
                </button>
            </div>
        );
    }

    // Round over screen
    if (phase === "ROUND_OVER") {
        const info = roundScoreInfo;
        return (
            <div id="round-over-screen">
                <div id="round-over-title">Round {round} Complete</div>
                {info && info.winner === -1 ? (
                    <div id="round-over-draw-info">
                        Draw! Points doubled next round.
                    </div>
                ) : (
                    <div id="round-over-winner-info">
                        <div id="round-over-winner-text">
                            {info && playerName(info.winner)} won the round!
                        </div>
                        {info &&
                            info.yakuList.map((y) => (
                                <div key={y.name} data-row="yaku">
                                    {y.name}: {y.points} pts
                                </div>
                            ))}
                        <div id="round-over-multiplier">
                            Base: {info && info.basePoints}
                            {info && info.sevenBonus && " × 2 (7+ bonus)"}
                            {info &&
                                info.oppKoikoi !== undefined &&
                                info.oppKoikoi > 0 &&
                                ` × ${Math.pow(2, info.oppKoikoi)} (opponent koi-koi)`}
                            {info &&
                                info.drawMultiplier > 1 &&
                                ` × ${info.drawMultiplier} (draw bonus)`}
                        </div>
                        <div id="round-over-final-points">
                            = {info && info.finalPoints} points
                        </div>
                    </div>
                )}
                <div id="round-over-scores">
                    Score — You: {scores[0]} | CPU: {scores[1]}
                </div>
                <button
                    id="next-round-button"
                    onClick={() => dispatch({ type: "NEXT_ROUND" })}
                >
                    Next Round
                </button>
            </div>
        );
    }

    // Game over screen
    if (phase === "GAME_OVER") {
        const info = roundScoreInfo;
        const finalS0 = scores[0];
        const finalS1 = scores[1];
        const winner =
            finalS0 > finalS1
                ? "You win!"
                : finalS0 < finalS1
                  ? "CPU wins!"
                  : "Tie game!";
        return (
            <div id="game-over-screen">
                <div id="game-over-title">Game Over</div>
                {info && info.winner !== -1 && (
                    <div id="game-over-round-info">
                        <div id="game-over-round-text">
                            {playerName(info.winner)} won the final round with{" "}
                            {info.finalPoints} pts
                        </div>
                        {info.yakuList.map((y) => (
                            <div key={y.name} data-row="yaku">
                                {y.name}: {y.points}
                            </div>
                        ))}
                    </div>
                )}
                {info && info.winner === -1 && (
                    <div id="game-over-draw-info">Final round was a draw.</div>
                )}
                <div id="game-over-scores">
                    You: {finalS0} — CPU: {finalS1}
                </div>
                <div id="game-over-winner">{winner}</div>
                <button
                    id="play-again-button"
                    onClick={() => dispatch({ type: "START_GAME" })}
                >
                    Play Again
                </button>
            </div>
        );
    }

    // --- MAIN GAME BOARD ---
    // Determine river highlights
    const getRiverHighlight = (ri: number): RiverHighlightType => {
        if (phase === "DEALING" && !riversUsedThisTurn[ri]) {
            if (isHumanDealer) {
                return "human_drop";
            } else {
                return "cpu_drop";
            }
        }
        if (
            phase === "FORCED_CAPTURE" &&
            isHumanCapturer &&
            ri === lightningRiver
        ) {
            return "forced";
        }
        if (phase === "CAPTURING" && isHumanCapturer && selectedHandCard) {
            if (canCaptureRiver(selectedHandCard, rivers[ri])) return "capture";
        }
        return null;
    };

    const showDiscardButton = (_ri: number): boolean => {
        return phase === "CAPTURING" && isHumanCapturer;
    };

    // Hover cross-highlighting
    const isCapturingPhase =
        (phase === "CAPTURING" || phase === "FORCED_CAPTURE") &&
        isHumanCapturer;

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
                if (
                    rivers[ri].length > 0 &&
                    canCaptureRiver(card, rivers[ri])
                ) {
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
                if (
                    rivers[ri].length > 0 &&
                    canCaptureRiver(hoveredHandCard, rivers[ri])
                )
                    set.add(ri);
            }
            return set;
        } else {
            for (let ri = 0; ri < 3; ri++) {
                if (
                    rivers[ri].length > 0 &&
                    hands[0].some((c) => canCaptureRiver(c, rivers[ri]))
                )
                    set.add(ri);
            }
            return set;
        }
    })();

    const canHumanAct =
        (phase === "DEALING" && isHumanDealer) ||
        ((phase === "CAPTURING" || phase === "FORCED_CAPTURE") &&
            isHumanCapturer);

    // Status message
    let statusText = <>{message}</>;
    if (phase === "DEALING" && isHumanDealer && !drawnCard) {
        statusText = (
            <>
                Turn {turn} — Drawing... ({dealStep + 1}/3)
            </>
        );
    } else if (phase === "DEALING" && isHumanDealer && drawnCard) {
        statusText = (
            <>
                Drop🍃 {drawnCard.name} in a river. ({dealStep + 1}/3)
            </>
        );
    } else if (phase === "CAPTURING" && isHumanCapturer && !selectedHandCard) {
        statusText = <>Select a card from your hand.</>;
    } else if (phase === "CAPTURING" && isHumanCapturer && selectedHandCard) {
        statusText = (
            <>
                Click a river to capture<span class="reverse">🫳</span> or
                discard🍃.
            </>
        );
    } else if (
        phase === "FORCED_CAPTURE" &&
        isHumanCapturer &&
        !selectedHandCard
    ) {
        statusText = (
            <>
                Lightning! Select a card to capture
                <span class="reverse">🫳</span> River {lightningRiver! + 1}.
            </>
        );
    } else if (
        phase === "FORCED_CAPTURE" &&
        isHumanCapturer &&
        selectedHandCard
    ) {
        statusText = (
            <>
                Click River {lightningRiver! + 1} to capture
                <span class="reverse">🫳</span> it.
            </>
        );
    } else if (phase === "DEALING" && !isHumanDealer) {
        statusText = <>CPU is dealing...</>;
    } else if (
        (phase === "CAPTURING" || phase === "FORCED_CAPTURE") &&
        !isHumanCapturer
    ) {
        statusText = <>CPU is choosing...</>;
    }

    const flipState = ([] as Card[])
        .concat(
            deck,
            rivers[0],
            rivers[1],
            rivers[2],
            hands[0],
            hands[1],
            captured[0],
            captured[1],
        )
        .map((x) => x.id)
        .join(",");
    return (
        <Flipper
            flipKey={flipState}
            spring={"noWobble"}
            onComplete={() => {
                document
                    .querySelectorAll("card-view[data-flipping]")
                    .forEach((el) => el.removeAttribute("data-flipping"));
                setPing(ping + 1);
            }}
            // spring={{ stiffness: 500, damping: 500 }}
            staggerConfig={{
                // the "default" config will apply to staggered elements without explicit keys
                default: {
                    // default direction is forwards
                    // reverse: true,
                    // default is .1, 0 < n < 1
                    speed: 1,
                },
            }}
        >
            <div id="game-board">
                {/* Yaku Choice Dialog */}
                {phase === "YAKU_CHOICE" &&
                    (() => {
                        const winner = yakuPlayer;
                        const loser = 1 - winner;
                        const baseTotal = computeYaku(captured[winner]).total;
                        const sevenBonus = baseTotal >= 7;
                        const oppKoikoi = koikoiCounts[loser];
                        const koikoiMult = Math.pow(2, oppKoikoi);
                        const drawBonus = drawMultiplier > 1;
                        let pts = baseTotal;
                        if (sevenBonus) pts *= 2;
                        pts *= koikoiMult;
                        pts *= drawMultiplier;
                        const hasMult =
                            sevenBonus || oppKoikoi > 0 || drawBonus;
                        return (
                            <div id="yaku-dialog-overlay">
                                <div id="yaku-dialog">
                                    <div id="yaku-dialog-title">
                                        {winner === 0 ? "Yaku!" : "CPU Yaku!"}
                                    </div>
                                    {newYaku.map((y) => (
                                        <div key={y.name} data-row="yaku">
                                            {y.name} — {y.points} pts
                                        </div>
                                    ))}
                                    <div id="yaku-dialog-total">
                                        Total so far: {baseTotal} pts
                                        {sevenBonus && " × 2 (7+ bonus)"}
                                        {oppKoikoi > 0 &&
                                            ` × ${koikoiMult} (${winner === 0 ? "opponent" : "your"} koi-koi ×${oppKoikoi})`}
                                        {drawBonus &&
                                            ` × ${drawMultiplier} (draw bonus)`}
                                        {hasMult && ` = ${pts} pts`}
                                    </div>
                                    <div id="yaku-dialog-buttons">
                                        {winner === 0 ? (
                                            <>
                                                <button
                                                    id="stop-button"
                                                    onClick={() =>
                                                        dispatch({
                                                            type: "CALL_STOP",
                                                        })
                                                    }
                                                >
                                                    Stop
                                                </button>
                                                <button
                                                    id="koikoi-button"
                                                    disabled={
                                                        hands[0].length == 0
                                                    }
                                                    onClick={() =>
                                                        dispatch({
                                                            type: "CALL_KOIKOI",
                                                        })
                                                    }
                                                >
                                                    Koi-Koi!
                                                </button>
                                            </>
                                        ) : (
                                            <div id="cpu-deciding">
                                                CPU is deciding...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                {/* Top Bar */}
                <div id="top-bar">
                    <top-title>花川 - Blossom Rivers</top-title>
                    <span>
                        Round {round}/{TOTAL_ROUNDS} — Turn {turn}
                    </span>
                    <span>
                        You: <b>{scores[0]}</b> | CPU: <b>{scores[1]}</b>
                        {drawMultiplier > 1 && (
                            <draw-multiplier>
                                ×{drawMultiplier} next!
                            </draw-multiplier>
                        )}
                    </span>
                </div>

                {/* CPU Area */}
                <div id="cpu-hand-row">
                    <HandView
                        id="cpu-hand"
                        cards={hands[1]}
                        faceDown
                        disabled
                        selectedCard={revealedCpuCard}
                    />
                    {koikoiCounts[1] > 0 && (
                        <koikoi-indicator>
                            Koi-Koi ×{koikoiCounts[1]}
                        </koikoi-indicator>
                    )}
                </div>
                <div id="cpu-capture-row">
                    <CapturedView id="cpu-captured" cards={captured[1]} />
                    <YakuList captured={captured[1]} />
                </div>

                {/* Deck + Rivers area */}
                <div id="play-area">
                    {/* Deck + Drawn card */}
                    <div id="deck-column">
                        {/* Deck */}
                        <div id="deck" style={{ "--cards-left": deck.length }}>
                            {deck.length > 0 ? (
                                <CardView card={deck[0]} faceDown />
                            ) : (
                                <div id="deck-empty" />
                            )}
                        </div>
                        <deck-label>{deck.length} left</deck-label>

                        {/* Drawn card */}
                        <div id="drawn-card">
                            {drawnCard && <CardView card={drawnCard} />}
                        </div>
                    </div>

                    {/* Rivers */}
                    <div id="rivers-column">
                        {rivers.map((river, ri) => (
                            <RiverView
                                key={ri}
                                cards={river}
                                index={ri}
                                highlightType={getRiverHighlight(ri)}
                                hoverHighlight={!!highlightedRiverSet?.has(ri)}
                                onClick={
                                    canHumanAct
                                        ? () => handleRiverClick(ri)
                                        : undefined
                                }
                                onDiscard={() => handleDiscard(ri)}
                                showDiscard={showDiscardButton(ri)}
                                onMouseEnter={
                                    isCapturingPhase
                                        ? () => setHoveredRiver(ri)
                                        : undefined
                                }
                                onMouseLeave={
                                    isCapturingPhase
                                        ? () => setHoveredRiver(null)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </div>

                {/* Status bar */}
                <div id="status-bar">{statusText}</div>

                {/* Human Area */}
                <div id="human-hand-row">
                    <HandView
                        id="human-hand"
                        cards={hands[0]
                            .slice()
                            .sort((a, b) => a.month - b.month)}
                        selectedCard={selectedHandCard}
                        onSelect={handleSelectCard}
                        disabled={
                            !(
                                (phase === "CAPTURING" ||
                                    phase === "FORCED_CAPTURE") &&
                                isHumanCapturer
                            )
                        }
                        highlightedIds={highlightedHandIds}
                        onCardHover={
                            isCapturingPhase
                                ? (card) => setHoveredHandCard(card)
                                : undefined
                        }
                        onCardLeave={
                            isCapturingPhase
                                ? () => setHoveredHandCard(null)
                                : undefined
                        }
                    />
                    {koikoiCounts[0] > 0 && (
                        <koikoi-indicator>
                            Koi-Koi ×{koikoiCounts[0]}
                        </koikoi-indicator>
                    )}
                </div>
                <div id="human-capture-row">
                    <CapturedView id="human-captured" cards={captured[0]} />
                    <YakuList captured={captured[0]} />
                </div>
            </div>
        </Flipper>
    );
}

