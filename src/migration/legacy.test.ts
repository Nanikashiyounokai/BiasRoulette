import { toRoulettes } from './legacy';

// jest.mock は import より前に巻き上げられる
jest.mock('expo-file-system', () => ({}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

describe('toRoulettes', () => {
  const rows = [
    { roulette: 'ランチ', item: 'カレー', weight: 50, bias: 90 },
    { roulette: 'ランチ', item: 'ラーメン', weight: 50, bias: 10 },
    { roulette: '罰ゲーム', item: 'A', weight: 1, bias: 1 },
  ];

  it('ルーレット単位にまとめ、並び順を保つ', () => {
    const out = toRoulettes(rows, []);
    expect(out.map((r) => r.name)).toEqual(['ランチ', '罰ゲーム']);
    expect(out[0].items.map((i) => [i.name, i.weight, i.bias])).toEqual([
      ['カレー', 50, 90],
      ['ラーメン', 50, 10],
    ]);
    expect(out[0].biasEnabled).toBe(true);
  });

  it('既存の名前と被ったら番号を付ける', () => {
    expect(toRoulettes(rows, ['ランチ'])[0].name).toBe('ランチ (2)');
  });

  it('範囲外の比率は丸める。裏比率が全部 0 なら表比率で埋める', () => {
    const out = toRoulettes(
      [
        { roulette: 'x', item: 'a', weight: 500, bias: 0 },
        { roulette: 'x', item: 'b', weight: 0, bias: 0 },
      ],
      [],
    );
    expect(out[0].items.map((i) => [i.weight, i.bias])).toEqual([
      [100, 100],
      [1, 1],
    ]);
  });
});
