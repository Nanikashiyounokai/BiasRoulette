/**
 * 偏りルーレットの中核ロジック。UI から切り離してテストできるようにしている。
 *
 * 1 項目に比率が 2 つある。
 * - weight（表比率）: 盤面の扇形の大きさ。見た目の確率。
 * - bias  （裏比率）: 実際に当たる確率。
 *
 * 旧アプリ（Android / iOS）と同じく、抽選は bias で行い、
 * 針は「当たった項目の扇形の中のどこか」に止める。
 */

export type Item = {
  id: string;
  name: string;
  /** 表比率。1〜100 */
  weight: number;
  /** 裏比率。0〜100。0 にすると絶対に当たらない */
  bias: number;
  /** 盤面の色（#RRGGBB）。未指定ならパレットから順番に割り当てる */
  color?: string;
};

export type Roulette = {
  id: string;
  name: string;
  items: Item[];
  /** false のときは表比率どおりに抽選する（レビュー要望「裏設定の ON/OFF」） */
  biasEnabled: boolean;
  /** 当たった項目を次の抽選から外す（順番決め・席替え用） */
  removeWinners: boolean;
  createdAt: number;
  updatedAt: number;
  lastPlayedAt?: number;
};

export const WEIGHT_MIN = 1;
export const BIAS_MIN = 0;
export const RATIO_MAX = 100;
export const MAX_ITEMS = 30;

/**
 * 全角数字・全角記号を半角に寄せてから整数として読む。
 *
 * 旧 Android 版は `toInt()` に直接渡しており、IME によっては全角数字や 11 桁以上が入って
 * NumberFormatException で落ちていた（Play Vitals に実際に上がっていたクラッシュ）。
 */
export function parseRatio(text: string): number | null {
  const half = text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim();
  if (!/^\d{1,3}$/.test(half)) return null;
  return Number(half);
}

export function isValidWeight(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= WEIGHT_MIN && value <= RATIO_MAX;
}

export function isValidBias(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= BIAS_MIN && value <= RATIO_MAX;
}

/** 抽選に使う比率。裏設定が OFF なら表比率をそのまま使う */
export function effectiveOdds(roulette: Pick<Roulette, 'biasEnabled'>, items: Item[]): number[] {
  return items.map((it) => (roulette.biasEnabled ? it.bias : it.weight));
}

/**
 * 重み付き抽選。合計が 0 なら -1 を返す（呼び出し側で「抽選できません」と出す）。
 * 旧版は `box.shuffled()[0]` で、比率がすべて 0 のとき空リストで落ちていた。
 */
export function draw(odds: number[], random: () => number = Math.random): number {
  const total = odds.reduce((s, v) => s + Math.max(0, v), 0);
  if (total <= 0) return -1;
  let r = random() * total;
  for (let i = 0; i < odds.length; i++) {
    const v = Math.max(0, odds[i]);
    if (r < v) return i;
    r -= v;
  }
  return odds.length - 1;
}

/** 各項目の扇形を [開始角, 終了角)（度、12 時方向から時計回り）で返す */
export function sliceAngles(items: Item[]): { start: number; end: number }[] {
  const total = items.reduce((s, it) => s + it.weight, 0);
  if (total <= 0) return items.map(() => ({ start: 0, end: 0 }));
  let acc = 0;
  return items.map((it) => {
    const start = (acc / total) * 360;
    acc += it.weight;
    return { start, end: (acc / total) * 360 };
  });
}

/**
 * 針（12 時方向に固定）が index 番目の扇形を指すように止めるための、盤面の最終回転角。
 *
 * 盤面を時計回りに θ 回すと、針の下に来るのは盤面上の角度 (360 - θ mod 360)。
 * 扇形の端ギリギリで止まると「どっち？」になるので、両端 15% は避ける。
 */
export function stopRotation(
  items: Item[],
  index: number,
  currentRotation: number,
  extraTurns = 6,
  random: () => number = Math.random,
): number {
  const slice = sliceAngles(items)[index];
  if (!slice) return currentRotation;
  const span = slice.end - slice.start;
  const target = slice.start + span * (0.15 + 0.7 * random());
  const desiredMod = (360 - target) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = desiredMod - currentMod;
  if (delta < 0) delta += 360;
  return currentRotation + extraTurns * 360 + delta;
}

/** 表比率・裏比率をパーセント表示用に */
export function percentages(values: number[]): number[] {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  return values.map((v) => (total > 0 ? (Math.max(0, v) / total) * 100 : 0));
}

/**
 * 合計がちょうど 100 になる整数のパーセントに直す（最大剰余法）。
 *
 * 編集画面の「％表示」で使う。比率 1:1:1 は 34/33/33 になる。
 * 0 より大きい値は 1 未満に丸めない（1 が 0% に化けると「絶対に当たらない」に変わってしまう）。
 * 合計が 0 のときはそのまま返す。
 */
export function toPercentInts(values: number[]): number[] {
  const vs = values.map((v) => Math.max(0, v));
  const total = vs.reduce((s, v) => s + v, 0);
  if (total <= 0) return vs.slice();
  const raw = vs.map((v) => (v / total) * 100);
  const out = raw.map((r, i) => (vs[i] > 0 ? Math.max(1, Math.floor(r)) : 0));
  let diff = 100 - out.reduce((s, v) => s + v, 0);
  // 足りない分は端数の大きい順に、多すぎる分は端数の小さい順（かつ 1 より大きいもの）から引く
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) }));
  order.sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; diff > 0; k = (k + 1) % order.length) {
    const { i } = order[k];
    if (vs[i] > 0) {
      out[i] += 1;
      diff -= 1;
    }
  }
  for (let k = order.length - 1; diff < 0; k = (k - 1 + order.length) % order.length) {
    const { i } = order[k];
    if (out[i] > 1) {
      out[i] -= 1;
      diff += 1;
    }
  }
  return out;
}

/**
 * 実際の当選確率がこの範囲の外に出る項目があるルーレットは、回すのにプレミアム（買い切り）かチケットが要る。
 * 0%（絶対に当たらない）と 100%（必ず当たる）も含む。
 * 境界ちょうど（5% / 95%）は無料。等分なら 20 項目（各 5%）まで無料、21 項目からプレミアムになる。
 */
export const PREMIUM_LOW_PCT = 5;
export const PREMIUM_HIGH_PCT = 95;
/** 等分のときに無料で使える項目数（100 / PREMIUM_LOW_PCT） */
export const FREE_MAX_EVEN_ITEMS = Math.floor(100 / PREMIUM_LOW_PCT);

/**
 * プレミアムが要る項目の添字。
 * 裏設定の有無にかかわらず「実際に抽選される確率」で判定する（項目を増やして 5% 未満にした場合も対象）。
 */
export function premiumItemIndexes(roulette: Pick<Roulette, 'biasEnabled' | 'items'>): number[] {
  const real = percentages(effectiveOdds(roulette, roulette.items));
  const eps = 1e-9;
  const out: number[] = [];
  real.forEach((r, i) => {
    if (r < PREMIUM_LOW_PCT - eps || r > PREMIUM_HIGH_PCT + eps) out.push(i);
  });
  return out;
}

export function needsPremium(roulette: Pick<Roulette, 'biasEnabled' | 'items'>): boolean {
  return premiumItemIndexes(roulette).length > 0;
}

export type ValidationError =
  | { kind: 'emptyName' }
  | { kind: 'duplicateName' }
  | { kind: 'tooFewItems' }
  | { kind: 'emptyItemName'; index: number }
  | { kind: 'invalidWeight'; index: number }
  | { kind: 'invalidBias'; index: number }
  | { kind: 'allBiasZero' };

export function validate(roulette: Roulette, otherNames: string[]): ValidationError | null {
  if (!roulette.name.trim()) return { kind: 'emptyName' };
  if (otherNames.includes(roulette.name.trim())) return { kind: 'duplicateName' };
  if (roulette.items.length < 2) return { kind: 'tooFewItems' };
  for (let i = 0; i < roulette.items.length; i++) {
    const it = roulette.items[i];
    if (!it.name.trim()) return { kind: 'emptyItemName', index: i };
    if (!isValidWeight(it.weight)) return { kind: 'invalidWeight', index: i };
    if (!isValidBias(it.bias)) return { kind: 'invalidBias', index: i };
  }
  if (roulette.items.every((it) => it.bias === 0)) return { kind: 'allBiasZero' };
  return null;
}

let seq = 0;
export function newId(): string {
  seq = (seq + 1) % 1000;
  return `${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newRoulette(name = '', items: Omit<Item, 'id'>[] = []): Roulette {
  const now = Date.now();
  return {
    id: newId(),
    name,
    items: items.map((it) => ({ ...it, id: newId() })),
    biasEnabled: true,
    removeWinners: false,
    createdAt: now,
    updatedAt: now,
  };
}
