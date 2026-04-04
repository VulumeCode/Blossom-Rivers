import { writeFile, mkdir, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/cards');

await mkdir(OUT_DIR, { recursive: true });

const filenames = [
    'Hanafuda_January_Hikari.svg',
    'Hanafuda_January_Tanzaku.svg',
    'Hanafuda_January_Kasu_1.svg',
    'Hanafuda_January_Kasu_2.svg',
    'Hanafuda_February_Tane.svg',
    'Hanafuda_February_Tanzaku.svg',
    'Hanafuda_February_Kasu_1.svg',
    'Hanafuda_February_Kasu_2.svg',
    'Hanafuda_March_Hikari.svg',
    'Hanafuda_March_Tanzaku.svg',
    'Hanafuda_March_Kasu_1.svg',
    'Hanafuda_March_Kasu_2.svg',
    'Hanafuda_April_Tane.svg',
    'Hanafuda_April_Tanzaku.svg',
    'Hanafuda_April_Kasu_1.svg',
    'Hanafuda_April_Kasu_2.svg',
    'Hanafuda_May_Tane.svg',
    'Hanafuda_May_Tanzaku.svg',
    'Hanafuda_May_Kasu_1.svg',
    'Hanafuda_May_Kasu_2.svg',
    'Hanafuda_June_Tane.svg',
    'Hanafuda_June_Tanzaku.svg',
    'Hanafuda_June_Kasu_1.svg',
    'Hanafuda_June_Kasu_2.svg',
    'Hanafuda_July_Tane.svg',
    'Hanafuda_July_Tanzaku.svg',
    'Hanafuda_July_Kasu_1.svg',
    'Hanafuda_July_Kasu_2.svg',
    'Hanafuda_August_Hikari.svg',
    'Hanafuda_August_Tane.svg',
    'Hanafuda_August_Kasu_1.svg',
    'Hanafuda_August_Kasu_2.svg',
    'Hanafuda_September_Tane.svg',
    'Hanafuda_September_Tanzaku.svg',
    'Hanafuda_September_Kasu_1.svg',
    'Hanafuda_September_Kasu_2.svg',
    'Hanafuda_October_Tane.svg',
    'Hanafuda_October_Tanzaku.svg',
    'Hanafuda_October_Kasu_1.svg',
    'Hanafuda_October_Kasu_2.svg',
    'Hanafuda_November_Hikari.svg',
    'Hanafuda_November_Tane.svg',
    'Hanafuda_November_Tanzaku.svg',
    'Hanafuda_November_Kasu.svg',
    'Hanafuda_December_Hikari.svg',
    'Hanafuda_December_Kasu_1.svg',
    'Hanafuda_December_Kasu_2.svg',
    'Hanafuda_December_Kasu_3.svg',
    'Hanafuda_card_back.svg',
];

for (const filename of filenames) {
    const dest = resolve(OUT_DIR, filename);
    try {
        await access(dest);
        console.log(`skip  ${filename}`);
        continue;
    } catch { /* file doesn't exist, download it */ }

    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'BlossomRivers/1.0 (card game asset downloader; one-time setup script)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${filename}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`done  ${filename}`);
    await setTimeout(5000)
}
