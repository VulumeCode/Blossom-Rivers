import { Card, CardType } from './types';
import { images } from './cardImages';

export const CARDS: Card[] = [
    // 1: Pine
    { id: '1-bright', month: 1, type: 'bright', name: 'Pine Crane', img: images.january_hikari },
    { id: '1-ribbon', month: 1, type: 'ribbon', name: 'Pine Poetry', img: images.january_tanzaku },
    { id: '1-junk-1', month: 1, type: 'junk', name: 'Pine', img: images.january_kasu_1 },
    { id: '1-junk-2', month: 1, type: 'junk', name: 'Pine', img: images.january_kasu_2 },
    // 2: Plum
    { id: '2-animal', month: 2, type: 'animal', name: 'Plum Nightingale', img: images.february_tane },
    { id: '2-ribbon', month: 2, type: 'ribbon', name: 'Plum Poetry', img: images.february_tanzaku },
    { id: '2-junk-1', month: 2, type: 'junk', name: 'Plum', img: images.february_kasu_1 },
    { id: '2-junk-2', month: 2, type: 'junk', name: 'Plum', img: images.february_kasu_2 },
    // 3: Cherry
    { id: '3-bright', month: 3, type: 'bright', name: 'Cherry Curtain', img: images.march_hikari },
    { id: '3-ribbon', month: 3, type: 'ribbon', name: 'Cherry Poetry', img: images.march_tanzaku },
    { id: '3-junk-1', month: 3, type: 'junk', name: 'Cherry', img: images.march_kasu_1 },
    { id: '3-junk-2', month: 3, type: 'junk', name: 'Cherry', img: images.march_kasu_2 },
    // 4: Wisteria
    { id: '4-animal', month: 4, type: 'animal', name: 'Wisteria Cuckoo', img: images.april_tane },
    { id: '4-ribbon', month: 4, type: 'ribbon', name: 'Wisteria Grass', img: images.april_tanzaku },
    { id: '4-junk-1', month: 4, type: 'junk', name: 'Wisteria', img: images.april_kasu_1 },
    { id: '4-junk-2', month: 4, type: 'junk', name: 'Wisteria', img: images.april_kasu_2 },
    // 5: Iris
    { id: '5-animal', month: 5, type: 'animal', name: 'Iris Bridge', img: images.may_tane },
    { id: '5-ribbon', month: 5, type: 'ribbon', name: 'Iris Grass', img: images.may_tanzaku },
    { id: '5-junk-1', month: 5, type: 'junk', name: 'Iris', img: images.may_kasu_1 },
    { id: '5-junk-2', month: 5, type: 'junk', name: 'Iris', img: images.may_kasu_2 },
    // 6: Peony
    { id: '6-animal', month: 6, type: 'animal', name: 'Peony Butterflies', img: images.june_tane },
    { id: '6-ribbon', month: 6, type: 'ribbon', name: 'Peony Blue', img: images.june_tanzaku },
    { id: '6-junk-1', month: 6, type: 'junk', name: 'Peony', img: images.june_kasu_1 },
    { id: '6-junk-2', month: 6, type: 'junk', name: 'Peony', img: images.june_kasu_2 },
    // 7: Bush Clover
    { id: '7-animal', month: 7, type: 'animal', name: 'Clover Boar', img: images.july_tane },
    { id: '7-ribbon', month: 7, type: 'ribbon', name: 'Clover Grass', img: images.july_tanzaku },
    { id: '7-junk-1', month: 7, type: 'junk', name: 'Clover', img: images.july_kasu_1 },
    { id: '7-junk-2', month: 7, type: 'junk', name: 'Clover', img: images.july_kasu_2 },
    // 8: Pampas
    { id: '8-bright', month: 8, type: 'bright', name: 'Pampas Moon', img: images.august_hikari },
    { id: '8-animal', month: 8, type: 'animal', name: 'Pampas Geese', img: images.august_tane },
    { id: '8-junk-1', month: 8, type: 'junk', name: 'Pampas', img: images.august_kasu_1 },
    { id: '8-junk-2', month: 8, type: 'junk', name: 'Pampas', img: images.august_kasu_2 },
    // 9: Chrysanthemum
    { id: '9-animal', month: 9, type: 'animal', name: 'Chrysanthemum Sake', img: images.september_tane },
    { id: '9-ribbon', month: 9, type: 'ribbon', name: 'Chrysanthemum Blue', img: images.september_tanzaku },
    { id: '9-junk-1', month: 9, type: 'junk', name: 'Chrysanthemum', img: images.september_kasu_1 },
    { id: '9-junk-2', month: 9, type: 'junk', name: 'Chrysanthemum', img: images.september_kasu_2 },
    // 10: Maple
    { id: '10-animal', month: 10, type: 'animal', name: 'Maple Deer', img: images.october_tane },
    { id: '10-ribbon', month: 10, type: 'ribbon', name: 'Maple Blue', img: images.october_tanzaku },
    { id: '10-junk-1', month: 10, type: 'junk', name: 'Maple', img: images.october_kasu_1 },
    { id: '10-junk-2', month: 10, type: 'junk', name: 'Maple', img: images.october_kasu_2 },
    // 11: Willow
    { id: '11-bright-rainman', month: 11, type: 'bright', name: 'Willow Rain Man', img: images.november_hikari },
    { id: '11-animal', month: 11, type: 'animal', name: 'Willow Swallow', img: images.november_tane },
    { id: '11-ribbon', month: 11, type: 'ribbon', name: 'Willow Plain', img: images.november_tanzaku },
    { id: '11-junk-lightning', month: 11, type: 'junk', name: 'Willow Lightning', img: images.november_kasu },
    // 12: Paulownia
    { id: '12-bright', month: 12, type: 'bright', name: 'Paulownia Phoenix', img: images.december_hikari },
    { id: '12-junk-1', month: 12, type: 'junk', name: 'Paulownia', img: images.december_kasu_1 },
    { id: '12-junk-2', month: 12, type: 'junk', name: 'Paulownia', img: images.december_kasu_2 },
    { id: '12-junk-3', month: 12, type: 'junk', name: 'Paulownia', img: images.december_kasu_3 },
];

// --- CARD HELPERS ---
export const isLightning = (c: Card) => c.id === '11-junk-lightning';
export const isRainMan = (c: Card) => c.id === '11-bright-rainman';
export const isWillow = (c: Card) => c.month === 11;

export const hasCard = (cards: Card[], id: string) => cards.some(c => c.id === id);
export const countType = (cards: Card[], type: CardType) => cards.filter(c => c.type === type).length;
