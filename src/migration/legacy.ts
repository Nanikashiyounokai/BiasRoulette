import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { newRoulette, type Roulette } from '../domain/roulette';

/**
 * 旧版（ネイティブ版）の Realm に残っているルーレットを 1 回だけ取り込む。
 *
 * 同じ applicationId / bundleId で上書きアップデートするので、旧版の Realm ファイルは
 * アプリのデータ領域にそのまま残っている。
 *
 * | 旧版 | ファイル | クラス | 列 |
 * | --- | --- | --- | --- |
 * | Android 1.6.x（Realm Java） | files/default.realm | Roulette | name, comp_name, comp_num1(表), comp_num2(裏) |
 * | iOS 1.3（RealmSwift）       | Documents/default.realm | RouletteModel | roulette_name, comp_name, comp_ratio1(表), comp_ratio2(裏)（文字列） |
 *
 * - iOS 1.3 のソースは GitHub に無い（GitHub は 1.0 相当）。列名は 20230514_urabe_pre ブランチの定義。
 *   違っていても落ちないよう、スキーマを指定せずに開いて（dynamic）、列名の候補で読む。
 * - 旧ファイルは file format v10 系。realm-js 20 は開くときに v24 へ書き換えるので、
 *   原本ではなくキャッシュにコピーしてから開く（原本は残す）。
 * - realm は「読むためだけ」に入れている。取り込みが済めば二度と開かない。
 */
export async function importLegacyRoulettes(existingNames: string[]): Promise<Roulette[]> {
  if (Platform.OS === 'web') return [];

  const original = new File(Paths.document, 'default.realm');
  if (!original.exists) return [];

  // 新規インストール直後はキャッシュディレクトリがまだ無く、copy が黙って失敗する（リリースビルドで発生）。
  // 失敗したまま開くと realm が空のファイルを新しく作り「旧データ 0 件」で取り込み済みになってしまうので、
  // コピーできなかったら投げて次回の起動でやり直す
  const dir = new Directory(Paths.cache, 'legacy-realm');
  dir.create({ intermediates: true, idempotent: true });
  const copy = new File(dir, `default-${Date.now()}.realm`);
  // SDK 57 では copy は非同期（Promise を返す）。await しないと、開発ビルドではたまたま間に合い、
  // リリースビルドでは間に合わずに空のファイルを開いていた
  await original.copy(copy);
  if (!copy.exists || copy.size !== original.size) throw new Error('旧 Realm ファイルをコピーできなかった');

  // 取り込み不要な端末（新規インストール）では realm のネイティブを読み込まない
  const Realm = (await import('realm')).default;
  const realm = await Realm.open({ path: copy.uri.replace(/^file:\/\//, '') });
  try {
    const classNames = realm.schema.map((s) => s.name);
    const rows = readRows(realm, classNames);
    return toRoulettes(rows, existingNames);
  } finally {
    realm.close();
    try {
      copy.delete();
    } catch {
      // 消せなくても OS がキャッシュを掃除する
    }
  }
}

type Row = { roulette: string; item: string; weight: number; bias: number };

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (k in obj && obj[k] !== null && obj[k] !== undefined) return obj[k];
  return undefined;
}

function toInt(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

// realm の型を import すると型のためだけにネイティブを読みにいくので any で受ける
function readRows(realm: any, classNames: string[]): Row[] {
  const cls = ['Roulette', 'RouletteModel'].find((c) => classNames.includes(c));
  if (!cls) return [];
  const rows: Row[] = [];
  // 旧版は挿入順（Android は id 昇順）で項目の並びを表していた
  for (const o of realm.objects(cls)) {
    const obj = o as Record<string, unknown>;
    const roulette = String(pick(obj, ['name', 'roulette_name']) ?? '').trim();
    const item = String(pick(obj, ['comp_name']) ?? '').trim();
    if (!roulette || !item) continue;
    const weight = toInt(pick(obj, ['comp_num1', 'comp_ratio1']), 1);
    const bias = toInt(pick(obj, ['comp_num2', 'comp_ratio2']), weight);
    rows.push({ roulette, item, weight, bias });
  }
  return rows;
}

/** 旧データの行（1 行 = 1 項目）をルーレット単位にまとめる。テストのため export */
export function toRoulettes(rows: Row[], existingNames: string[]): Roulette[] {
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const g = groups.get(r.roulette) ?? [];
    g.push(r);
    groups.set(r.roulette, g);
  }
  const taken = new Set(existingNames);
  const out: Roulette[] = [];
  for (const [name, group] of groups) {
    let unique = name;
    for (let n = 2; taken.has(unique); n++) unique = `${name} (${n})`;
    taken.add(unique);
    const r = newRoulette(
      unique,
      group.map((g) => ({
        name: g.item,
        weight: clamp(g.weight, 1, 100),
        bias: clamp(g.bias, 0, 100),
      })),
    );
    if (r.items.every((it) => it.bias === 0)) r.items.forEach((it) => (it.bias = it.weight));
    out.push(r);
  }
  return out;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
