// Worker bootstrap. Registers the TS resolver hook, imports cpu-match.ts to
// grab BUILDERS/playGame, then services one game per message.

import { register } from "node:module";
import { parentPort } from "node:worker_threads";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, "cpu-rank.log");

// Append a timestamped stack trace to the shared log file. console.error is
// muted below, so this is how worker-side failures become visible.
function logErr(where, err) {
    const detail = err && err.stack ? err.stack : String(err);
    try {
        appendFileSync(LOG_PATH, `[${new Date().toISOString()}] [worker] ${where}\n${detail}\n\n`);
    } catch {
        // Logging must never itself crash the worker.
    }
}

// Last-resort handlers so nothing dies silently.
process.on("uncaughtException", (err) => { logErr("uncaughtException", err); process.exit(1); });
process.on("unhandledRejection", (err) => { logErr("unhandledRejection", err); process.exit(1); });

register(pathToFileURL(path.join(__dirname, "ts-resolver.mjs")));

const { BUILDERS, playGame } = await import(
    pathToFileURL(path.join(__dirname, "cpu-match.ts")).href
);

// CPU players use console.log for debug; muting keeps the pool quiet. Result
// payloads go back through postMessage, not stdout.
console.log = () => { };
console.error = () => { };

parentPort.postMessage({ type: "ready" });
parentPort.on("message", (msg) => {
    if (msg.type === "game") {
        const { args, g, id } = msg;
        try {
            const seat0 = BUILDERS[args.p0]();
            const seat1 = BUILDERS[args.p1]();
            const p0Starts = args.swap && g % 2 === 1;
            const t0 = Date.now();
            const { state: result, steps, koikoiCalls } = playGame(seat0, seat1, p0Starts);
            const elapsed = (Date.now() - t0) / 1000;
            const [s0, s1] = result.scores;
            parentPort.postMessage({
                type: "result",
                id,
                result: { steps, s0, s1, elapsed, p0Starts, koikoi0: koikoiCalls[0], koikoi1: koikoiCalls[1] },
            });
        } catch (err) {
            logErr(`game ${args.p0} vs ${args.p1}`, err);
            parentPort.postMessage({
                type: "error",
                id,
                message: err && err.message ? err.message : String(err),
                stack: err && err.stack ? err.stack : undefined,
            });
        }
    } else if (msg.type === "shutdown") {
        process.exit(0);
    }
});
