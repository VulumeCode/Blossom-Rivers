import type { CardId } from './types';

import january_tanzaku from './img/cardsShouSuisaiga/january_tanzaku.png';
import january_kasu_1 from './img/cardsShouSuisaiga/january_kasu_1.png';
import january_kasu_2 from './img/cardsShouSuisaiga/january_kasu_2.png';
import january_hikari from './img/cardsShouSuisaiga/january_hikari.png';
import february_kasu_1 from './img/cardsShouSuisaiga/february_kasu_1.png';
import february_tanzaku from './img/cardsShouSuisaiga/february_tanzaku.png';
import february_tane from './img/cardsShouSuisaiga/february_tane.png';
import february_kasu_2 from './img/cardsShouSuisaiga/february_kasu_2.png';
import march_kasu_1 from './img/cardsShouSuisaiga/march_kasu_1.png';
import march_hikari from './img/cardsShouSuisaiga/march_hikari.png';
import march_kasu_2 from './img/cardsShouSuisaiga/march_kasu_2.png';
import march_tanzaku from './img/cardsShouSuisaiga/march_tanzaku.png';
import april_tane from './img/cardsShouSuisaiga/april_tane.png';
import april_kasu_1 from './img/cardsShouSuisaiga/april_kasu_1.png';
import april_kasu_2 from './img/cardsShouSuisaiga/april_kasu_2.png';
import april_tanzaku from './img/cardsShouSuisaiga/april_tanzaku.png';
import may_kasu_1 from './img/cardsShouSuisaiga/may_kasu_1.png';
import may_tane from './img/cardsShouSuisaiga/may_tane.png';
import may_tanzaku from './img/cardsShouSuisaiga/may_tanzaku.png';
import may_kasu_2 from './img/cardsShouSuisaiga/may_kasu_2.png';
import june_tanzaku from './img/cardsShouSuisaiga/june_tanzaku.png';
import june_kasu_1 from './img/cardsShouSuisaiga/june_kasu_1.png';
import june_kasu_2 from './img/cardsShouSuisaiga/june_kasu_2.png';
import june_tane from './img/cardsShouSuisaiga/june_tane.png';
import july_tanzaku from './img/cardsShouSuisaiga/july_tanzaku.png';
import july_kasu_1 from './img/cardsShouSuisaiga/july_kasu_1.png';
import july_kasu_2 from './img/cardsShouSuisaiga/july_kasu_2.png';
import july_tane from './img/cardsShouSuisaiga/july_tane.png';
import august_kasu_1 from './img/cardsShouSuisaiga/august_kasu_1.png';
import august_tane from './img/cardsShouSuisaiga/august_tane.png';
import august_kasu_2 from './img/cardsShouSuisaiga/august_kasu_2.png';
import august_hikari from './img/cardsShouSuisaiga/august_hikari.png';
import september_tane from './img/cardsShouSuisaiga/september_tane.png';
import september_tanzaku from './img/cardsShouSuisaiga/september_tanzaku.png';
import september_kasu_1 from './img/cardsShouSuisaiga/september_kasu_1.png';
import september_kasu_2 from './img/cardsShouSuisaiga/september_kasu_2.png';
import october_tanzaku from './img/cardsShouSuisaiga/october_tanzaku.png';
import october_kasu_1 from './img/cardsShouSuisaiga/october_kasu_1.png';
import october_tane from './img/cardsShouSuisaiga/october_tane.png';
import october_kasu_2 from './img/cardsShouSuisaiga/october_kasu_2.png';
import november_kasu from './img/cardsShouSuisaiga/november_kasu.png';
import november_tane from './img/cardsShouSuisaiga/november_tane.png';
import november_tanzaku from './img/cardsShouSuisaiga/november_tanzaku.png';
import november_hikari from './img/cardsShouSuisaiga/november_hikari.png';
import december_hikari from './img/cardsShouSuisaiga/december_hikari.png';
import december_kasu_1 from './img/cardsShouSuisaiga/december_kasu_1.png';
import december_kasu_2 from './img/cardsShouSuisaiga/december_kasu_2.png';
import december_kasu_3 from './img/cardsShouSuisaiga/december_kasu_3.png';
import card_back from './img/cardsShouSuisaiga/card_back.png';



export const images: Record<string, string> = {
    january_tanzaku, january_kasu_1, january_kasu_2, january_hikari,
    february_kasu_1, february_tanzaku, february_tane, february_kasu_2,
    march_kasu_1, march_hikari, march_kasu_2, march_tanzaku,
    april_tane, april_kasu_1, april_kasu_2, april_tanzaku,
    may_kasu_1, may_tane, may_tanzaku, may_kasu_2,
    june_tanzaku, june_kasu_1, june_kasu_2, june_tane,
    july_tanzaku, july_kasu_1, july_kasu_2, july_tane,
    august_kasu_1, august_tane, august_kasu_2, august_hikari,
    september_tane, september_tanzaku, september_kasu_1, september_kasu_2,
    october_tanzaku, october_kasu_1, october_tane, october_kasu_2,
    november_kasu, november_tane, november_tanzaku, november_hikari,
    december_hikari, december_kasu_1, december_kasu_2, december_kasu_3, card_back
};

export const cardImageById: Record<CardId, string> = {
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
