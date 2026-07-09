import type { CardId } from './types';

const CDN = 'https://otwartekarty.pl/storage/hanafuda-luizy-kwiatkowskiej';


// Styczeń (January)
const january_tanzaku = `${CDN}/1.webp`;
const january_kasu_1 = `${CDN}/2.webp`;
const january_kasu_2 = `${CDN}/3.webp`;
const january_hikari = `${CDN}/4.webp`;
// Luty (February)
const february_kasu_1 = `${CDN}/5.webp`;
const february_tanzaku = `${CDN}/6.webp`;
const february_tane = `${CDN}/7.webp`;
const february_kasu_2 = `${CDN}/8.webp`;
// Marzec (March)
const march_kasu_1 = `${CDN}/9.webp`;
const march_hikari = `${CDN}/10.webp`;
const march_kasu_2 = `${CDN}/11.webp`;
const march_tanzaku = `${CDN}/12.webp`;
// Kwiecień (April)
const april_tane = `${CDN}/13.webp`;
const april_kasu_1 = `${CDN}/14.webp`;
const april_kasu_2 = `${CDN}/15.webp`;
const april_tanzaku = `${CDN}/16.webp`;
// Maj (May)
const may_kasu_1 = `${CDN}/17.webp`;
const may_tane = `${CDN}/18.webp`;
const may_tanzaku = `${CDN}/19.webp`;
const may_kasu_2 = `${CDN}/20.webp`;
// Czerwiec (June)
const june_tanzaku = `${CDN}/21.webp`;
const june_kasu_1 = `${CDN}/22.webp`;
const june_kasu_2 = `${CDN}/23.webp`;
const june_tane = `${CDN}/24.webp`;
// Lipiec (July)
const july_tanzaku = `${CDN}/25.webp`;
const july_kasu_1 = `${CDN}/26.webp`;
const july_kasu_2 = `${CDN}/27.webp`;
const july_tane = `${CDN}/28.webp`;
// Sierpień (August)
const august_kasu_1 = `${CDN}/29.webp`;
const august_tane = `${CDN}/30.webp`;
const august_kasu_2 = `${CDN}/31.webp`;
const august_hikari = `${CDN}/32.webp`;
// Wrzesień (September)
const september_tane = `${CDN}/33.webp`;
const september_tanzaku = `${CDN}/34.webp`;
const september_kasu_1 = `${CDN}/35.webp`;
const september_kasu_2 = `${CDN}/36.webp`;
// Październik (October)
const october_tanzaku = `${CDN}/37.webp`;
const october_kasu_1 = `${CDN}/38.webp`;
const october_tane = `${CDN}/39.webp`;
const october_kasu_2 = `${CDN}/40.webp`;
// Listopad (November)
const november_kasu = `${CDN}/41.webp`;
const november_tane = `${CDN}/42.webp`;
const november_tanzaku = `${CDN}/43.webp`;
const november_hikari = `${CDN}/44.webp`;
// Grudzień (December)
const december_hikari = `${CDN}/45.webp`;
const december_kasu_1 = `${CDN}/46.webp`;
const december_kasu_2 = `${CDN}/47.webp`;
const december_kasu_3 = `${CDN}/48.webp`;

const card_back = `${CDN}/0.webp`;


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
