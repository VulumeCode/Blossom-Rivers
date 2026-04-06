import january_hikari from './cards/Hanafuda_January_Hikari.svg?raw';
import january_tanzaku from './cards/Hanafuda_January_Tanzaku.svg?raw';
import january_kasu_1 from './cards/Hanafuda_January_Kasu_1.svg?raw';
import january_kasu_2 from './cards/Hanafuda_January_Kasu_2.svg?raw';
import february_tane from './cards/Hanafuda_February_Tane.svg?raw';
import february_tanzaku from './cards/Hanafuda_February_Tanzaku.svg?raw';
import february_kasu_1 from './cards/Hanafuda_February_Kasu_1.svg?raw';
import february_kasu_2 from './cards/Hanafuda_February_Kasu_2.svg?raw';
import march_hikari from './cards/Hanafuda_March_Hikari.svg?raw';
import march_tanzaku from './cards/Hanafuda_March_Tanzaku.svg?raw';
import march_kasu_1 from './cards/Hanafuda_March_Kasu_1.svg?raw';
import march_kasu_2 from './cards/Hanafuda_March_Kasu_2.svg?raw';
import april_tane from './cards/Hanafuda_April_Tane.svg?raw';
import april_tanzaku from './cards/Hanafuda_April_Tanzaku.svg?raw';
import april_kasu_1 from './cards/Hanafuda_April_Kasu_1.svg?raw';
import april_kasu_2 from './cards/Hanafuda_April_Kasu_2.svg?raw';
import may_tane from './cards/Hanafuda_May_Tane.svg?raw';
import may_tanzaku from './cards/Hanafuda_May_Tanzaku.svg?raw';
import may_kasu_1 from './cards/Hanafuda_May_Kasu_1.svg?raw';
import may_kasu_2 from './cards/Hanafuda_May_Kasu_2.svg?raw';
import june_tane from './cards/Hanafuda_June_Tane.svg?raw';
import june_tanzaku from './cards/Hanafuda_June_Tanzaku.svg?raw';
import june_kasu_1 from './cards/Hanafuda_June_Kasu_1.svg?raw';
import june_kasu_2 from './cards/Hanafuda_June_Kasu_2.svg?raw';
import july_tane from './cards/Hanafuda_July_Tane.svg?raw';
import july_tanzaku from './cards/Hanafuda_July_Tanzaku.svg?raw';
import july_kasu_1 from './cards/Hanafuda_July_Kasu_1.svg?raw';
import july_kasu_2 from './cards/Hanafuda_July_Kasu_2.svg?raw';
import august_hikari from './cards/Hanafuda_August_Hikari.svg?raw';
import august_tane from './cards/Hanafuda_August_Tane.svg?raw';
import august_kasu_1 from './cards/Hanafuda_August_Kasu_1.svg?raw';
import august_kasu_2 from './cards/Hanafuda_August_Kasu_2.svg?raw';
import september_tane from './cards/Hanafuda_September_Tane.svg?raw';
import september_tanzaku from './cards/Hanafuda_September_Tanzaku.svg?raw';
import september_kasu_1 from './cards/Hanafuda_September_Kasu_1.svg?raw';
import september_kasu_2 from './cards/Hanafuda_September_Kasu_2.svg?raw';
import october_tane from './cards/Hanafuda_October_Tane.svg?raw';
import october_tanzaku from './cards/Hanafuda_October_Tanzaku.svg?raw';
import october_kasu_1 from './cards/Hanafuda_October_Kasu_1.svg?raw';
import october_kasu_2 from './cards/Hanafuda_October_Kasu_2.svg?raw';
import november_hikari from './cards/Hanafuda_November_Hikari.svg?raw';
import november_tane from './cards/Hanafuda_November_Tane.svg?raw';
import november_tanzaku from './cards/Hanafuda_November_Tanzaku.svg?raw';
import november_kasu from './cards/Hanafuda_November_Kasu.svg?raw';
import december_hikari from './cards/Hanafuda_December_Hikari.svg?raw';
import december_kasu_1 from './cards/Hanafuda_December_Kasu_1.svg?raw';
import december_kasu_2 from './cards/Hanafuda_December_Kasu_2.svg?raw';
import december_kasu_3 from './cards/Hanafuda_December_Kasu_3.svg?raw';
import card_back from './cards/Hanafuda_card_back.svg?raw';

const COLOR_TO_VAR: [string, string][] = [
    ['#f4f3ef', 'var(--card-paper)'],
    ['#50b271', 'var(--card-green)'],
    ['#592116', 'var(--card-frame-outer)'],
    ['#992d17', 'var(--card-frame-inner)'],
    ['#d81e1e', 'var(--card-red)'],
    ['#ffb85a', 'var(--card-amber)'],
    ['#997664', 'var(--card-bark)'],
    ['#6060bf', 'var(--card-purple)'],
    ['#ff8db6', 'var(--card-pink)'],
    ['#82d8d0', 'var(--card-teal)'],
];

function processSvg(raw: string, id: string): string {
    let svg = raw;
    // Replace hardcoded colors with CSS variable references
    for (const [hex, cssVar] of COLOR_TO_VAR) {
        svg = svg.replaceAll(hex, cssVar);
    }
    // Convert inline fill="var(--...)" to style="fill: var(--...)" (card back)
    svg = svg.replace(/fill="(var\(--[^)]+\))"/g, 'style="fill: $1"');
    // Scope class names to prevent collisions between inlined SVGs
    svg = svg.replace(/\.cls-(\d+)/g, `.${id}-$1`);
    svg = svg.replace(/class="cls-(\d+)"/g, `class="${id}-$1"`);
    // Scope clipPath IDs
    svg = svg.replaceAll('id="clip-path"', `id="cp-${id}"`);
    svg = svg.replaceAll('url(#clip-path)', `url(#cp-${id})`);
    return svg;
}

export const images = {
    january_hikari: processSvg(january_hikari, 'january_hikari'),
    january_tanzaku: processSvg(january_tanzaku, 'january_tanzaku'),
    january_kasu_1: processSvg(january_kasu_1, 'january_kasu_1'),
    january_kasu_2: processSvg(january_kasu_2, 'january_kasu_2'),
    february_tane: processSvg(february_tane, 'february_tane'),
    february_tanzaku: processSvg(february_tanzaku, 'february_tanzaku'),
    february_kasu_1: processSvg(february_kasu_1, 'february_kasu_1'),
    february_kasu_2: processSvg(february_kasu_2, 'february_kasu_2'),
    march_hikari: processSvg(march_hikari, 'march_hikari'),
    march_tanzaku: processSvg(march_tanzaku, 'march_tanzaku'),
    march_kasu_1: processSvg(march_kasu_1, 'march_kasu_1'),
    march_kasu_2: processSvg(march_kasu_2, 'march_kasu_2'),
    april_tane: processSvg(april_tane, 'april_tane'),
    april_tanzaku: processSvg(april_tanzaku, 'april_tanzaku'),
    april_kasu_1: processSvg(april_kasu_1, 'april_kasu_1'),
    april_kasu_2: processSvg(april_kasu_2, 'april_kasu_2'),
    may_tane: processSvg(may_tane, 'may_tane'),
    may_tanzaku: processSvg(may_tanzaku, 'may_tanzaku'),
    may_kasu_1: processSvg(may_kasu_1, 'may_kasu_1'),
    may_kasu_2: processSvg(may_kasu_2, 'may_kasu_2'),
    june_tane: processSvg(june_tane, 'june_tane'),
    june_tanzaku: processSvg(june_tanzaku, 'june_tanzaku'),
    june_kasu_1: processSvg(june_kasu_1, 'june_kasu_1'),
    june_kasu_2: processSvg(june_kasu_2, 'june_kasu_2'),
    july_tane: processSvg(july_tane, 'july_tane'),
    july_tanzaku: processSvg(july_tanzaku, 'july_tanzaku'),
    july_kasu_1: processSvg(july_kasu_1, 'july_kasu_1'),
    july_kasu_2: processSvg(july_kasu_2, 'july_kasu_2'),
    august_hikari: processSvg(august_hikari, 'august_hikari'),
    august_tane: processSvg(august_tane, 'august_tane'),
    august_kasu_1: processSvg(august_kasu_1, 'august_kasu_1'),
    august_kasu_2: processSvg(august_kasu_2, 'august_kasu_2'),
    september_tane: processSvg(september_tane, 'september_tane'),
    september_tanzaku: processSvg(september_tanzaku, 'september_tanzaku'),
    september_kasu_1: processSvg(september_kasu_1, 'september_kasu_1'),
    september_kasu_2: processSvg(september_kasu_2, 'september_kasu_2'),
    october_tane: processSvg(october_tane, 'october_tane'),
    october_tanzaku: processSvg(october_tanzaku, 'october_tanzaku'),
    october_kasu_1: processSvg(october_kasu_1, 'october_kasu_1'),
    october_kasu_2: processSvg(october_kasu_2, 'october_kasu_2'),
    november_hikari: processSvg(november_hikari, 'november_hikari'),
    november_tane: processSvg(november_tane, 'november_tane'),
    november_tanzaku: processSvg(november_tanzaku, 'november_tanzaku'),
    november_kasu: processSvg(november_kasu, 'november_kasu'),
    december_hikari: processSvg(december_hikari, 'december_hikari'),
    december_kasu_1: processSvg(december_kasu_1, 'december_kasu_1'),
    december_kasu_2: processSvg(december_kasu_2, 'december_kasu_2'),
    december_kasu_3: processSvg(december_kasu_3, 'december_kasu_3'),
    card_back: processSvg(card_back, 'card_back'),
};
