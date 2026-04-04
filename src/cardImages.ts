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

function svgToDataUri(raw: string): string {
    return 'data:image/svg+xml,' + encodeURIComponent(raw);
}

/** Map from original filename to data URI */
export const CARD_SVGS: Record<string, string> = {
    'Hanafuda_January_Hikari.svg': svgToDataUri(january_hikari),
    'Hanafuda_January_Tanzaku.svg': svgToDataUri(january_tanzaku),
    'Hanafuda_January_Kasu_1.svg': svgToDataUri(january_kasu_1),
    'Hanafuda_January_Kasu_2.svg': svgToDataUri(january_kasu_2),
    'Hanafuda_February_Tane.svg': svgToDataUri(february_tane),
    'Hanafuda_February_Tanzaku.svg': svgToDataUri(february_tanzaku),
    'Hanafuda_February_Kasu_1.svg': svgToDataUri(february_kasu_1),
    'Hanafuda_February_Kasu_2.svg': svgToDataUri(february_kasu_2),
    'Hanafuda_March_Hikari.svg': svgToDataUri(march_hikari),
    'Hanafuda_March_Tanzaku.svg': svgToDataUri(march_tanzaku),
    'Hanafuda_March_Kasu_1.svg': svgToDataUri(march_kasu_1),
    'Hanafuda_March_Kasu_2.svg': svgToDataUri(march_kasu_2),
    'Hanafuda_April_Tane.svg': svgToDataUri(april_tane),
    'Hanafuda_April_Tanzaku.svg': svgToDataUri(april_tanzaku),
    'Hanafuda_April_Kasu_1.svg': svgToDataUri(april_kasu_1),
    'Hanafuda_April_Kasu_2.svg': svgToDataUri(april_kasu_2),
    'Hanafuda_May_Tane.svg': svgToDataUri(may_tane),
    'Hanafuda_May_Tanzaku.svg': svgToDataUri(may_tanzaku),
    'Hanafuda_May_Kasu_1.svg': svgToDataUri(may_kasu_1),
    'Hanafuda_May_Kasu_2.svg': svgToDataUri(may_kasu_2),
    'Hanafuda_June_Tane.svg': svgToDataUri(june_tane),
    'Hanafuda_June_Tanzaku.svg': svgToDataUri(june_tanzaku),
    'Hanafuda_June_Kasu_1.svg': svgToDataUri(june_kasu_1),
    'Hanafuda_June_Kasu_2.svg': svgToDataUri(june_kasu_2),
    'Hanafuda_July_Tane.svg': svgToDataUri(july_tane),
    'Hanafuda_July_Tanzaku.svg': svgToDataUri(july_tanzaku),
    'Hanafuda_July_Kasu_1.svg': svgToDataUri(july_kasu_1),
    'Hanafuda_July_Kasu_2.svg': svgToDataUri(july_kasu_2),
    'Hanafuda_August_Hikari.svg': svgToDataUri(august_hikari),
    'Hanafuda_August_Tane.svg': svgToDataUri(august_tane),
    'Hanafuda_August_Kasu_1.svg': svgToDataUri(august_kasu_1),
    'Hanafuda_August_Kasu_2.svg': svgToDataUri(august_kasu_2),
    'Hanafuda_September_Tane.svg': svgToDataUri(september_tane),
    'Hanafuda_September_Tanzaku.svg': svgToDataUri(september_tanzaku),
    'Hanafuda_September_Kasu_1.svg': svgToDataUri(september_kasu_1),
    'Hanafuda_September_Kasu_2.svg': svgToDataUri(september_kasu_2),
    'Hanafuda_October_Tane.svg': svgToDataUri(october_tane),
    'Hanafuda_October_Tanzaku.svg': svgToDataUri(october_tanzaku),
    'Hanafuda_October_Kasu_1.svg': svgToDataUri(october_kasu_1),
    'Hanafuda_October_Kasu_2.svg': svgToDataUri(october_kasu_2),
    'Hanafuda_November_Hikari.svg': svgToDataUri(november_hikari),
    'Hanafuda_November_Tane.svg': svgToDataUri(november_tane),
    'Hanafuda_November_Tanzaku.svg': svgToDataUri(november_tanzaku),
    'Hanafuda_November_Kasu.svg': svgToDataUri(november_kasu),
    'Hanafuda_December_Hikari.svg': svgToDataUri(december_hikari),
    'Hanafuda_December_Kasu_1.svg': svgToDataUri(december_kasu_1),
    'Hanafuda_December_Kasu_2.svg': svgToDataUri(december_kasu_2),
    'Hanafuda_December_Kasu_3.svg': svgToDataUri(december_kasu_3),
    'Hanafuda_card_back.svg': svgToDataUri(card_back),
};
