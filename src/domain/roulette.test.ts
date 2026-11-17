import {
  draw,
  effectiveOdds,
  newRoulette,
  parseRatio,
  percentages,
  FREE_MAX_EVEN_ITEMS,
  needsPremium,
  premiumItemIndexes,
  sliceAngles,
  stopRotation,
  toPercentInts,
  validate,
  type Item,
} from './roulette';

const items = (pairs: [number, number][]): Item[] =>
  pairs.map(([weight, bias], i) => ({ id: String(i), name: `item${i}`, weight, bias }));

describe('parseRatio', () => {
  it('全角数字を半角として読む', () => {
    expect(parseRatio('５０')).toBe(50);
    expect(parseRatio(' 7 ')).toBe(7);
  });
  it('数字以外・桁あふれは null（旧版の NumberFormatException）', () => {
    expect(parseRatio('')).toBeNull();
    expect(parseRatio('1.5')).toBeNull();
    expect(parseRatio('-1')).toBeNull();
    expect(parseRatio('99999999999')).toBeNull();
  });
});

describe('draw', () => {
  it('重みに比例して当たる', () => {
    const odds = [90, 10];
    const counts = [0, 0];
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20000; i++) counts[draw(odds, rand)]++;
    expect(counts[0] / 20000).toBeGreaterThan(0.88);
    expect(counts[0] / 20000).toBeLessThan(0.92);
  });
  it('裏比率 0 の項目は当たらない', () => {
    for (let i = 0; i < 1000; i++) expect(draw([0, 5, 0])).toBe(1);
  });
  it('合計 0 なら -1（旧版は空リストで落ちていた）', () => {
    expect(draw([0, 0])).toBe(-1);
    expect(draw([])).toBe(-1);
  });
});

describe('effectiveOdds', () => {
  it('裏設定 OFF なら表比率で抽選する', () => {
    const its = items([[50, 90], [50, 10]]);
    expect(effectiveOdds({ biasEnabled: true }, its)).toEqual([90, 10]);
    expect(effectiveOdds({ biasEnabled: false }, its)).toEqual([50, 50]);
  });
});

describe('sliceAngles / stopRotation', () => {
  it('扇形は表比率で分割される', () => {
    expect(sliceAngles(items([[1, 1], [3, 1]]))).toEqual([
      { start: 0, end: 90 },
      { start: 90, end: 360 },
    ]);
  });
  it('止まった角度で針が当選項目を指す', () => {
    const its = items([[10, 1], [20, 1], [30, 1], [40, 1]]);
    const slices = sliceAngles(its);
    let rot = 123;
    for (let k = 0; k < 200; k++) {
      const idx = k % its.length;
      rot = stopRotation(its, idx, rot);
      const under = (360 - (rot % 360)) % 360;
      expect(under).toBeGreaterThanOrEqual(slices[idx].start);
      expect(under).toBeLessThan(slices[idx].end);
    }
  });
  it('必ず前方向に回る', () => {
    const its = items([[1, 1], [1, 1]]);
    expect(stopRotation(its, 0, 1000)).toBeGreaterThan(1000 + 360 * 6 - 1);
  });
});

describe('percentages', () => {
  it('合計 100 になる', () => {
    const p = percentages([1, 1, 2]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(p[2]).toBeCloseTo(50);
  });
});

describe('validate', () => {
  const base = () => {
    const r = newRoulette('ランチ', [
      { name: 'カレー', weight: 50, bias: 90 },
      { name: 'ラーメン', weight: 50, bias: 10 },
    ]);
    return r;
  };
  it('正しいものは通る', () => expect(validate(base(), [])).toBeNull());
  it('名前の重複', () => expect(validate(base(), ['ランチ'])).toEqual({ kind: 'duplicateName' }));
  it('項目は 2 つ以上', () => {
    const r = base();
    r.items = r.items.slice(0, 1);
    expect(validate(r, [])).toEqual({ kind: 'tooFewItems' });
  });
  it('裏比率がすべて 0 は不可', () => {
    const r = base();
    r.items.forEach((it) => (it.bias = 0));
    expect(validate(r, [])).toEqual({ kind: 'allBiasZero' });
  });
  it('表比率 0 は不可', () => {
    const r = base();
    r.items[1].weight = 0;
    expect(validate(r, [])).toEqual({ kind: 'invalidWeight', index: 1 });
  });
});

describe('toPercentInts', () => {
  it('合計がちょうど 100 になる', () => {
    expect(toPercentInts([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toPercentInts([1, 2])).toEqual([33, 67]);
    expect(toPercentInts([50, 50])).toEqual([50, 50]);
    const many = toPercentInts(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(many.reduce((s, v) => s + v, 0)).toBe(100);
  });
  it('0 より大きい値は 0% にしない・0 は 0% のまま', () => {
    expect(toPercentInts([1, 100, 100, 0])).toEqual([1, 50, 49, 0]);
    expect(toPercentInts([0, 3])).toEqual([0, 100]);
  });
});

describe('premiumItemIndexes', () => {
  const r = (pairs: [number, number][], biasEnabled = true) => ({ biasEnabled, items: items(pairs) });
  const even = (n: number) => r(Array.from({ length: n }, () => [1, 1] as [number, number]));
  it('実際の確率が 5% 未満・95% 超（0%・100% を含む）の項目が対象', () => {
    expect(premiumItemIndexes(r([[50, 0], [50, 100]]))).toEqual([0, 1]);
    expect(premiumItemIndexes(r([[50, 4], [50, 96]]))).toEqual([0, 1]);
    expect(premiumItemIndexes(r([[50, 5], [50, 95]]))).toEqual([]);
  });
  it('等分なら 20 項目まで無料・21 項目から対象', () => {
    expect(needsPremium(even(FREE_MAX_EVEN_ITEMS))).toBe(false);
    expect(needsPremium(even(FREE_MAX_EVEN_ITEMS + 1))).toBe(true);
  });
  it('裏設定 OFF でも見た目の確率で判定する', () => {
    expect(premiumItemIndexes(r([[50, 0], [50, 100]], false))).toEqual([]);
    expect(premiumItemIndexes(r([[97, 50], [3, 50]], false))).toEqual([0, 1]);
  });
});
