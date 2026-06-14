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
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ordinal, predictDraw, rate, rating } from "openskill";
import { BUILDERS } from "./builders";

// node:sqlite is too new for vite-node's builtin list, so importing it as an ES
// module makes vite try to resolve it as a package. Pull it in via a runtime
// require instead (the type-only import below is erased before vite sees it).
import type { DatabaseSync as DatabaseSyncT } from "node:sqlite";
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

const DEFAULT = rating(); // { mu: 25, sigma: 8.333... }

interface Args {
    threads: number;
    db: string;
}

function parseArgs(): Args {
    const argv = process.argv.slice(2);
    const args: Args = { threads: 7, db: "scripts/cpu-rank.db" };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--threads" || a === "-j") args.threads = parseInt(argv[++i], 10);
        else if (a === "--db") args.db = argv[++i];
        else if (a === "--help" || a === "-h") {
            process.stdout.write(
                `Usage: vite-node scripts/cpu-rank.ts -- [opts]\n` +
                `  --threads N   Worker threads / concurrent matches (default: 7)\n` +
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
            `UPDATE ratings SET mu = ?, sigma = ?, games = games + 1,
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

    // Apply one match outcome. `rank` is 1 for the winner, 2 for the loser,
    // equal for a tie (OpenSkill: lower rank = better).
    record(
        a: string,
        b: string,
        rankA: number,
        rankB: number,
    ): void {
        const ra = this.get(a);
        const rb = this.get(b);
        const [[na], [nb]] = rate(
            [[{ mu: ra.mu, sigma: ra.sigma }], [{ mu: rb.mu, sigma: rb.sigma }]],
            { rank: [rankA, rankB] },
        );
        const now = Date.now();
        const wlt = (r: number) => [r === 1 ? 1 : 0, r === 2 ? 1 : 0, r !== 1 && r !== 2 ? 1 : 0] as const;
        const tie = rankA === rankB;
        const [wa, la] = tie ? [0, 0] : wlt(rankA);
        const [wb, lb] = tie ? [0, 0] : wlt(rankB);
        this.upsert.run(na.mu, na.sigma, wa, la, tie ? 1 : 0, now, a);
        this.upsert.run(nb.mu, nb.sigma, wb, lb, tie ? 1 : 0, now, b);
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
    console.log(`Bot ranking — ${total} matches played, ${names.length} bots\n`);
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

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerPath = path.resolve(__dirname, "cpu-match-worker.mjs");

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

    let running = true;
    let total = store.leaderboard(names).reduce((s, r) => s + r.games, 0) / 2;
    let nextId = 0;

    // Keep a worker busy: pick a pairing, play, record, reprint, repeat.
    const pump = (w: Worker): void => {
        if (!running) return;
        const [a, b] = selectPair(store, names);
        // Randomise seat and opening turn so neither bot gets a fixed edge.
        const aIsP0 = Math.random() < 0.5;
        const p0 = aIsP0 ? a : b;
        const p1 = aIsP0 ? b : a;
        const g = Math.random() < 0.5 ? 1 : 0; // worker: p0Starts = swap && g%2===1

        const id = nextId++;
        pending.set(id, (r) => {
            const sA = aIsP0 ? r.s0 : r.s1;
            const sB = aIsP0 ? r.s1 : r.s0;
            const rankA = sA > sB ? 1 : sA < sB ? 2 : 1;
            const rankB = sB > sA ? 1 : sB < sA ? 2 : 1;
            store.record(a, b, rankA, rankB);
            total++;
            printLeaderboard(store, names, total);
            pump(w);
        });
        w.postMessage({ type: "game", id, g, args: { p0, p1, swap: true } });
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
    for (const w of workers) pump(w);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
