import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { isJapanese } from './i18n';
import type { Item } from './domain/roulette';

/**
 * 初回起動で「何を作ればいいか」迷わせないためのテンプレート。
 * ストア検索で拾われやすい用途（ランチ・罰ゲーム・順番決め）を並べている。
 */
export type Template = {
  /** 線画のアイコン。絵文字は使わない（機械的に作った印象になるため・2026-10-13 指摘） */
  icon: ComponentProps<typeof Ionicons>['name'];
  name: string;
  items: Omit<Item, 'id'>[];
  removeWinners?: boolean;
};

const even = (names: string[]): Omit<Item, 'id'>[] =>
  names.map((name) => ({ name, weight: 1, bias: 1 }));

const ja: Template[] = [
  {
    icon: 'restaurant-outline',
    name: '今日のランチ',
    items: [
      { name: 'カレー', weight: 1, bias: 3 },
      { name: 'ラーメン', weight: 1, bias: 1 },
      { name: '定食', weight: 1, bias: 1 },
      { name: 'パスタ', weight: 1, bias: 1 },
    ],
  },
  {
    icon: 'flame-outline',
    name: '罰ゲーム',
    items: even(['一発ギャグ', 'モノマネ', '変顔で写真', '恥ずかしい話', '全員にジュース', 'セーフ']),
  },
  { icon: 'swap-vertical-outline', name: '順番決め', items: even(['1番', '2番', '3番', '4番']), removeWinners: true },
  { icon: 'calendar-outline', name: '掃除当番', items: even(['Aさん', 'Bさん', 'Cさん', 'Dさん']) },
  { icon: 'git-compare-outline', name: 'Yes / No', items: even(['Yes', 'No']) },
];

const en: Template[] = [
  {
    icon: 'restaurant-outline',
    name: 'Lunch picker',
    items: [
      { name: 'Burgers', weight: 1, bias: 3 },
      { name: 'Sushi', weight: 1, bias: 1 },
      { name: 'Pizza', weight: 1, bias: 1 },
      { name: 'Salad', weight: 1, bias: 1 },
    ],
  },
  { icon: 'flame-outline', name: 'Dares', items: even(['Sing a song', 'Do an impression', 'Funny face selfie', 'Tell a secret', 'Buy drinks', 'Safe!']) },
  { icon: 'swap-vertical-outline', name: 'Turn order', items: even(['1st', '2nd', '3rd', '4th']), removeWinners: true },
  { icon: 'calendar-outline', name: 'Chores', items: even(['Dishes', 'Laundry', 'Trash', 'Vacuum']) },
  { icon: 'git-compare-outline', name: 'Yes / No', items: even(['Yes', 'No']) },
];

export const templates = isJapanese ? ja : en;
