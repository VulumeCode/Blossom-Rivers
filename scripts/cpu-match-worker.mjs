// Worker bootstrap. Registers the TS resolver hook, imports cpu-match.ts to
// grab BUILDERS/playGame, then services one game per message.

import { register } from "node:module";
import { parentPort } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
        const seat0 = BUILDERS[args.p0]();
        const seat1 = BUILDERS[args.p1]();
        const p0Starts = args.swap && g % 2 === 1;
        const t0 = Date.now();
        const { state: result, steps } = playGame(seat0, seat1, p0Starts);
        const elapsed = (Date.now() - t0) / 1000;
        const [s0, s1] = result.scores;
        parentPort.postMessage({
            type: "result",
            id,
            result: { steps, s0, s1, elapsed, p0Starts },
        });
    } else if (msg.type === "shutdown") {
        process.exit(0);
    }
});
