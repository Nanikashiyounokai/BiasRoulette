import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeInDown, cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { scheduleOnRN } from 'react-native-worklets';

import { useAds } from '../../ads/AdsProvider';
import { Banner } from '../../ads/Banner';
import { Wheel, itemColor } from '../../components/Wheel';
import { Button } from '../../components/ui';
import { draw, effectiveOdds, stopRotation, type Item } from '../../domain/roulette';
import { useBranding } from '../../branding';
import { t } from '../../i18n';
import { usePremium } from '../../premium/PremiumProvider';
import { useTicketGate } from '../../premium/useTicketGate';
import { useRoulette, useStore } from '../../store';
import { colors, readableTextColor } from '../../theme';
import { useWheelPalette } from '../../useWheelPalette';

/** ドラムロール（drum.wav）は 5.2 秒あるので、回転中に途切れない長さにしておく */
const SPIN_MS = 4200;
const QUICK_STOP_MS = 1400;
const REVIEW_AFTER_SPINS = 8;
const REVIEW_INTERVAL_MS = 120 * 24 * 60 * 60 * 1000;

type Phase = 'idle' | 'spinning' | 'result';

export default function Play() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roulette = useRoulette(id);
  const { upsert, markPlayed, settings, updateSettings } = useStore();
  const branding = useBranding();
  const ads = useAds();
  const premium = usePremium();
  const gate = useTicketGate();
  const palette = useWheelPalette();
  const { width, height } = useWindowDimensions();

  const rotation = useSharedValue(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<Item | null>(null);
  const [history, setHistory] = useState<Item[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const pending = useRef<{ index: number; target: number } | null>(null);
  const shotRef = useRef<View>(null);
  // この画面にいるあいだはチケット 1 枚で回し放題
  const ticketUsed = useRef(false);

  const drum = useAudioPlayer(require('../../../assets/sounds/drum.wav'));
  const cymbal = useAudioPlayer(require('../../../assets/sounds/cymbal.mp3'));

  useEffect(() => {
    // マナーモードでも鳴らさない（iOS）。会議室などで急に鳴るのを避ける
    setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
  }, []);

  // プレイ画面を離れるときだけインタースティシャルの候補にする（抽選中・結果直後には出さない）。
  // ads は読み込み状況で作り直されるので、依存に入れると画面の途中でクリーンアップが走る
  const adsRef = useRef(ads);
  useEffect(() => {
    adsRef.current = ads;
  }, [ads]);
  useEffect(() => () => void adsRef.current.maybeShowInterstitial(), []);

  if (!roulette) return null;

  const size = Math.min(width - 48, height * 0.42, 420);
  const remaining = roulette.items.filter((it) => !excluded.has(it.id));
  const roundDone = roulette.removeWinners && remaining.length === 0;

  const finish = () => {
    const p = pending.current;
    if (!p) return;
    const item = roulette.items[p.index];
    pending.current = null;
    setWinner(item);
    setPhase('result');
    setHistory((h) => [item, ...h].slice(0, 20));
    if (roulette.removeWinners) setExcluded((s) => new Set(s).add(item.id));
    if (settings.sound) {
      drum.pause();
      cymbal.seekTo(0);
      cymbal.play();
    }
    if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const spinCount = settings.spinCount + 1;
    updateSettings({ spinCount });
    ads.recordSpin();
    maybeAskReview(spinCount);
  };

  const maybeAskReview = async (spinCount: number) => {
    if (spinCount < REVIEW_AFTER_SPINS) return;
    if (settings.reviewRequestedAt && Date.now() - settings.reviewRequestedAt < REVIEW_INTERVAL_MS) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    updateSettings({ reviewRequestedAt: Date.now() });
    // 結果のカードを見てから出す
    setTimeout(() => StoreReview.requestReview().catch(() => {}), 1500);
  };

  const animateTo = (target: number, duration: number) => {
    rotation.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) scheduleOnRN(finish);
    });
  };

  const spin = () => {
    // チケットはホーム画面で確認済み。ここで足りないのは、入ったあとに裏設定を ON にした場合などだけ
    if (premium.requiresTicket(roulette) && !ticketUsed.current) {
      if (!premium.spendTicket()) {
        gate.prompt();
        return;
      }
      ticketUsed.current = true;
    }
    let pool = roulette.items;
    let currentExcluded = excluded;
    if (roulette.removeWinners) {
      if (roundDone) {
        currentExcluded = new Set();
        setExcluded(currentExcluded);
      }
      pool = roulette.items.filter((it) => !currentExcluded.has(it.id));
    }
    const odds = effectiveOdds(roulette, roulette.items).map((v, i) =>
      pool.includes(roulette.items[i]) ? v : 0,
    );
    let index = draw(odds);
    // 残りの裏比率が全部 0 のときは、表比率で選ぶ（止まれないよりはまし）
    if (index < 0) index = draw(roulette.items.map((it) => (pool.includes(it) ? it.weight : 0)));
    if (index < 0) return;

    const target = stopRotation(roulette.items, index, rotation.value, 8);
    pending.current = { index, target };
    setWinner(null);
    setPhase('spinning');
    markPlayed(roulette.id);
    if (settings.sound) {
      drum.seekTo(0);
      drum.play();
    }
    if (settings.haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTo(target, SPIN_MS);
  };

  /** 「止める」: 当選は回し始めた時点で決まっている。減速を早めるだけ */
  const stopNow = () => {
    const p = pending.current;
    if (!p) return;
    cancelAnimation(rotation);
    const minTarget = rotation.value + 360;
    const target = p.target >= minTarget ? p.target - Math.floor((p.target - minTarget) / 360) * 360 : p.target;
    animateTo(target, QUICK_STOP_MS);
  };

  const toggleSecret = () => {
    const next = { ...roulette, biasEnabled: !roulette.biasEnabled };
    // チケットが無いのに極端な確率へ切り替えようとしたときは、何も表示せずに切り替えない（点の色が変わらないことで分かる）。
    // 見ている人の前で案内を出すと、裏設定があることがばれる
    if (premium.requiresTicket(next) && !ticketUsed.current && premium.tickets === 0) {
      if (settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    upsert(next);
    if (settings.haptics) Haptics.selectionAsync();
  };

  const share = async () => {
    if (!winner || !shotRef.current) return;
    try {
      const uri = await captureRef(shotRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: branding.shareText(roulette.name, winner.name),
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const winnerIndex = winner ? roulette.items.findIndex((it) => it.id === winner.id) : -1;
  const winnerColor = winnerIndex >= 0 ? itemColor(roulette.items, winnerIndex, palette) : colors.primary;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            // 長押しで裏設定を ON / OFF（Play レビュー ★4 の要望）。
            // 見ている人に気づかれないよう、表示はタイトル横の小さな点だけ
            <Pressable onLongPress={toggleSecret} delayLongPress={600} testID="secret-toggle">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {roulette.name}
                </Text>
                <View
                  style={[styles.secretDot, { backgroundColor: roulette.biasEnabled ? colors.secret : '#D9D9D9' }]}
                />
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push({ pathname: '/edit', params: { id: roulette.id } })}
              accessibilityLabel={t('edit')}
            >
              <Ionicons name="create-outline" size={24} color={colors.primaryText} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, paddingBottom: 24 }}>
        <View ref={shotRef} collapsable={false} style={styles.shot}>
          <Wheel items={roulette.items} palette={palette} size={size} rotation={rotation} excludedIds={excluded} />
          <View style={styles.resultArea}>
            {phase === 'spinning' && <Text style={styles.spinning}>{t('spinning')}</Text>}
            {phase === 'result' && winner && (
              <Animated.View
                entering={FadeInDown.springify()}
                style={[styles.resultCard, { backgroundColor: winnerColor }]}
              >
                <Text style={[styles.resultLabel, { color: readableTextColor(winnerColor) }]}>{t('result')}</Text>
                <Text style={[styles.resultText, { color: readableTextColor(winnerColor) }]} numberOfLines={2}>
                  {winner.name}
                </Text>
              </Animated.View>
            )}
          </View>
          <Text style={styles.watermark}>{branding.appName}</Text>
        </View>

        <View style={styles.controls}>
          {phase === 'spinning' ? (
            <Button title={t('stop')} variant="secondary" onPress={stopNow} style={{ flex: 1 }} testID="stop" />
          ) : (
            <Button
              title={phase === 'result' ? t('again') : t('spin')}
              onPress={spin}
              style={{ flex: 1 }}
              testID="spin"
            />
          )}
          {phase === 'result' && (
            <Pressable onPress={share} style={styles.iconButton} accessibilityLabel={t('share')} testID="share">
              <Ionicons name="share-social" size={22} color={colors.primaryText} />
            </Pressable>
          )}
        </View>

        {roulette.removeWinners && (
          <View style={styles.roundRow}>
            <Text style={styles.sub}>{roundDone ? t('roundDone') : t('remaining', { n: remaining.length })}</Text>
            {excluded.size > 0 && phase !== 'spinning' && (
              <Pressable onPress={() => setExcluded(new Set())} hitSlop={8}>
                <Text style={[styles.sub, { color: colors.primary, fontWeight: 'bold' }]}>{t('resetRound')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {history.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.sub}>{t('history')}</Text>
            <View style={styles.chips}>
              {history.map((h, i) => {
                const c = itemColor(roulette.items, roulette.items.findIndex((x) => x.id === h.id), palette);
                return (
                  <View key={`${h.id}-${i}`} style={[styles.chip, { backgroundColor: c }]}>
                    <Text style={{ color: readableTextColor(c), fontSize: 12 }} numberOfLines={1}>
                      {h.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
      <Banner />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: 'bold', color: colors.primaryText, maxWidth: 220 },
  secretDot: { width: 6, height: 6, borderRadius: 3 },
  shot: { alignItems: 'center', backgroundColor: colors.bg, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16 },
  resultArea: { height: 96, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  spinning: { fontSize: 18, color: colors.subText },
  resultCard: {
    minWidth: 200,
    maxWidth: 320,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  resultLabel: { fontSize: 12, fontWeight: 'bold', opacity: 0.85 },
  resultText: { fontSize: 30, fontWeight: 'bold', textAlign: 'center' },
  watermark: { fontSize: 10, color: '#C9B8A8', marginTop: 4 },
  controls: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 420, marginTop: 8 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundRow: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'center' },
  sub: { fontSize: 13, color: colors.subText },
  history: { width: '100%', maxWidth: 420, marginTop: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, maxWidth: 140 },
});
