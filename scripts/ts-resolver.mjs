// Node module hook: resolve extension-less relative imports to .ts/.tsx.
// Lets workers load the project's TS files directly without vite-node, since
// the codebase uses `from "./foo"` instead of `from "./foo.ts"`.

const EXTS = [".ts", ".tsx", ".mts", ".cts"];

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const hasExt = /\.[a-z0-9]+$/i.test(specifier);
        if (!hasExt) {
            for (const ext of EXTS) {
                try { return await nextResolve(specifier + ext, context); }
                catch { /* try next */ }
            }
            for (const ext of EXTS) {
                try { return await nextResolve(specifier + "/index" + ext, context); }
                catch { /* try next */ }
            }
        }
    }
    return nextResolve(specifier, context);
}
