import { countType, hasCard } from './cards';
import { Card, YakuDef, YakuEntry, YakuResult } from './types';

const YAKU_DEFS: YakuDef[] = [
    {
        name: 'Five Brights', points: 15, isJunk: false,
        check: (c) => countType(c, 'bright') === 5,
        group: 'bright', rank: 5,
    },
    {
        name: 'Four Brights', points: 8, isJunk: false,
        check: (c) => countType(c, 'bright') === 4 && !hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 4,
    },
    {
        name: 'Rainy Four Brights', points: 7, isJunk: false,
        check: (c) => countType(c, 'bright') >= 4 && hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 3,
    },
    {
        name: 'Three Brights', points: 6, isJunk: false,
        check: (c) => countType(c, 'bright') >= 3 && !hasCard(c, '11-bright-rainman'),
        group: 'bright', rank: 2,
    },
    {
        name: 'Poetry Ribbons', points: 5, isJunk: false,
        check: (c) => hasCard(c, '1-ribbon') && hasCard(c, '2-ribbon') && hasCard(c, '3-ribbon'),
    },
    {
        name: 'Blue Ribbons', points: 5, isJunk: false,
        check: (c) => hasCard(c, '6-ribbon') && hasCard(c, '9-ribbon') && hasCard(c, '10-ribbon'),
    },
    {
        name: 'Grass Ribbons', points: 5, isJunk: false,
        check: (c) => hasCard(c, '4-ribbon') && hasCard(c, '5-ribbon') && hasCard(c, '7-ribbon'),
    },
    {
        name: 'Boar-Deer-Butterfly', points: 5, isJunk: false,
        check: (c) => hasCard(c, '7-animal') && hasCard(c, '10-animal') && hasCard(c, '6-animal'),
    },
    {
        name: 'Flower Viewing', points: 5, isJunk: false,
        check: (c) => hasCard(c, '3-bright') && hasCard(c, '9-animal'),
    },
    {
        name: 'Moon Viewing', points: 5, isJunk: false,
        check: (c) => hasCard(c, '8-bright') && hasCard(c, '9-animal'),
    },
    {
        name: 'Animals', points: 1, isJunk: false,
        check: (c) => countType(c, 'animal') >= 5,
        extra: (c) => Math.max(0, countType(c, 'animal') - 5),
    },
    {
        name: 'Ribbons', points: 1, isJunk: false,
        check: (c) => countType(c, 'ribbon') >= 5,
        extra: (c) => Math.max(0, countType(c, 'ribbon') - 5),
    },
    {
        name: 'Junk', points: 1, isJunk: true,
        check: (c) => (countType(c, 'junk') + (+(hasCard(c, '9-animal')))) >= 10,
        extra: (c) => Math.max(0, (countType(c, 'junk') + (+(hasCard(c, '9-animal')))) - 10),
    },
];

export function computeYaku(captured: Card[]): YakuResult {
    const matched: YakuEntry[] = [];
    let bestBright: YakuDef | null = null;
    for (const y of YAKU_DEFS) {
        if (!y.check(captured)) continue;
        if (y.group === 'bright') {
            if (!bestBright || (y.rank !== undefined && bestBright.rank !== undefined && y.rank > bestBright.rank)) bestBright = y;
        } else {
            const pts = y.points + (y.extra ? y.extra(captured) : 0);
            matched.push({ name: y.name, points: pts, isJunk: y.isJunk });
        }
    }
    if (bestBright) {
        matched.unshift({ name: bestBright.name, points: bestBright.points, isJunk: false });
    }
    const total = matched.reduce((s, m) => s + m.points, 0);
    return { yakuList: matched, total };
}

export function nonJunkPoints(yakuList: YakuEntry[]) {
    return yakuList.filter(y => !y.isJunk).reduce((s, y) => s + y.points, 0);
}
