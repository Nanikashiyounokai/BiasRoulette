import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { Roulette } from './domain/roulette';
import { importLegacyRoulettes } from './migration/legacy';

/**
 * 保存は AsyncStorage に JSON 1 本。件数は多くて数十なので DB は要らない。
 *
 * 旧版は Realm（Android: Realm Java 10.15 / iOS: RealmSwift）で、
 * Realm Java のネイティブライブラリが Play の 16KB ページサイズ要件に引っかかっていた。
 * 新版では Realm を使わない。旧データは初回起動時に migration/legacy.ts で 1 回だけ取り込む。
 */

const KEY_ROULETTES = 'roulettes.v1';
const KEY_SETTINGS = 'settings.v1';

export type Settings = {
  sound: boolean;
  haptics: boolean;
  themeId: string;
  /** テーマ ID → 解放期限（epoch ms）。リワード広告で 24 時間 */
  themeUnlocks: Record<string, number>;
  legacyImportDone: boolean;
  spinCount: number;
  reviewRequestedAt?: number;
  /** 編集画面の入力方法。既定は％（比率だと分からない人が多い） */
  ratioDisplay: 'percent' | 'ratio';
  /**
   * 極端な確率のルーレットを 1 回使うためのチケット（リワード広告 1 本で 1 枚）。
   * 人前で回す直前に広告を見せると「何か仕込んでる」と思われるので、事前に貯めておけるようにしている
   */
  tickets: number;
  /** 見終えたコーチマーク（画面 ID → true） */
  coachSeen: Record<string, boolean>;
};

const defaultSettings: Settings = {
  sound: true,
  haptics: true,
  themeId: 'classic',
  themeUnlocks: {},
  legacyImportDone: false,
  spinCount: 0,
  ratioDisplay: 'percent',
  tickets: 0,
  coachSeen: {},
};

type Store = {
  ready: boolean;
  roulettes: Roulette[];
  settings: Settings;
  /** 旧版から取り込んだ件数（0 なら何も出さない） */
  migratedCount: number;
  /** 保存する。updatedAt はここで付ける */
  upsert: (r: Roulette) => void;
  /** プレイした時刻を記録する（並び順に使う） */
  markPlayed: (id: string) => void;
  /** リワード広告を見終えたテーマを ms だけ使えるようにする */
  unlockTheme: (themeId: string, ms: number) => void;
  remove: (id: string) => void;
  /** チケットを増減する（上限なし）。0 を下回るなら何もせず false */
  changeTickets: (delta: number) => boolean;
  updateSettings: (patch: Partial<Settings>) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [roulettes, setRoulettes] = useState<Roulette[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [migratedCount, setMigratedCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [rawR, rawS] = await Promise.all([
        AsyncStorage.getItem(KEY_ROULETTES),
        AsyncStorage.getItem(KEY_SETTINGS),
      ]);
      let list: Roulette[] = rawR ? JSON.parse(rawR) : [];
      const s: Settings = { ...defaultSettings, ...(rawS ? JSON.parse(rawS) : {}) };

      if (!s.legacyImportDone) {
        // 取り込みに失敗してもアプリは使えるようにする。失敗時は次回また試す
        try {
          const imported = await importLegacyRoulettes(list.map((r) => r.name));
          list = [...imported, ...list];
          s.legacyImportDone = true;
          setMigratedCount(imported.length);
          await AsyncStorage.multiSet([
            [KEY_ROULETTES, JSON.stringify(list)],
            [KEY_SETTINGS, JSON.stringify(s)],
          ]);
        } catch (e) {
          console.warn('legacy import failed', e);
        }
      }

      setRoulettes(list);
      setSettings(s);
      setReady(true);
    })();
  }, []);

  const persistRoulettes = useCallback((next: Roulette[]) => {
    AsyncStorage.setItem(KEY_ROULETTES, JSON.stringify(next)).catch((e) => console.warn(e));
    return next;
  }, []);

  const upsert = useCallback(
    (input: Roulette) =>
      setRoulettes((prev) => {
        const r = { ...input, updatedAt: Date.now() };
        const i = prev.findIndex((p) => p.id === r.id);
        const next = i >= 0 ? prev.map((p) => (p.id === r.id ? r : p)) : [r, ...prev];
        return persistRoulettes(next);
      }),
    [persistRoulettes],
  );

  const markPlayed = useCallback(
    (id: string) =>
      setRoulettes((prev) =>
        persistRoulettes(prev.map((p) => (p.id === id ? { ...p, lastPlayedAt: Date.now() } : p))),
      ),
    [persistRoulettes],
  );

  const remove = useCallback(
    (id: string) => setRoulettes((prev) => persistRoulettes(prev.filter((p) => p.id !== id))),
    [persistRoulettes],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(next)).catch((e) => console.warn(e));
        return next;
      }),
    [],
  );

  const unlockTheme = useCallback(
    (themeId: string, ms: number) =>
      setSettings((prev) => {
        const next = { ...prev, themeId, themeUnlocks: { ...prev.themeUnlocks, [themeId]: Date.now() + ms } };
        AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(next)).catch((e) => console.warn(e));
        return next;
      }),
    [],
  );

  // 連続で呼ばれても二重に使わないよう、最新の枚数は ref で持つ
  const ticketsRef = useRef(defaultSettings.tickets);
  useEffect(() => {
    ticketsRef.current = settings.tickets;
  }, [settings.tickets]);
  const changeTickets = useCallback(
    (delta: number) => {
      const next = ticketsRef.current + delta;
      if (next < 0) return false;
      ticketsRef.current = next;
      updateSettings({ tickets: next });
      return true;
    },
    [updateSettings],
  );

  const value = useMemo(
    () => ({
      ready,
      roulettes,
      settings,
      migratedCount,
      upsert,
      markPlayed,
      unlockTheme,
      remove,
      changeTickets,
      updateSettings,
    }),
    [ready, roulettes, settings, migratedCount, upsert, markPlayed, unlockTheme, remove, changeTickets, updateSettings],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('StoreProvider がない');
  return v;
}

export function useRoulette(id: string | undefined): Roulette | undefined {
  const { roulettes } = useStore();
  return roulettes.find((r) => r.id === id);
}
