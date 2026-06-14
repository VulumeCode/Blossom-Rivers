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

import { Worker, isMainThread } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { GameState } from "../src/types";
import { gameReducer, makeInitialState } from "../src/game";
import { type CPUPlayer, playerToMove, evaluateRolloutCut, evaluateRolloutInv, evaluateRolloutDiv, randomizeRedealOppCaptures, evaluateRolloutSigmoidS, evaluateRolloutSigmoidSW, randomizeRedealOppBlurOwnCaptures } from "../src/cpu/cpu";
import { RandomPlayer } from "../src/cpu/random";
import { RandomLegalPlayer } from "../src/cpu/random_legal";
import { SimpleMCTSPlayer } from "../src/cpu/simple_mcts";
import { ISMCTSPlayer } from "../src/cpu/ismcts";
import { MOISMCTSPlayer } from "../src/cpu/mo_ismcts";
import { ISMCTSObsPlayer } from "../src/cpu/ismcts_obs";
import { MOISMCTSObsPlayer } from "../src/cpu/mo_ismcts_obs";

type Builder = () => CPUPlayer;

export const BUILDERS: Record<string, Builder> = {
    random: () => new RandomPlayer(),
    randomsb: () => new RandomPlayer({ stop_bias: true }),
    randomL: () => new RandomLegalPlayer(),
    simple: () => new SimpleMCTSPlayer(),
    simplerc: () => new SimpleMCTSPlayer({ randomize: randomizeRedealOppCaptures }),
    simplejb: () => new SimpleMCTSPlayer({ junk_bias: true }),
    simplesb: () => new SimpleMCTSPlayer({ stop_bias: true }),
    simplercsb: () => new SimpleMCTSPlayer({ stop_bias: true, randomize: randomizeRedealOppCaptures }),
    simpleracsb: () => new SimpleMCTSPlayer({ stop_bias: true, randomize: randomizeRedealOppBlurOwnCaptures }),
    simplerac: () => new SimpleMCTSPlayer({ randomize: randomizeRedealOppBlurOwnCaptures }),
    simplec: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutCut }),
    simplei: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutInv }),
    simpled: () => new SimpleMCTSPlayer({ evaluateRollout: evaluateRolloutDiv }),
    simplesbd: () => new SimpleMCTSPlayer({ stop_bias: true, evaluateRollout: evaluateRolloutDiv }),
    simplesbi: () => new SimpleMCTSPlayer({ stop_bias: true, evaluateRollout: evaluateRolloutInv }),
    simplesbs: () => new SimpleMCTSPlayer({ stop_bias: true, evaluateRollout: evaluateRolloutSigmoidS }),
    simplesbsw: () => new SimpleMCTSPlayer({ stop_bias: true, evaluateRollout: evaluateRolloutSigmoidSW }),
    simplebd: () => new SimpleMCTSPlayer({
        stop_bias: true, budget: {
            DEALING: 200,
            CAPTURING: 4000,
            FORCED_CAPTURE: 2000,
            YAKU_CHOICE: 20000,
        }
    }),
    sois: () => new ISMCTSPlayer(),
    mois: () => new MOISMCTSPlayer(),
    soisobs: () => new ISMCTSObsPlayer(),
    soisobssb: () => new ISMCTSObsPlayer({ stop_bias: true }),
    moisobs: () => new MOISMCTSObsPlayer(),
};

interface Args {
    p0: string;
    p1: string;
    games: number;
    swap: boolean;
    threads: number;
}

function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const args: Args = {
        p0: "random",
        p1: "ismcts",
        games: 10,
        swap: false,
        threads: 7,
    };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--p0") args.p0 = argv[++i];
        else if (a === "--p1") args.p1 = argv[++i];
        else if (a === "--games" || a === "-n")
            args.games = parseInt(argv[++i], 10);
        else if (a === "--swap") args.swap = true;
        else if (a === "--threads" || a === "-j")
            args.threads = parseInt(argv[++i], 10);
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
        `  --threads N    Worker threads (default: 16)\n` +
        `\nPlayers: ${Object.keys(BUILDERS).join(", ")}\n`,
    );
}

export function playGame(
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
    std: number;
    max: number;
    p5: number;
    p95: number;
}
function stats(arr: number[]): Stats {
    const p5 = percentile(arr, 5);
    const p95 = percentile(arr, 95);
    const trimmed = arr.filter((x) => x >= p5 && x <= p95);
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    const variance =
        trimmed.reduce((a, b) => a + (b - avg) ** 2, 0) / trimmed.length;
    return {
        avg,
        std: Math.sqrt(variance),
        max: Math.max(...arr),
        p5,
        p95,
    };
}
function fmt(s: Stats, decimals = 1): string {
    const d = (n: number) => n.toFixed(decimals);
    return `avg=${d(s.avg)}  std=${d(s.std)}  max=${d(s.max)}  p5=${d(s.p5)}  p95=${d(s.p95)}`;
}

interface GameResult {
    steps: number;
    s0: number;
    s1: number;
    elapsed: number;
    p0Starts: boolean;
}

async function main(): Promise<void> {
    const args = parseArgs();
    const log = console.log.bind(console);

    const threads = Math.max(1, Math.min(args.threads, args.games));
    log(
        `Match: p0=${args.p0} vs p1=${args.p1} — ${args.games} games  (${threads} threads)` +
        (args.swap ? "  (--swap: p0 starts every other game)" : ""),
    );

    // Spin up the pool. Each worker registers the TS resolver hook, imports
    // this file to grab BUILDERS/playGame, and then services games via
    // postMessage. Workers are long-lived so the per-worker startup cost is
    // paid once.
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerPath = path.resolve(__dirname, "cpu-match-worker.mjs");
    const tSpawn = Date.now();
    const workers = await Promise.all(
        Array.from({ length: threads }, () => new Promise<Worker>((resolve, reject) => {
            const w = new Worker(workerPath, {
                execArgv: ["--experimental-transform-types"],
            });
            const onReady = (msg: { type: string }) => {
                if (msg.type === "ready") {
                    w.off("message", onReady);
                    resolve(w);
                }
            };
            w.on("message", onReady);
            w.on("error", reject);
        })),
    );
    log(`  workers ready in ${((Date.now() - tSpawn) / 1000).toFixed(1)}s`);

    // One persistent listener per worker, dispatching results back to the
    // promise that issued the request.
    const pending = new Map<number, (r: GameResult) => void>();
    for (const w of workers) {
        w.on("message", (msg: { type: string; id: number; result: GameResult }) => {
            if (msg.type === "result") {
                const cb = pending.get(msg.id);
                if (cb) {
                    pending.delete(msg.id);
                    cb(msg.result);
                }
            }
        });
    }

    const wins = { p0: 0, p1: 0 };
    const scores: { p0: number[]; p1: number[] } = { p0: [], p1: [] };
    const lengths: number[] = [];
    let ties = 0;
    let completed = 0;
    let nextGame = 0;
    let nextId = 0;
    const workerArgs = { p0: args.p0, p1: args.p1, swap: args.swap };

    const start = Date.now();
    const dispatchNext = (w: Worker): Promise<void> => {
        const g = nextGame++;
        if (g >= args.games) return Promise.resolve();
        return new Promise<void>((resolve) => {
            const id = nextId++;
            pending.set(id, (r) => {
                completed++;
                lengths.push(r.steps);
                if (r.s0 > r.s1) {
                    wins.p0++;
                    scores.p0.push(r.s0);
                } else if (r.s1 > r.s0) {
                    wins.p1++;
                    scores.p1.push(r.s1);
                } else {
                    ties++;
                    scores.p0.push(r.s0);
                    scores.p1.push(r.s1);
                }
                const startsTag = args.swap
                    ? `  starts=${r.p0Starts ? "p0" : "p1"}`
                    : "";
                log(
                    `  [${completed}/${args.games}] game ${g + 1} [${r.elapsed.toFixed(1)}s, ${r.steps} steps]  ` +
                    `p0(${args.p0})=${r.s0}  p1(${args.p1})=${r.s1}` +
                    startsTag +
                    "  " +
                    (r.s0 === r.s1 ? "tie" : `winner=${r.s0 > r.s1 ? "p0" : "p1"}`),
                );
                resolve();
            });
            w.postMessage({ type: "game", id, g, args: workerArgs });
        }).then(() => dispatchNext(w));
    };

    await Promise.all(workers.map(dispatchNext));

    await Promise.all(workers.map((w) => new Promise<void>((resolve) => {
        w.once("exit", () => resolve());
        w.postMessage({ type: "shutdown" });
    })));

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

if (isMainThread) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

