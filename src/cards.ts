import type { Card, CardType } from './types';

export const CARDS: Card[] = [
    // 1: Pine
    { id: '1-bright', month: 1, type: 'bright', name: 'Pine Crane' },
    { id: '1-ribbon', month: 1, type: 'ribbon', name: 'Pine Poetry' },
    { id: '1-junk-1', month: 1, type: 'junk', name: 'Pine' },
    { id: '1-junk-2', month: 1, type: 'junk', name: 'Pine' },
    // 2: Plum
    { id: '2-animal', month: 2, type: 'animal', name: 'Plum Nightingale' },
    { id: '2-ribbon', month: 2, type: 'ribbon', name: 'Plum Poetry' },
    { id: '2-junk-1', month: 2, type: 'junk', name: 'Plum' },
    { id: '2-junk-2', month: 2, type: 'junk', name: 'Plum' },
    // 3: Cherry
    { id: '3-bright', month: 3, type: 'bright', name: 'Cherry Curtain' },
    { id: '3-ribbon', month: 3, type: 'ribbon', name: 'Cherry Poetry' },
    { id: '3-junk-1', month: 3, type: 'junk', name: 'Cherry' },
    { id: '3-junk-2', month: 3, type: 'junk', name: 'Cherry' },
    // 4: Wisteria
    { id: '4-animal', month: 4, type: 'animal', name: 'Wisteria Cuckoo' },
    { id: '4-ribbon', month: 4, type: 'ribbon', name: 'Wisteria Grass Ribbon' },
    { id: '4-junk-1', month: 4, type: 'junk', name: 'Wisteria' },
    { id: '4-junk-2', month: 4, type: 'junk', name: 'Wisteria' },
    // 5: Iris
    { id: '5-animal', month: 5, type: 'animal', name: 'Iris Bridge' },
    { id: '5-ribbon', month: 5, type: 'ribbon', name: 'Iris Grass Ribbon' },
    { id: '5-junk-1', month: 5, type: 'junk', name: 'Iris' },
    { id: '5-junk-2', month: 5, type: 'junk', name: 'Iris' },
    // 6: Peony
    { id: '6-animal', month: 6, type: 'animal', name: 'Peony Butterflies' },
    { id: '6-ribbon', month: 6, type: 'ribbon', name: 'Peony Blue Ribbon' },
    { id: '6-junk-1', month: 6, type: 'junk', name: 'Peony' },
    { id: '6-junk-2', month: 6, type: 'junk', name: 'Peony' },
    // 7: Bush Clover
    { id: '7-animal', month: 7, type: 'animal', name: 'Clover Boar' },
    { id: '7-ribbon', month: 7, type: 'ribbon', name: 'Clover Grass Ribbon' },
    { id: '7-junk-1', month: 7, type: 'junk', name: 'Clover' },
    { id: '7-junk-2', month: 7, type: 'junk', name: 'Clover' },
    // 8: Pampas
    { id: '8-bright', month: 8, type: 'bright', name: 'Pampas Moon' },
    { id: '8-animal', month: 8, type: 'animal', name: 'Pampas Geese' },
    { id: '8-junk-1', month: 8, type: 'junk', name: 'Pampas' },
    { id: '8-junk-2', month: 8, type: 'junk', name: 'Pampas' },
    // 9: Chrysanthemum
    { id: '9-animal', month: 9, type: 'animal', name: 'Chrysanthemum Sake' },
    { id: '9-ribbon', month: 9, type: 'ribbon', name: 'Chrysanthemum Blue Ribbon' },
    { id: '9-junk-1', month: 9, type: 'junk', name: 'Chrysanthemum' },
    { id: '9-junk-2', month: 9, type: 'junk', name: 'Chrysanthemum' },
    // 10: Maple
    { id: '10-animal', month: 10, type: 'animal', name: 'Maple Deer' },
    { id: '10-ribbon', month: 10, type: 'ribbon', name: 'Maple Blue Ribbon' },
    { id: '10-junk-1', month: 10, type: 'junk', name: 'Maple' },
    { id: '10-junk-2', month: 10, type: 'junk', name: 'Maple' },
    // 11: Willow
    { id: '11-bright-rainman', month: 11, type: 'bright', name: 'Willow Rain Man' },
    { id: '11-animal', month: 11, type: 'animal', name: 'Willow Swallow' },
    { id: '11-ribbon', month: 11, type: 'ribbon', name: 'Willow Ribbon' },
    { id: '11-junk-lightning', month: 11, type: 'junk', name: 'Willow Lightning' },
    // 12: Paulownia
    { id: '12-bright', month: 12, type: 'bright', name: 'Paulownia Phoenix' },
    { id: '12-junk-1', month: 12, type: 'junk', name: 'Paulownia' },
    { id: '12-junk-2', month: 12, type: 'junk', name: 'Paulownia' },
    { id: '12-junk-3', month: 12, type: 'junk', name: 'Paulownia' },
];

// --- CARD HELPERS ---
export const isLightning = (c: Card) => c.id === '11-junk-lightning';
export const isRainMan = (c: Card) => c.id === '11-bright-rainman';
export const isWillow = (c: Card) => c.month === 11;

export const hasCard = (cards: Card[], id: string) => cards.some(c => c.id === id);
export const countType = (cards: Card[], type: CardType) => cards.filter(c => c.type === type).length;
