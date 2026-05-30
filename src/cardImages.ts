import type { SVGProps } from 'preact/compat';
import type { FunctionComponent } from 'preact';
import type { CardId } from './types';

export type SvgComponent = FunctionComponent<SVGProps<SVGSVGElement>>;

import january_hikari from './cards/Hanafuda_January_Hikari.svg?react';
import january_tanzaku from './cards/Hanafuda_January_Tanzaku.svg?react';
import january_kasu_1 from './cards/Hanafuda_January_Kasu_1.svg?react';
import january_kasu_2 from './cards/Hanafuda_January_Kasu_2.svg?react';
import february_tane from './cards/Hanafuda_February_Tane.svg?react';
import february_tanzaku from './cards/Hanafuda_February_Tanzaku.svg?react';
import february_kasu_1 from './cards/Hanafuda_February_Kasu_1.svg?react';
import february_kasu_2 from './cards/Hanafuda_February_Kasu_2.svg?react';
import march_hikari from './cards/Hanafuda_March_Hikari.svg?react';
import march_tanzaku from './cards/Hanafuda_March_Tanzaku.svg?react';
import march_kasu_1 from './cards/Hanafuda_March_Kasu_1.svg?react';
import march_kasu_2 from './cards/Hanafuda_March_Kasu_2.svg?react';
import april_tane from './cards/Hanafuda_April_Tane.svg?react';
import april_tanzaku from './cards/Hanafuda_April_Tanzaku.svg?react';
import april_kasu_1 from './cards/Hanafuda_April_Kasu_1.svg?react';
import april_kasu_2 from './cards/Hanafuda_April_Kasu_2.svg?react';
import may_tane from './cards/Hanafuda_May_Tane.svg?react';
import may_tanzaku from './cards/Hanafuda_May_Tanzaku.svg?react';
import may_kasu_1 from './cards/Hanafuda_May_Kasu_1.svg?react';
import may_kasu_2 from './cards/Hanafuda_May_Kasu_2.svg?react';
import june_tane from './cards/Hanafuda_June_Tane.svg?react';
import june_tanzaku from './cards/Hanafuda_June_Tanzaku.svg?react';
import june_kasu_1 from './cards/Hanafuda_June_Kasu_1.svg?react';
import june_kasu_2 from './cards/Hanafuda_June_Kasu_2.svg?react';
import july_tane from './cards/Hanafuda_July_Tane.svg?react';
import july_tanzaku from './cards/Hanafuda_July_Tanzaku.svg?react';
import july_kasu_1 from './cards/Hanafuda_July_Kasu_1.svg?react';
import july_kasu_2 from './cards/Hanafuda_July_Kasu_2.svg?react';
import august_hikari from './cards/Hanafuda_August_Hikari.svg?react';
import august_tane from './cards/Hanafuda_August_Tane.svg?react';
import august_kasu_1 from './cards/Hanafuda_August_Kasu_1.svg?react';
import august_kasu_2 from './cards/Hanafuda_August_Kasu_2.svg?react';
import september_tane from './cards/Hanafuda_September_Tane.svg?react';
import september_tanzaku from './cards/Hanafuda_September_Tanzaku.svg?react';
import september_kasu_1 from './cards/Hanafuda_September_Kasu_1.svg?react';
import september_kasu_2 from './cards/Hanafuda_September_Kasu_2.svg?react';
import october_tane from './cards/Hanafuda_October_Tane.svg?react';
import october_tanzaku from './cards/Hanafuda_October_Tanzaku.svg?react';
import october_kasu_1 from './cards/Hanafuda_October_Kasu_1.svg?react';
import october_kasu_2 from './cards/Hanafuda_October_Kasu_2.svg?react';
import november_hikari from './cards/Hanafuda_November_Hikari.svg?react';
import november_tane from './cards/Hanafuda_November_Tane.svg?react';
import november_tanzaku from './cards/Hanafuda_November_Tanzaku.svg?react';
import november_kasu from './cards/Hanafuda_November_Kasu.svg?react';
import december_hikari from './cards/Hanafuda_December_Hikari.svg?react';
import december_kasu_1 from './cards/Hanafuda_December_Kasu_1.svg?react';
import december_kasu_2 from './cards/Hanafuda_December_Kasu_2.svg?react';
import december_kasu_3 from './cards/Hanafuda_December_Kasu_3.svg?react';
import card_back from './cards/Hanafuda_card_back.svg?react';

export const images = {
    january_hikari, january_tanzaku, january_kasu_1, january_kasu_2,
    february_tane, february_tanzaku, february_kasu_1, february_kasu_2,
    march_hikari, march_tanzaku, march_kasu_1, march_kasu_2,
    april_tane, april_tanzaku, april_kasu_1, april_kasu_2,
    may_tane, may_tanzaku, may_kasu_1, may_kasu_2,
    june_tane, june_tanzaku, june_kasu_1, june_kasu_2,
    july_tane, july_tanzaku, july_kasu_1, july_kasu_2,
    august_hikari, august_tane, august_kasu_1, august_kasu_2,
    september_tane, september_tanzaku, september_kasu_1, september_kasu_2,
    october_tane, october_tanzaku, october_kasu_1, october_kasu_2,
    november_hikari, november_tane, november_tanzaku, november_kasu,
    december_hikari, december_kasu_1, december_kasu_2, december_kasu_3,
    card_back,
} as Record<string, SvgComponent>;

export const cardImageById: Record<CardId, SvgComponent> = {
    '1-bright': january_hikari,
    '1-ribbon': january_tanzaku,
    '1-junk-1': january_kasu_1,
    '1-junk-2': january_kasu_2,
    '2-animal': february_tane,
    '2-ribbon': february_tanzaku,
    '2-junk-1': february_kasu_1,
    '2-junk-2': february_kasu_2,
    '3-bright': march_hikari,
    '3-ribbon': march_tanzaku,
    '3-junk-1': march_kasu_1,
    '3-junk-2': march_kasu_2,
    '4-animal': april_tane,
    '4-ribbon': april_tanzaku,
    '4-junk-1': april_kasu_1,
    '4-junk-2': april_kasu_2,
    '5-animal': may_tane,
    '5-ribbon': may_tanzaku,
    '5-junk-1': may_kasu_1,
    '5-junk-2': may_kasu_2,
    '6-animal': june_tane,
    '6-ribbon': june_tanzaku,
    '6-junk-1': june_kasu_1,
    '6-junk-2': june_kasu_2,
    '7-animal': july_tane,
    '7-ribbon': july_tanzaku,
    '7-junk-1': july_kasu_1,
    '7-junk-2': july_kasu_2,
    '8-bright': august_hikari,
    '8-animal': august_tane,
    '8-junk-1': august_kasu_1,
    '8-junk-2': august_kasu_2,
    '9-animal': september_tane,
    '9-ribbon': september_tanzaku,
    '9-junk-1': september_kasu_1,
    '9-junk-2': september_kasu_2,
    '10-animal': october_tane,
    '10-ribbon': october_tanzaku,
    '10-junk-1': october_kasu_1,
    '10-junk-2': october_kasu_2,
    '11-bright-rainman': november_hikari,
    '11-animal': november_tane,
    '11-ribbon': november_tanzaku,
    '11-junk-lightning': november_kasu,
    '12-bright': december_hikari,
    '12-junk-1': december_kasu_1,
    '12-junk-2': december_kasu_2,
    '12-junk-3': december_kasu_3,
};
