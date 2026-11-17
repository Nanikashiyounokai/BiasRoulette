import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { useWheelPalette } from '../useWheelPalette';
import { Wheel } from './Wheel';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type Request = {
  title: string;
  message?: string;
  buttons: DialogButton[];
  onDismiss?: () => void;
};

let show: ((r: Request) => void) | null = null;

/**
 * OS 標準のアラートの代わり。Alert.alert と同じ引数で呼べる。
 * 標準のダイアログは灰色で、アプリの雰囲気（クリーム地・オレンジ・ルーレット）から浮いていた（2026-10-19 指摘）。
 * 表示は _layout.tsx に置いた DialogHost が受け持つ。
 */
export const Dialog = {
  alert(title: string, message?: string, buttons?: DialogButton[], options?: { onDismiss?: () => void }) {
    const req = { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }], onDismiss: options?.onDismiss };
    if (show) show(req);
    else console.warn('DialogHost is not mounted', title);
  },
};

const DECO_ITEMS = [
  { id: 'a', name: '', weight: 3, bias: 1 },
  { id: 'b', name: '', weight: 2, bias: 1 },
  { id: 'c', name: '', weight: 2, bias: 1 },
  { id: 'd', name: '', weight: 1, bias: 1 },
];

export function DialogHost() {
  const [req, setReq] = useState<Request | null>(null);
  const palette = useWheelPalette();

  useEffect(() => {
    show = setReq;
    return () => {
      show = null;
    };
  }, []);

  if (!req) return null;

  // 先に閉じてから呼ぶ。呼んだ先で次のダイアログを出しても、そちらが残るように
  const press = (b?: DialogButton) => {
    setReq(null);
    if (b?.onPress) b.onPress();
    else if (!b || b.style === 'cancel') req.onDismiss?.();
  };
  const cancel = req.buttons.find((b) => b.style === 'cancel');
  // 2 つまでは横並び（キャンセルを左）、それより多いときは縦に並べる（キャンセルを一番下）
  const ordered = [...req.buttons.filter((b) => b.style !== 'cancel'), ...(cancel ? [cancel] : [])];
  const row = req.buttons.length <= 2;
  const buttons = row && cancel ? [...ordered].reverse() : ordered;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => press(cancel)}>
      <Pressable style={styles.backdrop} onPress={cancel ? () => press(cancel) : undefined}>
        <Pressable style={styles.card} accessibilityViewIsModal>
          <View style={styles.badge}>
            <Wheel items={DECO_ITEMS} palette={palette} size={44} showPointer={false} />
          </View>
          <Text style={styles.title}>{req.title}</Text>
          {!!req.message && <Text style={styles.message}>{req.message}</Text>}
          <View style={[styles.actions, row ? styles.actionsRow : styles.actionsColumn]}>
            {buttons.map((b, i) => {
              const primary = b.style !== 'cancel' && (row ? true : i === 0) && b.style !== 'destructive';
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  onPress={() => press(b)}
                  accessibilityRole="button"
                  testID={`dialog-${b.style ?? 'default'}-${i}`}
                  style={({ pressed }) => [
                    styles.button,
                    row && { flex: 1 },
                    primary ? styles.primary : b.style === 'destructive' ? styles.destructive : styles.plain,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.buttonText,
                      primary ? { color: '#FFFFFF' } : b.style === 'destructive' ? { color: colors.danger } : null,
                      b.style === 'cancel' && { color: colors.subText, fontWeight: 'normal' },
                    ]}
                  >
                    {b.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,18,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    paddingTop: 34,
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -26,
    padding: 4,
    borderRadius: 30,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: colors.primaryText, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, color: colors.text, textAlign: 'center', marginTop: 8 },
  actions: { alignSelf: 'stretch', marginTop: 18, gap: 8 },
  actionsRow: { flexDirection: 'row' },
  actionsColumn: { flexDirection: 'column' },
  button: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  plain: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  destructive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  buttonText: { fontSize: 15, fontWeight: 'bold', color: colors.primaryText, textAlign: 'center' },
});
