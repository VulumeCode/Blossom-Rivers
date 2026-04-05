import { describe, it, expect } from 'vitest';
import { computeYaku, CARDS } from './flowerrivers';
import { AnimalCardName, BrightCardName, Card, RibbonCardName, JunkCardName, YakuName } from './types';


const brights = Object.fromEntries(CARDS.filter(c => c.type == "bright").map(c => [c.name, c])) as Record<BrightCardName, Card>;
const ribbons = Object.fromEntries(CARDS.filter(c => c.type == "ribbon").map(c => [c.name, c])) as Record<RibbonCardName, Card>;
const animals = Object.fromEntries(CARDS.filter(c => c.type == "animal").map(c => [c.name, c])) as Record<AnimalCardName, Card>;
const junks = Object.fromEntries(CARDS.filter(c => c.type == "junk").map(c => [c.name, c])) as Record<JunkCardName, Card>;



describe('computeYaku', () => {
  it('returns nothing for empty captured pile', () => {
    const result = computeYaku([]);
    expect(result.yakuList).toEqual<YakuName[]>([]);
    expect(result.total).toBe(0);
  });

  it('returns Three Brights for 3 non-rainman brights', () => {
    const result = computeYaku([
      brights["Pine Crane"], brights["Cherry Curtain"], brights["Pampas Moon"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Three Brights"]);
    expect(result.total).toBe(6);
  });

  it('returns Rainy Four Brights when rain man + 3 other brights are captured', () => {
    const result = computeYaku([
      brights["Pine Crane"], brights["Cherry Curtain"], brights["Pampas Moon"], brights["Willow Rain Man"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Rainy Four Brights"]);
    expect(result.total).toBe(7);
  });

  it('returns Four Brights for 4 brights without rain man', () => {
    const result = computeYaku([
      brights["Pine Crane"], brights["Cherry Curtain"], brights["Pampas Moon"], brights["Paulownia Phoenix"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Four Brights"]);
    expect(result.total).toBe(8);
  });

  it('returns Five Brights for all 5 brights', () => {
    const result = computeYaku([
      brights["Pine Crane"], brights["Cherry Curtain"], brights["Pampas Moon"], brights["Willow Rain Man"], brights["Paulownia Phoenix"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Five Brights"]);
    expect(result.total).toBe(15);
  });

  it('returns Poetry Ribbons for months 1, 2, 3 ribbons', () => {
    const result = computeYaku([
      ribbons["Cherry Poetry"], ribbons["Pine Poetry"], ribbons["Plum Poetry"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Poetry Ribbons"]);
    expect(result.total).toBe(5);
  });

  it('returns Poetry Ribbons for months 1, 2, 3 ribbons + other ribbons', () => {
    const result = computeYaku([
      ribbons["Cherry Poetry"], ribbons["Pine Poetry"], ribbons["Plum Poetry"],
      ribbons["Chrysanthemum Blue"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Poetry Ribbons"]);
    expect(result.total).toBe(5);
  });

  it('returns Blue Ribbons for months 6, 9, 10 ribbons', () => {
    const result = computeYaku([
      ribbons["Maple Blue"], ribbons["Peony Blue"], ribbons["Chrysanthemum Blue"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Blue Ribbons"]);
    expect(result.total).toBe(5);
  });

  it('returns Blue Ribbons for months 6, 9, 10 ribbons + other ribbons', () => {
    const result = computeYaku([
      ribbons["Maple Blue"], ribbons["Peony Blue"], ribbons["Chrysanthemum Blue"],
      ribbons["Cherry Poetry"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Blue Ribbons"]);
    expect(result.total).toBe(5);
  });

  it('returns nothing for 3 random ribbons', () => {
    const result = computeYaku([
      ribbons["Maple Blue"],
      ribbons["Iris Plain"],
      ribbons["Cherry Poetry"]]);
    expect(result.yakuList).toEqual<YakuName[]>([]);
    expect(result.total).toBe(0);
  });

  it('returns Boar-Deer-Butterfly for months 7, 10, 6 animals', () => {
    const result = computeYaku([
      animals["Clover Boar"], animals["Maple Deer"], animals["Peony Butterflies"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Boar-Deer-Butterfly"]);
    expect(result.total).toBe(5);
  });

  it('returns Flower Viewing for Cherry Curtain + Chrysanthemum Sake', () => {
    const result = computeYaku([
      brights["Cherry Curtain"], animals["Chrysanthemum Sake"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Flower Viewing"]);
    expect(result.total).toBe(5);
  });

  it('returns Moon Viewing for Pampas Moon + Chrysanthemum Sake', () => {
    const result = computeYaku([
      brights["Pampas Moon"], animals["Chrysanthemum Sake"]]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Moon Viewing"]);
    expect(result.total).toBe(5);
  });

  it('returns Animals yaku at 5+ animals', () => {
    const result = computeYaku([
      animals["Chrysanthemum Sake"],
      animals["Maple Deer"],
      animals["Peony Butterflies"],
      animals["Iris Bridge"],
      animals["Wisteria Cuckoo"],
    ]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Animals"]);
    expect(result.total).toBe(1);
  });

  it('returns Ribbons yaku at 5+ ribbons', () => {
    const result = computeYaku([
      ribbons["Cherry Poetry"],
      ribbons["Chrysanthemum Blue"],
      ribbons["Clover Plain"],
      ribbons["Iris Plain"],
      ribbons["Maple Blue"],
    ]);
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Ribbons"]);
    expect(result.total).toBe(1);
  });

  it('returns Junk yaku at 10+ junk', () => {
    const result = computeYaku(Object.values(junks).slice(0, 10));
    expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Junk"]);
    expect(result.total).toBe(1);
  });

  describe('awards extra points for each card over threshold in Animals/Ribbons/Junk', () => {

    it('returns Animals yaku with extra points  at 6 animals', () => {
      const result = computeYaku([
        animals["Chrysanthemum Sake"],
        animals["Maple Deer"],
        animals["Peony Butterflies"],
        animals["Iris Bridge"],
        animals["Wisteria Cuckoo"],
        animals["Pampas Geese"],
      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Animals"]);
      expect(result.total).toBe(2);
    });
    it('returns Ribbons yaku with extra points  at 6 ribbons', () => {
      const result = computeYaku([
        ribbons["Cherry Poetry"],
        ribbons["Pine Poetry"],
        ribbons["Clover Plain"],
        ribbons["Iris Plain"],
        ribbons["Chrysanthemum Blue"],
        ribbons["Maple Blue"],
      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Ribbons"]);
      expect(result.total).toBe(2);
    });
    it('returns Ribbons yaku with extra points at 8 ribbons', () => {
      const result = computeYaku([
        ribbons["Cherry Poetry"],
        ribbons["Pine Poetry"],
        ribbons["Clover Plain"],
        ribbons["Iris Plain"],
        ribbons["Willow Plain"],
        ribbons["Wisteria Plain"],
        ribbons["Chrysanthemum Blue"],
        ribbons["Maple Blue"],
      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Ribbons"]);
      expect(result.total).toBe(4);
    });
    it('returns Junk yaku with extra points at 11 junk', () => {
      const result = computeYaku(Object.values(junks).slice(0, 11));
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Junk"]);
      expect(result.total).toBe(2);
    });
    it('returns Junk yaku with extra points at 12 junk', () => {
      const result = computeYaku(Object.values(junks).slice(0, 12));
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Junk"]);
      expect(result.total).toBe(3);
    });
  });
  describe('stacking yaku', () => {
    it('returns Junk & Animals yaku', () => {
      const result = computeYaku([
        ...Object.values(junks).slice(0, 10),

        animals["Chrysanthemum Sake"],
        animals["Maple Deer"],
        animals["Peony Butterflies"],
        animals["Iris Bridge"],
        animals["Wisteria Cuckoo"],
      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Animals", "Junk"]);
      expect(result.total).toBe(2);
    });

    it('returns Boar-Deer-Butterfly  & Animals yaku', () => {
      const result = computeYaku([
        animals["Clover Boar"],
        animals["Maple Deer"],
        animals["Peony Butterflies"],

        animals["Chrysanthemum Sake"],
        animals["Iris Bridge"],
        animals["Wisteria Cuckoo"],
      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>(["Boar-Deer-Butterfly", "Animals"]);
      expect(result.total).toBe(7);
    });

    it('returns Poetry & Blue yaku', () => {
      const result = computeYaku([
        ribbons["Maple Blue"], ribbons["Peony Blue"], ribbons["Chrysanthemum Blue"],

        ribbons["Cherry Poetry"], ribbons["Pine Poetry"], ribbons["Plum Poetry"],

      ]);
      expect(result.yakuList.map(y => y.name)).toEqual<YakuName[]>([
        "Poetry Ribbons",
        "Blue Ribbons",
        "Ribbons",
      ]);
      expect(result.total).toBe(12);
    });

  });
});
