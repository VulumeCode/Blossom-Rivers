export type CardType =
  | 'bright'
  | 'animal'
  | 'ribbon'
  | 'junk'

export type CardId =
  | '1-bright'
  | '1-ribbon'
  | '1-junk-1'
  | '1-junk-2'
  | '2-animal'
  | '2-ribbon'
  | '2-junk-1'
  | '2-junk-2'
  | '3-bright'
  | '3-ribbon'
  | '3-junk-1'
  | '3-junk-2'
  | '4-animal'
  | '4-ribbon'
  | '4-junk-1'
  | '4-junk-2'
  | '5-animal'
  | '5-ribbon'
  | '5-junk-1'
  | '5-junk-2'
  | '6-animal'
  | '6-ribbon'
  | '6-junk-1'
  | '6-junk-2'
  | '7-animal'
  | '7-ribbon'
  | '7-junk-1'
  | '7-junk-2'
  | '8-bright'
  | '8-animal'
  | '8-junk-1'
  | '8-junk-2'
  | '9-animal'
  | '9-ribbon'
  | '9-junk-1'
  | '9-junk-2'
  | '10-animal'
  | '10-ribbon'
  | '10-junk-1'
  | '10-junk-2'
  | '11-bright-rainman'
  | '11-animal'
  | '11-ribbon'
  | '11-junk-lightning'
  | '12-bright'
  | '12-junk-1'
  | '12-junk-2'
  | '12-junk-3'

export type BrightCardName =
  | 'Pine Crane'
  | 'Cherry Curtain'
  | 'Pampas Moon'
  | 'Willow Rain Man'
  | 'Paulownia Phoenix'

export type PoetyCardName =
  | 'Pine Poetry'
  | 'Plum Poetry'
  | 'Cherry Poetry'

export type BlueCardName =
  | 'Peony Blue Ribbon'
  | 'Chrysanthemum Blue Ribbon'
  | 'Maple Blue Ribbon'

export type GrassCardName =
  | 'Wisteria Grass Ribbon'
  | 'Iris Grass Ribbon'
  | 'Clover Grass Ribbon'

export type RibbonCardName =
  | PoetyCardName
  | BlueCardName
  | GrassCardName
  | 'Willow Ribbon'

export type AnimalCardName =
  | 'Plum Nightingale'
  | 'Wisteria Cuckoo'
  | 'Iris Bridge'
  | 'Peony Butterflies'
  | 'Clover Boar'
  | 'Pampas Geese'
  | 'Chrysanthemum Sake'
  | 'Maple Deer'
  | 'Willow Swallow'

export type JunkCardName =
  | 'Pine'
  | 'Plum'
  | 'Cherry'
  | 'Wisteria'
  | 'Iris'
  | 'Peony'
  | 'Clover'
  | 'Pampas'
  | 'Chrysanthemum'
  | 'Maple'
  | 'Willow Lightning'
  | 'Paulownia';

export type CardName =
  | BrightCardName
  | RibbonCardName
  | AnimalCardName
  | JunkCardName


export interface Card {
  id: CardId;
  month: number;
  type: CardType;
  name: CardName;
  img: string;
}

export type YakuName =
  | 'Five Brights'
  | 'Four Brights'
  | 'Rainy Four Brights'
  | 'Three Brights'
  | 'Poetry Ribbons'
  | 'Blue Ribbons'
  | 'Grass Ribbons'
  | 'Boar-Deer-Butterfly'
  | 'Flower Viewing'
  | 'Moon Viewing'
  | 'Animals'
  | 'Ribbons'
  | 'Junk';

export interface YakuEntry {
  name: YakuName;
  points: number;
  isJunk: boolean;
}

export interface YakuResult {
  yakuList: YakuEntry[];
  total: number;
}

export interface YakuDef {
  name: YakuName;
  points: number;
  isJunk: boolean;
  check: (cards: Card[]) => boolean;
  group?: CardType;
  rank?: number;
  extra?: (cards: Card[]) => number;
}

export type GamePhase =
  | 'MENU'
  | 'DEALING'
  | 'CAPTURING'
  | 'FORCED_CAPTURE'
  | 'YAKU_CHOICE'
  | 'ROUND_OVER'
  | 'GAME_OVER';

export type RiverHighlightType =
  | 'capture' | 'forced' | 'drop' | null;

export interface RoundScoreInfo {
  winner: number;
  yakuList: YakuEntry[];
  basePoints: number;
  sevenBonus?: boolean;
  oppKoikoi?: number;
  drawMultiplier: number;
  finalPoints: number;
}

export interface GameState {
  phase: GamePhase;
  deck: Card[];
  hands: [Card[], Card[]];
  captured: [Card[], Card[]];
  rivers: [Card[], Card[], Card[]];
  dealerIdx: number;
  capturerIdx: number;
  dealStep: number;
  drawnCard: Card | null;
  riversUsedThisTurn: [boolean, boolean, boolean];
  lightningRiver: number | null;
  selectedHandCard: Card | null;
  koikoiCounts: [number, number];
  scores: [number, number];
  round: number;
  turn: number;
  drawMultiplier: number;
  previousPoints: [number, number];
  newYaku: YakuEntry[];
  yakuPlayer: number;
  message: string;
  aiAction: unknown;
  roundScoreInfo: RoundScoreInfo | null;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'DRAW_CARD' }
  | { type: 'DROP_IN_RIVER'; riverIdx: number }
  | { type: 'SELECT_HAND_CARD'; card: Card }
  | { type: 'CAPTURE_RIVER'; riverIdx: number; handCard?: Card }
  | { type: 'DISCARD_TO_RIVER'; riverIdx: number; handCard?: Card }
  | { type: 'CALL_STOP' }
  | { type: 'CALL_KOIKOI' }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET_AI_ACTION'; payload: unknown }
  | { type: 'CLEAR_MESSAGE' };
