// Console match harness — pits two CPU players against each other for N games
// and prints win statistics.
//
// Run via vite-node so SVG imports (transitively loaded by ../src/cards) and
// TS resolution work out of the box:
//
//   npx vite-node scripts/cpu-match.ts -- --p0 random --p1 ismcts --games 50
//
// or the npm alias:
//
//   npm run cpu-match -- --p0 simple --p1 ismcts --games 50 --swap

/// <reference types="node" />

import { GameState } from "../src/types";
import { gameReducer, makeInitialState } from "../src/game";
import { CPUPlayer, playerToMove } from "../src/cpu/cpu";
import { RandomPlayer } from "../src/cpu/random";
import { SimpleMCTSPlayer } from "../src/cpu/simple_mcts";
import { ISMCTSPlayer } from "../src/cpu/ismcts";

type Builder = () => CPUPlayer;

const BUILDERS: Record<string, Builder> = {
    random: () => new RandomPlayer(),
    simple: () => new SimpleMCTSPlayer(),
    ismcts: () => new ISMCTSPlayer(),
};

interface Args {
    p0: string;
    p1: string;
    games: number;
    swap: boolean;
}

function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const args: Args = {
        p0: "random",
        p1: "ismcts",
        games: 10,
        swap: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--p0") args.p0 = argv[++i];
        else if (a === "--p1") args.p1 = argv[++i];
        else if (a === "--games" || a === "-n") args.games = parseInt(argv[++i], 10);
        else if (a === "--swap") args.swap = true;
        else if (a === "--help" || a === "-h") {
            printHelp();
            process.exit(0);
        } else {
            console.error(`Unknown arg: ${a}`);
            printHelp();
            process.exit(1);
        }
    }
    if (!BUILDERS[args.p0]) {
        console.error(`Unknown player: ${args.p0}`);
        process.exit(1);
    }
    if (!BUILDERS[args.p1]) {
        console.error(`Unknown player: ${args.p1}`);
        process.exit(1);
    }
    return args;
}

function printHelp(): void {
    process.stdout.write(
        `Usage: vite-node scripts/cpu-match.ts -- [opts]\n` +
            `  --p0 <name>    Player at seat 0 (default: random)\n` +
            `  --p1 <name>    Player at seat 1 (default: ismcts)\n` +
            `  --games N      Number of games (default: 10)\n` +
            `  --swap         Alternate seats each game\n` +
            `\nPlayers: ${Object.keys(BUILDERS).join(", ")}\n`,
    );
}

function playGame(seat0: CPUPlayer, seat1: CPUPlayer): GameState {
    let s = gameReducer(makeInitialState(), { type: "START_GAME" });
    // Safety: bound the loop. A normal 3-round game is well under 1000 steps;
    // anything larger means a bug in a player.
    for (let step = 0; step < 5000 && s.phase !== "GAME_OVER"; step++) {
        if (s.phase === "ROUND_OVER") {
            s = gameReducer(s, { type: "NEXT_ROUND" });
            continue;
        }
        const toMove = playerToMove(s);
        if (toMove !== 0 && toMove !== 1) {
            throw new Error(
                `Unexpected playerToMove=${toMove} in phase ${s.phase}`,
            );
        }
        const player = toMove === 0 ? seat0 : seat1;
        const action = player.chooseAction(s);
        s = gameReducer(s, action);
    }
    if (s.phase !== "GAME_OVER") {
        throw new Error("Game did not terminate within 5000 steps.");
    }
    return s;
}

async function main(): Promise<void> {
    const args = parseArgs();

    // Print under the real console.log; everything else gets silenced so the
    // CPU players' debug chatter doesn't drown the summary.
    const log = console.log.bind(console);
    const origLog = console.log;

    const selfPlay = args.p0 === args.p1;
    // Distinguish identical builder names by suffixing with seat index. Without
    // this, self-play (e.g. ismcts vs ismcts) renders both seats as the same
    // string and the per-game line "ismcts=21 ismcts=27 winner=ismcts" is
    // impossible to read.
    const labelFor = (seat: 0 | 1, builder: string) =>
        selfPlay ? `${builder}#${seat}` : builder;

    log(
        `Match: ${labelFor(0, args.p0)} (seat 0) vs ${labelFor(1, args.p1)} (seat 1)` +
        ` — ${args.games} games${args.swap ? " (alternating seats)" : ""}` +
        (selfPlay ? "  [self-play; labels distinguish seats only]" : ""),
    );

    // Stats indexed by label, so each entry maps unambiguously to one seat in
    // self-play and to one builder across swapped seats otherwise.
    const wins: Record<string, number> = {};
    const totalScore: Record<string, number> = {};
    const played: Record<string, number> = {};
    let ties = 0;
    const bump = (label: string, w: 0 | 1, score: number) => {
        wins[label] = (wins[label] ?? 0) + w;
        totalScore[label] = (totalScore[label] ?? 0) + score;
        played[label] = (played[label] ?? 0) + 1;
    };

    const start = Date.now();
    console.log = () => {};
    try {
        for (let g = 0; g < args.games; g++) {
            const swap = args.swap && g % 2 === 1;
            const seat0Builder = swap ? args.p1 : args.p0;
            const seat1Builder = swap ? args.p0 : args.p1;
            const seat0Label = labelFor(0, seat0Builder);
            const seat1Label = labelFor(1, seat1Builder);
            const seat0 = BUILDERS[seat0Builder]();
            const seat1 = BUILDERS[seat1Builder]();

            const t0 = Date.now();
            const result = playGame(seat0, seat1);
            const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

            const [s0, s1] = result.scores;
            const tie = s0 === s1;
            bump(seat0Label, tie ? 0 : s0 > s1 ? 1 : 0, s0);
            bump(seat1Label, tie ? 0 : s1 > s0 ? 1 : 0, s1);
            if (tie) ties++;

            log(
                `  game ${g + 1}/${args.games} [${elapsed}s]  ` +
                `${seat0Label}=${s0}  ${seat1Label}=${s1}  ` +
                (tie
                        ? "tie"
                    : `winner=${s0 > s1 ? seat0Label : seat1Label}`),
            );
        }
    } finally {
        console.log = origLog;
    }
    const totalSec = ((Date.now() - start) / 1000).toFixed(1);

    log("\n--- Results ---");
    const labels = Object.keys(played);
    const labelWidth = Math.max(...labels.map((l) => l.length));
    for (const label of labels) {
        const w = wins[label];
        const ts = totalScore[label];
        const pl = played[label];
        const rate = ((w / pl) * 100).toFixed(1);
        const avg = (ts / pl).toFixed(1);
        log(
            `  ${label.padEnd(labelWidth)}  wins=${w}/${pl} (${rate}%)  avg=${avg}`,
        );
    }
    log(`  ${"ties".padEnd(labelWidth)}  ${ties}/${args.games}`);
    log(`  ${"elapsed".padEnd(labelWidth)}  ${totalSec}s`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
