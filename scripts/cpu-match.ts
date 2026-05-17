// Console match harness — pits two CPU players against each other for N games
// and prints win statistics, tracked by seat (p0 / p1).
//
// Run via vite-node so SVG imports (transitively loaded by ../src/cards) and
// TS resolution work out of the box:
//
//   npx vite-node scripts/cpu-match.ts -- --p0 random --p1 ismcts --games 50
//
// or the npm alias:
//
//   npm run cpu-match -- --p0 simple --p1 ismcts --games 50

/// <reference types="node" />

import { GameState } from "../src/types";
import { gameReducer, makeInitialState } from "../src/game";
import { CPUPlayer, playerToMove } from "../src/cpu/cpu";
import { RandomPlayer } from "../src/cpu/random";
import { RandomLegalPlayer } from "../src/cpu/random_legal";
import { SimpleMCTSPlayer } from "../src/cpu/simple_mcts";
import { ISMCTSPlayer } from "../src/cpu/ismcts";

type Builder = () => CPUPlayer;

const BUILDERS: Record<string, Builder> = {
    random: () => new RandomPlayer(),
    randomL: () => new RandomLegalPlayer(),
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
        else if (a === "--games" || a === "-n")
            args.games = parseInt(argv[++i], 10);
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
        `  --swap         Let p0 start first every other game\n` +
        `\nPlayers: ${Object.keys(BUILDERS).join(", ")}\n`,
    );
}

function playGame(
    seat0: CPUPlayer,
    seat1: CPUPlayer,
    p0Starts: boolean,
): { state: GameState; steps: number } {
    let s = gameReducer(makeInitialState(), { type: "START_GAME" });
    if (p0Starts) {
        // Default seating has player 1 deal first / player 0 capture first.
        // Swap so player 0 takes the opening action.
        s = { ...s, dealerIdx: 0, capturerIdx: 1 };
    }
    // Safety: bound the loop. A normal 3-round game is well under 1000 steps;
    // anything larger means a bug in a player.
    let step = 0;
    for (; step < 5000 && s.phase !== "GAME_OVER"; step++) {
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
    return { state: s, steps: step };
}

// Linear-interpolation percentile (numpy-style). Returns NaN for empty input.
function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return NaN;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface Stats {
    avg: number;
    max: number;
    p5: number;
    p95: number;
}
function stats(arr: number[]): Stats {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
        avg,
        max: Math.max(...arr),
        p5: percentile(arr, 5),
        p95: percentile(arr, 95),
    };
}
function fmt(s: Stats, decimals = 1): string {
    const d = (n: number) => n.toFixed(decimals);
    return `avg=${d(s.avg)}  max=${d(s.max)}  p5=${d(s.p5)}  p95=${d(s.p95)}`;
}

async function main(): Promise<void> {
    const args = parseArgs();

    // Print under the real console.log; everything else gets silenced so the
    // CPU players' debug chatter doesn't drown the summary.
    const log = console.log.bind(console);
    const origLog = console.log;

    log(
        `Match: p0=${args.p0} vs p1=${args.p1} — ${args.games} games` +
        (args.swap ? "  (--swap: p0 starts every other game)" : ""),
    );

    // Stats tracked strictly by seat. The algorithm at each seat is fixed
    // across the whole run, so the algo name is just informational.
    const wins = { p0: 0, p1: 0 };
    // Keep every game's outcome so we can compute percentiles at the end —
    // running sums would only give us the mean.
    const scores: { p0: number[]; p1: number[] } = { p0: [], p1: [] };
    const lengths: number[] = [];
    let ties = 0;

    const start = Date.now();
    console.log = () => { };
    try {
        for (let g = 0; g < args.games; g++) {
            const seat0 = BUILDERS[args.p0]();
            const seat1 = BUILDERS[args.p1]();
            // Default: p1 deals (the conventional first-mover). With --swap,
            // flip every other game so any opening-seat advantage cancels out
            // across the sample.
            const p0Starts = args.swap && g % 2 === 1;

            const t0 = Date.now();
            const { state: result, steps } = playGame(seat0, seat1, p0Starts);
            const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

            const [s0, s1] = result.scores;
            scores.p0.push(s0);
            scores.p1.push(s1);
            lengths.push(steps);
            if (s0 > s1) wins.p0++;
            else if (s1 > s0) wins.p1++;
            else ties++;

            const startsTag = args.swap
                ? `  starts=${p0Starts ? "p0" : "p1"}`
                : "";
            log(
                `  game ${g + 1}/${args.games} [${elapsed}s, ${steps} steps]  ` +
                `p0(${args.p0})=${s0}  p1(${args.p1})=${s1}` +
                startsTag +
                "  " +
                (s0 === s1 ? "tie" : `winner=${s0 > s1 ? "p0" : "p1"}`),
            );
        }
    } finally {
        console.log = origLog;
    }
    const totalSec = ((Date.now() - start) / 1000).toFixed(1);

    log("\n--- Results ---");
    const row = (seat: "p0" | "p1", algo: string) => {
        const w = wins[seat];
        const rate = ((w / args.games) * 100).toFixed(1);
        log(
            `  ${seat} (${algo.padEnd(6)})  wins=${w}/${args.games} (${rate}%)  scores: ${fmt(stats(scores[seat]))}`,
        );
    };
    row("p0", args.p0);
    row("p1", args.p1);
    log(`  game length:    ${fmt(stats(lengths), 0)}`);
    log(`  ties            ${ties}/${args.games}`);
    log(`  elapsed         ${totalSec}s`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
