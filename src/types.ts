export type CardType = 'bright' | 'animal' | 'ribbon' | 'junk';

export interface Card {
  id: string;
  month: number;
  type: CardType;
  name: string;
  img: string;
}

export interface YakuEntry {
  name: string;
  points: number;
  isJunk: boolean;
}

export interface YakuResult {
  yakuList: YakuEntry[];
  total: number;
}

export interface YakuDef {
  name: string;
  points: number;
  isJunk: boolean;
  check: (cards: Card[]) => boolean;
  group?: string;
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

export type RiverHighlightType = 'capture' | 'forced' | 'drop' | null;

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
