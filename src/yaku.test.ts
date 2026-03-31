import { describe, it, expect } from 'vitest';
import { computeYaku } from './flowerrivers';

describe('computeYaku', () => {
  it('returns empty yakuList and zero total for empty captured pile', () => {
    const result = computeYaku([]);
    expect(result.yakuList).toEqual([]);
    expect(result.total).toBe(0);
  });

  it.todo('returns Three Brights for 3 non-rainman brights');
  it.todo('returns Rainy Four Brights when rain man + 3 other brights are captured');
  it.todo('returns Four Brights for 4 brights without rain man');
  it.todo('returns Five Brights for all 5 brights');
  it.todo('returns Poetry Ribbons for months 1, 2, 3 ribbons');
  it.todo('returns Blue Ribbons for months 6, 9, 10 ribbons');
  it.todo('returns Boar-Deer-Butterfly for months 7, 10, 6 animals');
  it.todo('returns Flower Viewing for Cherry Curtain + Chrysanthemum Sake');
  it.todo('returns Moon Viewing for Pampas Moon + Chrysanthemum Sake');
  it.todo('returns Animals yaku at 5+ animals');
  it.todo('returns Ribbons yaku at 5+ ribbons');
  it.todo('returns Junk yaku at 10+ junk');
  it.todo('awards extra points for each card over threshold in Animals/Ribbons/Junk');
  it.todo('only highest bright group counts, not multiple bright yaku');
});
