import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Wheel, itemColor } from '../components/Wheel';
import { Button, Card, SectionTitle } from '../components/ui';
import {
  MAX_ITEMS,
  newId,
  newRoulette,
  parseRatio,
  percentages,
  validate,
  type Item,
  type Roulette,
  type ValidationError,
} from '../domain/roulette';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n';
import { useStore } from '../store';
import { templates } from '../templates';
import { colors, slicePalette } from '../theme';
import { useWheelPalette } from '../useWheelPalette';

/**
 * 入力中は文字列で持つ。数字以外が入っても落ちないよう、保存時にだけ数値にする。
 * biasTouched が false の間は、裏比率を表比率に追従させる（裏設定を開かない人の当たりやすさが見た目どおりになる）。
 */
type DraftItem = { id: string; name: string; weight: string; bias: string; biasTouched: boolean; color?: string };

function toDraft(items: Item[]): DraftItem[] {
  return items.map((it) => ({
    id: it.id,
    name: it.name,
    weight: String(it.weight),
    bias: String(it.bias),
    biasTouched: it.bias !== it.weight,
    color: it.color,
  }));
}

function errorMessage(e: ValidationError): string {
  switch (e.kind) {
    case 'emptyName':
      return t('errEmptyName');
    case 'duplicateName':
      return t('errDuplicateName');
    case 'tooFewItems':
      return t('errTooFewItems');
    case 'emptyItemName':
      return t('errEmptyItemName', { n: e.index + 1 });
    case 'invalidWeight':
      return t('errInvalidWeight', { n: e.index + 1 });
    case 'invalidBias':
      return t('errInvalidBias', { n: e.index + 1 });
    case 'allBiasZero':
      return t('errAllBiasZero');
  }
}

export default function Edit() {
  const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
  const { roulettes, upsert } = useStore();
  const palette = useWheelPalette();
  const insets = useSafeAreaInsets();

  const initial = useMemo<Roulette>(() => {
    const existing = roulettes.find((r) => r.id === id);
    if (existing) return existing;
    const tpl = template !== undefined ? templates[Number(template)] : undefined;
    if (tpl) {
      const r = newRoulette(tpl.name, tpl.items);
      r.removeWinners = !!tpl.removeWinners;
      return r;
    }
    return newRoulette('', [
      { name: '', weight: 1, bias: 1 },
      { name: '', weight: 1, bias: 1 },
    ]);
    // 開いた時点の内容で固定する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNew = !roulettes.some((r) => r.id === initial.id);
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<DraftItem[]>(toDraft(initial.items));
  const [biasEnabled, setBiasEnabled] = useState(initial.biasEnabled);
  const [removeWinners, setRemoveWinners] = useState(initial.removeWinners);
  const [showSecret, setShowSecret] = useState(false);
  const [colorOpenFor, setColorOpenFor] = useState<string | null>(null);

  const parsed: Item[] = items.map((d) => ({
    id: d.id,
    name: d.name,
    weight: parseRatio(d.weight) ?? 0,
    bias: parseRatio(d.bias) ?? -1,
    color: d.color,
  }));
  const previewItems = parsed.map((it) => ({ ...it, name: it.name || '?', weight: Math.max(it.weight, 0) }));
  const lookPct = percentages(parsed.map((it) => it.weight));
  const realPct = percentages(parsed.map((it) => (biasEnabled ? Math.max(it.bias, 0) : it.weight)));

  const patch = (itemId: string, p: Partial<DraftItem>) =>
    setItems((prev) =>
      prev.map((d) => {
        if (d.id !== itemId) return d;
        const next = { ...d, ...p };
        if (p.weight !== undefined && !next.biasTouched) next.bias = p.weight;
        return next;
      }),
    );

  const addItem = () => {
    if (items.length >= MAX_ITEMS) {
      Alert.alert(t('errMaxItems', { n: MAX_ITEMS }));
      return;
    }
    setItems((prev) => [...prev, { id: newId(), name: '', weight: '1', bias: '1', biasTouched: false }]);
  };

  const save = () => {
    const r: Roulette = {
      ...initial,
      name: name.trim(),
      items: parsed.map((it) => ({ ...it, name: it.name.trim() })),
      biasEnabled,
      removeWinners,
    };
    const others = roulettes.filter((x) => x.id !== r.id).map((x) => x.name);
    const err = validate(r, others);
    if (err) {
      Alert.alert(errorMessage(err));
      return;
    }
    upsert(r);
    if (isNew) router.replace({ pathname: '/play/[id]', params: { id: r.id } });
    else router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: isNew ? t('editorNewTitle') : t('editorEditTitle'),
          headerRight: () => (
            <Pressable hitSlop={12} onPress={save} testID="save">
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 17 }}>{t('save')}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Wheel items={previewItems} palette={palette} size={180} showPointer={false} />
        </View>

        <SectionTitle>{t('rouletteName')}</SectionTitle>
        <TextInput
          testID="roulette-name"
          value={name}
          onChangeText={setName}
          placeholder={t('rouletteNamePlaceholder')}
          placeholderTextColor="#AAAAAA"
          style={styles.nameInput}
          maxLength={40}
        />

        <View style={styles.itemsHeader}>
          <Text style={[styles.colLabel, { flex: 1, marginLeft: 40 }]}>{t('itemName')}</Text>
          <Text style={[styles.colLabel, styles.numCol]}>{t('weight')}</Text>
          {showSecret && <Text style={[styles.colLabel, styles.numCol, { color: colors.secret }]}>{t('bias')}</Text>}
          <Pressable
            testID="toggle-secret"
            onPress={() => setShowSecret((v) => !v)}
            hitSlop={8}
            accessibilityLabel={showSecret ? t('secretHide') : t('secretShow')}
            style={[styles.lock, showSecret && { backgroundColor: colors.secret }]}
          >
            <Ionicons name={showSecret ? 'lock-open' : 'lock-closed'} size={18} color={showSecret ? '#FFF' : colors.secret} />
          </Pressable>
        </View>
        {showSecret && <Text style={styles.hint}>{t('secretHint')}</Text>}

        {items.map((d, i) => (
          <View key={d.id}>
            <View style={styles.itemRow}>
              <Pressable
                onPress={() => setColorOpenFor((v) => (v === d.id ? null : d.id))}
                style={[styles.swatch, { backgroundColor: itemColor(parsed, i, palette) }]}
                accessibilityLabel="color"
              />
              <TextInput
                testID={`item-name-${i}`}
                value={d.name}
                onChangeText={(v) => patch(d.id, { name: v })}
                placeholder={`${t('itemName')} ${i + 1}`}
                placeholderTextColor="#AAAAAA"
                style={[styles.input, { flex: 1 }]}
                maxLength={30}
              />
              <TextInput
                testID={`item-weight-${i}`}
                value={d.weight}
                onChangeText={(v) => patch(d.id, { weight: v })}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
                style={[styles.input, styles.numCol, styles.num]}
              />
              {showSecret && (
                <TextInput
                  testID={`item-bias-${i}`}
                  value={d.bias}
                  onChangeText={(v) => patch(d.id, { bias: v, biasTouched: true })}
                  keyboardType="number-pad"
                  maxLength={3}
                  selectTextOnFocus
                  style={[styles.input, styles.numCol, styles.num, styles.secretInput]}
                />
              )}
              <Pressable
                hitSlop={8}
                onPress={() => setItems((prev) => prev.filter((x) => x.id !== d.id))}
                style={styles.remove}
                accessibilityLabel={t('delete')}
              >
                <Ionicons name="close" size={18} color={colors.subText} />
              </Pressable>
            </View>
            {showSecret && (
              <Text style={styles.pct}>
                {t('look')} {lookPct[i].toFixed(0)}% → {t('actual')} {realPct[i].toFixed(0)}%
              </Text>
            )}
            {colorOpenFor === d.id && (
              <View style={styles.colorRow}>
                <Pressable onPress={() => patch(d.id, { color: undefined })} style={[styles.colorChip, styles.autoChip]}>
                  <Text style={{ fontSize: 10, color: colors.subText }}>AUTO</Text>
                </Pressable>
                {slicePalette.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      patch(d.id, { color: c });
                      setColorOpenFor(null);
                    }}
                    style={[styles.colorChip, { backgroundColor: c }, d.color === c && styles.colorChipActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ))}

        <Button
          title={t('addItem')}
          variant="ghost"
          icon={<Ionicons name="add" size={20} color={colors.primaryText} />}
          onPress={addItem}
          style={{ marginTop: 8 }}
          testID="add-item"
        />

        {showSecret && (
          <Card style={{ marginTop: 20, gap: 14 }}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>{t('biasEnabled')}</Text>
                <Text style={styles.hint}>{t('biasEnabledHint')}</Text>
              </View>
              <Switch value={biasEnabled} onValueChange={setBiasEnabled} />
            </View>
          </Card>
        )}
        <Card style={{ marginTop: 12 }}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>{t('removeWinners')}</Text>
              <Text style={styles.hint}>{t('removeWinnersHint')}</Text>
            </View>
            <Switch value={removeWinners} onValueChange={setRemoveWinners} />
          </View>
        </Card>

        <Button title={t('save')} onPress={save} style={{ marginTop: 24 }} testID="save-bottom" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: colors.text,
  },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 6 },
  colLabel: { fontSize: 12, fontWeight: 'bold', color: colors.subText },
  numCol: { width: 54, textAlign: 'center' },
  lock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secretSoft,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#FFFFFF', marginHorizontal: 3 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  num: { paddingHorizontal: 4 },
  secretInput: { backgroundColor: colors.secretSoft, borderColor: colors.secret, color: colors.secret },
  remove: { width: 32, alignItems: 'center' },
  pct: { fontSize: 11, color: colors.secret, marginLeft: 40, marginTop: 2 },
  hint: { fontSize: 12, color: colors.subText, marginTop: 2 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 40, marginTop: 8 },
  colorChip: { width: 28, height: 28, borderRadius: 14 },
  colorChipActive: { borderWidth: 3, borderColor: colors.primaryText },
  autoChip: { borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
});
