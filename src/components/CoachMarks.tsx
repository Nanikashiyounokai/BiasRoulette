import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions, type View as RNView } from 'react-native';

import { t } from '../i18n';
import { useStore } from '../store';
import { colors } from '../theme';

export type CoachStep = {
  /** 光らせる部品。無ければ画面中央に説明だけ出す */
  target?: RefObject<RNView | null>;
  title: string;
  body: string;
  /** 文章だけでは分かりにくいところに添える図（CoachIllustrations.tsx） */
  illustration?: ReactNode;
};

type Rect = { x: number; y: number; width: number; height: number };

const PAD = 6;

/**
 * 初めて開いた画面で、部品を 1 つずつ光らせて使い方を見せる（コーチマーク）。
 * 自動で出すのは画面ごとに 1 回だけ。見終えたかどうかは settings.coachSeen に残す。
 * ヘッダーの「？」（CoachHelpButton）で coachSeen を戻すと、最初からもう一度出る。
 *
 * 部品の位置は measureInWindow で測る。画面の描画が落ち着いてから測るため、少し待ってから出す。
 */
export function CoachMarks({ id, steps, enabled = true }: { id: string; steps: CoachStep[]; enabled?: boolean }) {
  const { ready, settings, updateSettings } = useStore();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const seen = !!settings.coachSeen?.[id];
  // 測った位置は「どのステップの位置か」と組で持つ。ステップが変わった直後は前の位置を使わない
  const [measured, setMeasured] = useState<{ index: number; rect: Rect | null } | null>(null);

  useEffect(() => {
    if (!ready || seen || !enabled) return;
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, [ready, seen, enabled]);

  const step = steps[index];

  // steps は描画のたびに作り直される配列なので、依存には ref（useRef で同じ物）だけを入れる
  const target = step?.target;
  useEffect(() => {
    if (!visible || !target) return;
    const timer = setTimeout(() => {
      const node = target.current;
      // 部品が見つからなければ、中央に説明だけ出す（止まったままにしない）
      if (!node) return setMeasured({ index, rect: null });
      node.measureInWindow((x, y, w, h) => {
        setMeasured({
          index,
          rect: w > 0 && h > 0 ? { x: x - PAD, y: y - PAD, width: w + PAD * 2, height: h + PAD * 2 } : null,
        });
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [visible, index, target, width, height]);
  const rect = step?.target && measured?.index === index ? measured.rect : null;
  // 部品つきのステップで、まだ測れていないときは何も出さない（中央表示がちらつかないように）
  const waiting = !!step?.target && measured?.index !== index;

  const finish = () => {
    setVisible(false);
    // 「？」で見直すときは 1 枚目から
    setIndex(0);
    setMeasured(null);
    updateSettings({ coachSeen: { ...settings.coachSeen, [id]: true } });
  };

  const next = () => {
    if (index + 1 >= steps.length) finish();
    else setIndex(index + 1);
  };

  if (!visible || !step || waiting) return null;

  // 説明カードは、光らせた部品が画面の上半分なら下に、下半分なら上に置く
  const below = !rect || rect.y + rect.height / 2 < height / 2;
  const cardTop = rect ? (below ? rect.y + rect.height + 12 : undefined) : height * 0.35;
  const cardBottom = rect && !below ? height - rect.y + 12 : undefined;
  const last = index + 1 >= steps.length;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={finish}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {rect ? (
          <>
            <View style={[styles.dim, { left: 0, top: 0, width, height: Math.max(0, rect.y) }]} />
            <View style={[styles.dim, { left: 0, top: rect.y + rect.height, width, bottom: 0 }]} />
            <View style={[styles.dim, { left: 0, top: rect.y, width: Math.max(0, rect.x), height: rect.height }]} />
            <View
              style={[styles.dim, { left: rect.x + rect.width, top: rect.y, right: 0, height: rect.height }]}
            />
            <View
              pointerEvents="none"
              style={[styles.ring, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]}
            />
          </>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}

        <View style={[styles.card, { top: cardTop, bottom: cardBottom }]} accessibilityViewIsModal>
          <Text style={styles.counter}>
            {index + 1} / {steps.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          {step.illustration && <View style={styles.illustration}>{step.illustration}</View>}
          <Text style={styles.body}>{step.body}</Text>
          <View style={styles.actions}>
            {!last && (
              <Pressable onPress={finish} hitSlop={8} accessibilityRole="button">
                <Text style={styles.skip}>{t('coachSkip')}</Text>
              </Pressable>
            )}
            <Pressable onPress={next} style={styles.next} accessibilityRole="button" testID="coach-next">
              <Text style={styles.nextText}>{last ? t('coachDone') : t('coachNext')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** ヘッダーに置く「？」。押すとその画面の説明をもう一度最初から出す */
export function CoachHelpButton({ id }: { id: string }) {
  const { settings, updateSettings } = useStore();
  return (
    <Pressable
      hitSlop={10}
      onPress={() => updateSettings({ coachSeen: { ...settings.coachSeen, [id]: false } })}
      accessibilityRole="button"
      accessibilityLabel={t('coachHelp')}
      testID={`coach-help-${id}`}
    >
      <Ionicons name="help-circle-outline" size={25} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  illustration: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  dim: { position: 'absolute', backgroundColor: 'rgba(28,18,10,0.72)' },
  ring: { position: 'absolute', borderRadius: 6, borderWidth: 2, borderColor: colors.primarySoft },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  counter: { fontSize: 12, color: colors.subText },
  title: { fontSize: 17, fontWeight: 'bold', color: colors.primaryText },
  body: { fontSize: 14, lineHeight: 21, color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 8 },
  skip: { fontSize: 14, color: colors.subText },
  next: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  nextText: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' },
});
