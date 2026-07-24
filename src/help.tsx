import { signal } from "@preact/signals";
import { CARDS } from "./cards";
import { CardView } from "../src/flowerrivers";
import { setCardStyle, useCardStyle } from "./cardStyle";
const YAKU_OVERVIEW = [
    {
        name: "Five Brights",
        points: "15",
        cards: [
            "1-bright",
            "3-bright",
            "8-bright",
            "11-bright-rainman",
            "12-bright",
        ],
    },
    {
        name: "Four Brights",
        points: "8",
        cards: ["1-bright", "3-bright", "8-bright", "12-bright"],
    },
    {
        name: "Rainy Four Brights",
        points: "7",
        cards: ["11-bright-rainman", "1-bright", "3-bright", "12-bright"],
    },
    {
        name: "Three Brights",
        points: "6",
        cards: ["1-bright", "3-bright", "8-bright"],
    },
    {
        name: "Poetry Ribbons",
        points: "5",
        cards: ["1-ribbon", "2-ribbon", "3-ribbon"],
    },
    {
        name: "Blue Ribbons",
        points: "5",
        cards: ["6-ribbon", "9-ribbon", "10-ribbon"],
    },
    {
        name: "Grass Ribbons",
        points: "5",
        cards: ["4-ribbon", "5-ribbon", "7-ribbon"],
    },
    {
        name: "Boar-Deer-Butterfly",
        points: "5",
        cards: ["7-animal", "10-animal", "6-animal"],
    },
    {
        name: "Flower & Moon Viewing",
        points: "5",
        cards: ["3-bright", "9-animal", null, "8-bright", "9-animal"],
    },
    {
        name: "5+ Animals",
        points: "1+",
        cards: ["2-animal", "9-animal", "5-animal", "6-animal", "7-animal"],
    },
    {
        name: "5+ Ribbons",
        points: "1+",
        cards: ["1-ribbon", "3-ribbon", "7-ribbon", "9-ribbon", "11-ribbon"],
    },
    {
        name: "10+ Junk",
        points: "1+",
        cards: [
            "1-junk-1",
            "2-junk-1",
            "3-junk-1",
            "4-junk-1",
            "6-junk-1",
            "8-junk-1",
            "10-junk-1",
            "12-junk-2",
            "11-junk-lightning",
            "9-animal",
        ],
    },
];
export const showModal = signal<null | "help" | "settings">(null);
export const restartGame = signal<(() => void) | null>(null);

function HelpModal() {
    return (
        <div class="overlay" onClick={() => (showModal.value = null)}>
            <div id="help-modal" onClick={(e) => e.stopPropagation()}>
                <label>
                    <input type="radio" name="tabs" checked />
                    Rules
                </label>
                <section>
                    <div id="rules-overview">
                        <ul>
                            <li>
                                <u>Setup:</u> Deal each player 6 cards
                                <br />
                                and put the deck on the side,
                                <br />
                                leaving space for 3 rivers of cards.
                            </li>
                            <li>
                                <u>Play:</u> Each turn,
                                <ul>
                                    <li>
                                        Player A draws 3 cards from the deck 1
                                        by 1,
                                        <br />
                                        and chooses which river to drop🍃it in.
                                        <br />
                                        They choose each river only once.
                                    </li>
                                    <li>
                                        Player B can then either
                                        <br />
                                        discard🍃a card in any river,
                                        <br />
                                        or capture
                                        <span class="reverse">🫳</span> a whole
                                        river
                                        <br />
                                        by matching any card in that river.
                                        <ul>
                                            <li>
                                                If they now have a new yaku
                                                <br />
                                                or improved an existing one,
                                                <br />
                                                they can call <b>STOP</b> and
                                                score points.
                                            </li>
                                            <li>
                                                If instead they call{" "}
                                                <b>KOI-KOI</b> or have no yaku,
                                                <br />
                                                the round continues
                                                <br />
                                                as players switch roles each
                                                turn.
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <u>Scores are doubled</u> over 7 points,
                                <br />
                                if the opponent had called koi-koi,
                                <br />
                                and for each previous round which was a draw.
                            </li>
                            <li>
                                <u>Lightning is a wild card,</u> it can capture
                                any river.
                                <br />
                                It's mandatory to capture
                                <span class="reverse">🫳</span> if it's dealt to
                                a river.
                            </li>
                            <li>
                                <u>The Rain man protects</u> from capture
                                <br />
                                with anything but a Willow.
                            </li>
                            <li>There are no hand-yaku.</li>
                            <li>A junk yaku alone can't stop a round.</li>
                        </ul>
                    </div>
                </section>

                <label>
                    <input type="radio" name="tabs" />
                    Yaku
                </label>
                <section>
                    <div id="yaku-overview">
                        {YAKU_OVERVIEW.map((y) => (
                            <div key={y.name} class="yaku-overview-row">
                                <div class="yaku-overview-info">
                                    <span class="yaku-overview-name">
                                        {y.name}
                                    </span>{" "}
                                    <span class="yaku-overview-points">
                                        {y.points}
                                    </span>
                                </div>
                                <div class="yaku-overview-cards">
                                    {y.cards.map((id) => {
                                        const card = CARDS.find(
                                            (c) => c.id === id,
                                        );
                                        return card ? (
                                            <card-squish>
                                                <CardView
                                                    card={card}
                                                    flipped={false}
                                                />
                                            </card-squish>
                                        ) : (
                                            <span class="space"> </span>
                                        );
                                    })}
                                    <span class="space"> </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <label>
                    <input type="radio" name="tabs" />
                    Cards
                </label>
                <section>
                    <div id="card-overview">
                        {CARDS.map((c) => (
                            <CardView key={c.id} card={c} flipped={false} />
                        ))}
                    </div>
                </section>

                <label>
                    <input type="radio" name="tabs" />
                    About
                </label>
                <section>
                    <h2>Play</h2>
                    <p>
                        <a
                            href="https://vulumecode.github.io/Blossom-Rivers/"
                            rel="nofollow"
                        >
                            Play online (PWA)
                        </a>
                    </p>
                    <p>
                        <a
                            href="https://vulume.itch.io/blossom-rivers"
                            rel="nofollow"
                        >
                            Play on Itch.io
                        </a>
                    </p>
                    <h2>Code</h2>
                    <p>
                        <a
                            href="https://github.com/VulumeCode/Blossom-Rivers"
                            rel="nofollow"
                        >
                            Code on GitHub
                        </a>
                    </p>
                    <h2>Credits</h2>
                    <p>
                        Cards: A modified version of{" "}
                        <a
                            href="https://commons.wikimedia.org/wiki/Category:SVG_Hanafuda_with_green_plants"
                            rel="nofollow"
                        >
                            Hanafuda cards by Louie Mantia
                        </a>
                        .
                    </p>
                    <p>
                        Background art: Sumidagawa Hanazakari by Andō Hiroshige
                    </p>
                    <p>Public domain textures</p>
                    <h2>Licences</h2>
                    <p>
                        Code:{" "}
                        <a
                            href="https://www.tldrlegal.com/license/gnu-general-public-license-v3-gpl-3"
                            rel="nofollow"
                        >
                            GPLv3
                        </a>
                    </p>
                    <p>
                        Assets:{" "}
                        <a
                            href="https://creativecommons.org/licenses/by-nd/4.0/"
                            rel="nofollow"
                        >
                            Creative Commons Attribution ShareAlike
                        </a>
                    </p>
                </section>
                <button onClick={() => (showModal.value = null)}>
                    Close help
                </button>
                {restartGame.value && (
                    <button
                        onClick={() => {
                            if (
                                confirm(
                                    "Restart the game? Current progress will be lost.",
                                )
                            ) {
                                restartGame.value!();
                                showModal.value = null;
                            }
                        }}
                    >
                        Restart game
                    </button>
                )}
            </div>
        </div>
    );
}

function SettingsModal() {
    return (
        <div class="overlay" onClick={() => (showModal.value = null)}>
            <div id="help-modal" onClick={(e) => e.stopPropagation()}>
                <label>
                    <input type="radio" name="tabs" checked />
                    Card style
                </label>
                <section>
                    <div id="card-style">
                        <div
                            onClick={() => setCardStyle("louie")}
                            data-selected={
                                useCardStyle.value == "louie" || undefined
                            }
                            class="card-style-option"
                        >
                            <h3>Classic</h3>
                            <div>
                                The classic cards by{" "}
                                <a
                                    href="https://commons.wikimedia.org/wiki/Category:SVG_Hanafuda_with_green_plants"
                                    rel="nofollow"
                                >
                                    Louie Mantia
                                </a>{" "}
                                modified for this game.
                            </div>
                            <div class="yaku-overview-cards">
                                {YAKU_OVERVIEW[0].cards.map((id) => {
                                    const card = CARDS.find((c) => c.id === id);
                                    return (
                                        <CardView
                                            card={card!}
                                            flipped={false}
                                            cardStyle="louie"
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            onClick={() => setCardStyle("suisaiga")}
                            data-selected={
                                useCardStyle.value == "suisaiga" || undefined
                            }
                            class="card-style-option"
                        >
                            <h3>Shou Suisaiga</h3>
                            <div>My very own aquarelle deck.</div>
                            <div
                                data-art="suisaiga"
                                class="yaku-overview-cards"
                            >
                                {YAKU_OVERVIEW[0].cards.map((id) => {
                                    const card = CARDS.find((c) => c.id === id);
                                    return (
                                        <CardView
                                            card={card!}
                                            flipped={false}
                                            cardStyle="suisaiga"
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            onClick={() => setCardStyle("otwarte")}
                            data-selected={
                                useCardStyle.value == "otwarte" || undefined
                            }
                            class="card-style-option"
                        >
                            <h3>OpenCards Hanafuda </h3>
                            <div>
                                This deck is designed to be as friendly to new
                                people as possible
                                <br />
                                while staying 100% compatible with the standard
                                design!
                            </div>
                            <a href="https://www.instagram.com/otwartekarty.pl/">
                                Follow @otwartekarty.pl on Instagram!
                            </a>
                            <div data-art="otwarte" class="yaku-overview-cards">
                                {YAKU_OVERVIEW[0].cards.map((id) => {
                                    const card = CARDS.find((c) => c.id === id);
                                    return (
                                        <CardView
                                            card={card!}
                                            flipped={false}
                                            cardStyle="otwarte"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <button onClick={() => (showModal.value = null)}>
                    Close settings
                </button>
                {restartGame.value && (
                    <button
                        onClick={() => {
                            if (
                                confirm(
                                    "Restart the game? Current progress will be lost.",
                                )
                            ) {
                                restartGame.value!();
                                showModal.value = null;
                            }
                        }}
                    >
                        Restart game
                    </button>
                )}
            </div>
        </div>
    );
}

export function SystemMenu() {
    return (
        <>
            {" "}
            {showModal.value == "help" && <HelpModal />}
            {showModal.value == "settings" && <SettingsModal />}
            <div id="system-buttons">
                <button
                    id="help-button"
                    onClick={() => (showModal.value = "help")}
                >
                    ?
                </button>
                <button
                    id="settings-button"
                    onClick={() => (showModal.value = "settings")}
                >
                    ⛭
                </button>
                <button
                    id="fullscreen-button"
                    onClick={() => {
                        document.fullscreenElement
                            ? document.exitFullscreen()
                            : document.body.requestFullscreen();
                    }}
                >
                    ⛶
                </button>
            </div>
        </>
    );
}
