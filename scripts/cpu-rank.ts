// Continuous bot-ranking harness.
//
// Maintains an OpenSkill (mu / sigma) rating for every bot in BUILDERS, stored
// in a SQLite database so the process can be stopped (Ctrl+C) and restarted at
// any time without losing progress. Bots added to BUILDERS between runs are
// picked up automatically and seeded with a default rating.
//
// Each worker, whenever it goes idle, plays one match chosen like so:
//   1. pick a bot A uniformly at random,
//   2. pick the opponent B with the highest predictDraw vs A (closest match —
//      the most informative game to play),
// then the result updates both ratings by RANK only (final score is ignored),
// the leaderboard is reprinted, and the worker picks a fresh pairing.
//
//   npx vite-node scripts/cpu-rank.ts -- --threads 7
//   npm run cpu-rank -- --threads 7 --db scripts/cpu-rank.db

/// <reference types="node" />

import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ordinal, predictDraw, rate, rating } from "openskill";
import { BUILDERS } from "./builders";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(SCRIPT_DIR, "cpu-rank.log");

// Append a timestamped stack trace to the log file (and stderr). Used by the
// uncaught-exception / worker-death handlers so failures are never swallowed.
function logErr(where: string, err: unknown): void {
    const detail = err instanceof Error ? (err.stack ?? err.message) : String(err);
    const line = `[${new Date().toISOString()}] [main] ${where}\n${detail}\n\n`;
    try {
        appendFileSync(LOG_PATH, line);
    } catch {
        // Logging must never itself crash the process.
    }
    process.stderr.write(line);
}

process.on("uncaughtException", (err) => {
    logErr("uncaughtException", err);
    process.exit(1);
});
process.on("unhandledRejection", (err) => {
    logErr("unhandledRejection", err);
    process.exit(1);
});

// node:sqlite is too new for vite-node's builtin list, so importing it as an ES
// module makes vite try to resolve it as a package. Pull it in via a runtime
// require instead (the type-only import below is erased before vite sees it).
import type { DatabaseSync as DatabaseSyncT } from "node:sqlite";
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

const DEFAULT = rating(); // { mu: 25, sigma: 8.333... }

interface Args {
    threads: number;
    matches: number;
    db: string;
}

function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const args: Args = { threads: 7, matches: 5, db: "scripts/cpu-rank.db" };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--threads" || a === "-j") args.threads = parseInt(argv[++i], 10);
        else if (a === "--matches" || a === "-n") args.matches = parseInt(argv[++i], 10);
        else if (a === "--db") args.db = argv[++i];
        else if (a === "--help" || a === "-h") {
            process.stdout.write(
                `Usage: vite-node scripts/cpu-rank.ts -- [opts]\n` +
                `  --threads N   Worker threads / concurrent pairings (default: 7)\n` +
                `  --matches N   Games per pairing (default: 4)\n` +
                `  --db PATH     SQLite file (default: scripts/cpu-rank.db)\n`,
            );
            process.exit(0);
        } else {
            console.error(`Unknown arg: ${a}`);
            process.exit(1);
        }
    }
    return args;
}

// --- Rating store -----------------------------------------------------------

interface Row {
    name: string;
    mu: number;
    sigma: number;
    games: number;
    wins: number;
    losses: number;
    ties: number;
}

class RatingStore {
    private db: DatabaseSyncT;
    private selOne;
    private upsert;
    private bump;

    constructor(file: string) {
        this.db = new DatabaseSync(file);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ratings (
                name       TEXT PRIMARY KEY,
                mu         REAL NOT NULL,
                sigma      REAL NOT NULL,
                games      INTEGER NOT NULL DEFAULT 0,
                wins       INTEGER NOT NULL DEFAULT 0,
                losses     INTEGER NOT NULL DEFAULT 0,
                ties       INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER
            );
        `);
        this.selOne = this.db.prepare(
            `SELECT name, mu, sigma, games, wins, losses, ties FROM ratings WHERE name = ?`,
        );
        this.upsert = this.db.prepare(
            `UPDATE ratings SET mu = ?, sigma = ?, games = games + ?,
                 wins = wins + ?, losses = losses + ?, ties = ties + ?,
                 updated_at = ? WHERE name = ?`,
        );
        this.bump = this.db.prepare(
            `INSERT OR IGNORE INTO ratings (name, mu, sigma) VALUES (?, ?, ?)`,
        );
    }

    // Make sure every currently-known bot has a row; leaves existing stats be.
    seed(names: string[]): void {
        for (const n of names) this.bump.run(n, DEFAULT.mu, DEFAULT.sigma);
    }

    get(name: string): Row {
        return this.selOne.get(name) as unknown as Row;
    }

    // Apply the outcome of a pairing of `winsA + winsB + ties` games. Ratings
    // are updated from the win counts as scores (higher = better; OpenSkill
    // ignores the actual points scored in the games). W-L-T tallies accumulate.
    record(
        a: string,
        b: string,
        winsA: number,
        winsB: number,
        ties: number,
    ): void {
        const ra = this.get(a);
        const rb = this.get(b);
        const [[na], [nb]] = rate(
            [[{ mu: ra.mu, sigma: ra.sigma }], [{ mu: rb.mu, sigma: rb.sigma }]],
            { score: [winsA, winsB] },
        );
        const now = Date.now();
        const total = winsA + winsB + ties;
        this.upsert.run(na.mu, na.sigma, total, winsA, winsB, ties, now, a);
        this.upsert.run(nb.mu, nb.sigma, total, winsB, winsA, ties, now, b);
    }

    leaderboard(names: string[]): Row[] {
        return names
            .map((n) => this.get(n))
            .sort((x, y) => ordinal(y) - ordinal(x));
    }

    close(): void {
        this.db.close();
    }
}

// --- Pairing ----------------------------------------------------------------

// Weighted (roulette-wheel) pick. Falls back to a uniform pick if the weights
// collapse to ~0.
function weightedPick(items: string[], weights: number[]): string {
    let total = 0;
    for (const w of weights) total += w;
    let target = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        target -= weights[i];
        if (target <= 0) return items[i];
    }
    return items[Math.floor(Math.random() * items.length)];
}

// Pick A weighted inversely by games played (so under-played bots get matched
// sooner), then sample the opponent B with probability proportional to
// predictDraw vs A — closely-matched bots (the most informative games) are
// favoured, but every opponent keeps a non-zero chance, so the pairing explores.
function selectPair(store: RatingStore, names: string[]): [string, string] {
    const a = weightedPick(
        names,
        names.map((n) => 1 / (store.get(n).games + 1)),
    );
    const ra = store.get(a);
    const teamA = [{ mu: ra.mu, sigma: ra.sigma }];

    const candidates = names.filter((b) => b !== a);
    const weights = candidates.map((b) => {
        const rb = store.get(b);
        return predictDraw([teamA, [{ mu: rb.mu, sigma: rb.sigma }]]);
    });
    return [a, weightedPick(candidates, weights)];
}

// --- Output -----------------------------------------------------------------

function printLeaderboard(store: RatingStore, names: string[], total: number): void {
    const rows = store.leaderboard(names);
    const lines = rows.map((r, i) => {
        const rank = String(i + 1).padStart(2);
        const name = r.name.padEnd(12);
        const ord = ordinal(r).toFixed(2).padStart(7);
        const mu = r.mu.toFixed(2).padStart(6);
        const sig = r.sigma.toFixed(2).padStart(5);
        const wlt = `${r.wins}-${r.losses}-${r.ties}`.padStart(11);
        return `  ${rank}. ${name} ord=${ord}  mu=${mu}  sigma=${sig}  W-L-T=${wlt}  (${r.games})`;
    });
    console.clear();
    console.log(`Bot ranking — ${total} games played, ${names.length} bots\n`);
    console.log(lines.join("\n"));
    console.log("\n(Ctrl+C to stop; progress is saved continuously.)");
}

// --- Worker pool ------------------------------------------------------------

interface GameResult {
    steps: number;
    s0: number;
    s1: number;
    elapsed: number;
    p0Starts: boolean;
}

async function main(): Promise<void> {
    const args = parseArgs();
    const names = Object.keys(BUILDERS);
    if (names.length < 2) {
        console.error("Need at least 2 bots in BUILDERS to rank.");
        process.exit(1);
    }

    const store = new RatingStore(args.db);
    store.seed(names);

    const workerPath = path.resolve(SCRIPT_DIR, "cpu-match-worker.mjs");

    const workers = await Promise.all(
        Array.from({ length: args.threads }, () =>
            new Promise<Worker>((resolve, reject) => {
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
            }),
        ),
    );

    let running = true;

    interface Pending {
        resolve: (r: GameResult) => void;
        reject: (e: unknown) => void;
        worker: Worker;
    }
    const pending = new Map<number, Pending>();
    const aliveWorkers = new Set<Worker>(workers);

    // Reject every game still in flight on `w` — called when a worker dies so
    // the awaiting pump unblocks (and logs) instead of hanging forever.
    const failWorkerPending = (w: Worker, err: unknown) => {
        for (const [id, p] of pending) {
            if (p.worker === w) {
                pending.delete(id);
                p.reject(err);
            }
        }
    };

    for (const w of workers) {
        w.on("message", (msg: { type: string; id: number; result: GameResult; stack?: string; message?: string }) => {
            if (msg.type === "result") {
                const p = pending.get(msg.id);
                if (p) {
                    pending.delete(msg.id);
                    p.resolve(msg.result);
                }
            } else if (msg.type === "error") {
                const p = pending.get(msg.id);
                const err = new Error(msg.message ?? "worker game error");
                if (msg.stack) err.stack = msg.stack;
                logErr("worker reported game error", err);
                if (p) {
                    pending.delete(msg.id);
                    p.reject(err);
                }
            }
        });
        w.on("error", (err) => {
            logErr("worker 'error' event", err);
            failWorkerPending(w, err);
        });
        w.on("exit", (code) => {
            aliveWorkers.delete(w);
            if (running && code !== 0) {
                const err = new Error(`worker exited unexpectedly with code ${code}`);
                logErr("worker 'exit' event", err);
                failWorkerPending(w, err);
            }
        });
    }

    let total = store.leaderboard(names).reduce((s, r) => s + r.games, 0) / 2;
    let nextId = 0;

    // Play a single game on `w`; rejects if the worker dies mid-game.
    const playOne = (w: Worker, p0: string, p1: string, g: number) =>
        new Promise<GameResult>((resolve, reject) => {
            const id = nextId++;
            pending.set(id, { resolve, reject, worker: w });
            w.postMessage({ type: "game", id, g, args: { p0, p1, swap: true } });
        });

    // Keep a worker busy: pick a pairing, play `matches` games, record the win
    // counts as scores, reprint, repeat. A failed game is logged and its pairing
    // abandoned; if the worker itself died, the loop exits cleanly.
    const pump = async (w: Worker): Promise<void> => {
        while (running && aliveWorkers.has(w)) {
            const [a, b] = selectPair(store, names);
            let winsA = 0, winsB = 0, ties = 0;
            try {
                for (let m = 0; m < args.matches && running; m++) {
                    // Randomise seat & opening turn so neither bot gets a fixed edge.
                    const aIsP0 = Math.random() < 0.5;
                    const p0 = aIsP0 ? a : b;
                    const p1 = aIsP0 ? b : a;
                    const g = Math.random() < 0.5 ? 1 : 0; // worker: p0Starts = swap && g%2===1
                    const r = await playOne(w, p0, p1, g);
                    const sA = aIsP0 ? r.s0 : r.s1;
                    const sB = aIsP0 ? r.s1 : r.s0;
                    if (sA > sB) winsA++;
                    else if (sB > sA) winsB++;
                    else ties++;
                }
            } catch (err) {
                logErr(`pairing ${a} vs ${b}`, err);
                continue; // abandon this pairing; loop re-checks running & alive
            }
            if (winsA + winsB + ties === 0) break; // stopped before any game ran
            store.record(a, b, winsA, winsB, ties);
            total += winsA + winsB + ties;
            printLeaderboard(store, names, total);
        }
    };

    const shutdown = async () => {
        if (!running) return;
        running = false;
        console.log("\nStopping — waiting for workers to exit...");
        await Promise.all(
            workers.map((w) => new Promise<void>((resolve) => {
                w.once("exit", () => resolve());
                w.postMessage({ type: "shutdown" });
            })),
        );
        store.close();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    printLeaderboard(store, names, total);
    for (const w of workers) pump(w).catch((err) => logErr("pump loop", err));
}

main().catch((err) => {
    logErr("main", err);
    process.exit(1);
});
