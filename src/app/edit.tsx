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
  FREE_MAX_EVEN_ITEMS,
  premiumItemIndexes,
  PREMIUM_LOW_PCT,
  toPercentInts,
  validate,
  type Item,
  type Roulette,
  type ValidationError,
} from '../domain/roulette';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n';
import { usePremium } from '../premium/PremiumProvider';
import { useTicketGate } from '../premium/useTicketGate';
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

/** 1 列ぶんの文字列を合計 100 の％に直す。読めない値が混じっていたら null（その列は触らない） */
function percentColumn(values: string[]): string[] | null {
  const nums = values.map(parseRatio);
  if (nums.some((n) => n === null)) return null;
  return toPercentInts(nums as number[]).map(String);
}

function toPercentDraft(items: DraftItem[]): DraftItem[] {
  const w = percentColumn(items.map((d) => d.weight));
  const b = percentColumn(items.map((d) => d.bias));
  return items.map((d, i) => ({
    ...d,
    weight: w ? w[i] : d.weight,
    bias: !d.biasTouched && w ? w[i] : b ? b[i] : d.bias,
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
  const { roulettes, upsert, settings, updateSettings } = useStore();
  const premium = usePremium();
  const gate = useTicketGate();
  const palette = useWheelPalette();
  const mode = settings.ratioDisplay;
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
  // ％表示では開いた時点で比率を％に直す（1:1:1 → 34/33/33）
  const [items, setItems] = useState<DraftItem[]>(() =>
    mode === 'percent' ? toPercentDraft(toDraft(initial.items)) : toDraft(initial.items),
  );
  // 比率を触っていなければ、保存時に元の値へ戻す（％への丸めで 1:1:1 が 34:33:33 に変わらないように）
  const [oddsDirty, setOddsDirty] = useState(false);
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
  const premiumIdx = new Set(premiumItemIndexes({ biasEnabled, items: parsed }));
  const needsTicket = premiumIdx.size > 0 && !premium.unlimited;
  const sum = (vs: number[]) => vs.reduce((s, v) => s + Math.max(0, v), 0);
  const weightTotal = sum(parsed.map((it) => it.weight));
  const biasTotal = sum(parsed.map((it) => it.bias));
  const biasCustomized = items.some((d) => d.biasTouched);
  const totalsOk = weightTotal === 100 && (!biasEnabled || biasTotal === 100);

  const setMode = (next: 'percent' | 'ratio') => {
    if (next === mode) return;
    updateSettings({ ratioDisplay: next });
    // ％ → 比率はそのまま比率として読める。比率 → ％だけ変換する
    if (next === 'percent') setItems((prev) => toPercentDraft(prev));
  };

  const fixTotals = () => {
    setItems((prev) => toPercentDraft(prev));
    setOddsDirty(true);
  };

  const patch = (itemId: string, p: Partial<DraftItem>) =>
    setItems((prev) =>
      prev.map((d) => {
        if (d.id !== itemId) return d;
        const next = { ...d, ...p };
        if (p.weight !== undefined && !next.biasTouched) next.bias = p.weight;
        return next;
      }),
    );
  const patchOdds = (itemId: string, p: Partial<DraftItem>) => {
    patch(itemId, p);
    setOddsDirty(true);
  };

  const addItem = () => {
    if (items.length >= MAX_ITEMS) {
      Alert.alert(t('errMaxItems', { n: MAX_ITEMS }));
      return;
    }
    // ％表示で「1」を足すと 1% の項目になってしまうので、今の平均くらいの値で足す
    const v = mode === 'percent' ? String(Math.max(1, Math.round(100 / (items.length + 1)))) : '1';
    setItems((prev) => [...prev, { id: newId(), name: '', weight: v, bias: v, biasTouched: false }]);
    setOddsDirty(true);
  };

  /** 保存は常にできる。チケットが要るのは回すとき（新規ならこのままプレイ画面へ進むので、そこで確認する） */
  const commit = (r: Roulette) => {
    upsert(r);
    if (!isNew) {
      router.back();
      return;
    }
    gate.openWithGate(
      r,
      () => router.replace({ pathname: '/play/[id]', params: { id: r.id } }),
      () => router.back(),
    );
  };

  const save = () => {
    const keepOriginalOdds = !oddsDirty && parsed.length === initial.items.length;
    const r: Roulette = {
      ...initial,
      name: name.trim(),
      items: parsed.map((it, i) => ({
        ...it,
        name: it.name.trim(),
        ...(keepOriginalOdds ? { weight: initial.items[i].weight, bias: initial.items[i].bias } : null),
      })),
      biasEnabled,
      removeWinners,
    };
    const others = roulettes.filter((x) => x.id !== r.id).map((x) => x.name);
    const err = validate(r, others);
    if (err) {
      Alert.alert(errorMessage(err));
      return;
    }
    if (mode === 'percent' && !keepOriginalOdds && !totalsOk) {
      // 比率としてはそのまま保存しても同じ確率だが、次に開いたとき数字が変わって見えるので揃えてから保存する
      const w = toPercentInts(r.items.map((it) => it.weight));
      const b = toPercentInts(r.items.map((it) => it.bias));
      const fixed: Roulette = { ...r, items: r.items.map((it, i) => ({ ...it, weight: w[i], bias: b[i] })) };
      Alert.alert(t('totalNot100Title'), t('totalNot100Body'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('fixAndSave'), onPress: () => commit(fixed) },
      ]);
      return;
    }
    commit(r);
  };

  const numInput = (value: string, onChange: (v: string) => void, testID: string, secret = false) => (
    <View style={[styles.input, styles.numCol, styles.numBox, secret && styles.secretInput]}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={3}
        selectTextOnFocus
        style={[styles.numText, secret && { color: colors.secret }]}
      />
      {mode === 'percent' && <Text style={[styles.suffix, secret && { color: colors.secret }]}>%</Text>}
    </View>
  );

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

        <View style={styles.modeRow}>
          <Text style={styles.colLabel}>{t('inputBy')}</Text>
          <View style={styles.segment}>
            {(['percent', 'ratio'] as const).map((m) => (
              <Pressable
                key={m}
                testID={`mode-${m}`}
                onPress={() => setMode(m)}
                style={[styles.segmentItem, mode === m && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                  {m === 'percent' ? t('displayPercent') : t('displayRatio')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {mode === 'ratio' && <Text style={styles.hint}>{t('ratioHint')}</Text>}

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
              {numInput(d.weight, (v) => patchOdds(d.id, { weight: v }), `item-weight-${i}`)}
              {showSecret &&
                numInput(d.bias, (v) => patchOdds(d.id, { bias: v, biasTouched: true }), `item-bias-${i}`, true)}
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setItems((prev) => prev.filter((x) => x.id !== d.id));
                  setOddsDirty(true);
                }}
                style={styles.remove}
                accessibilityLabel={t('delete')}
              >
                <Ionicons name="close" size={18} color={colors.subText} />
              </Pressable>
            </View>
            {(mode === 'ratio' || premiumIdx.has(i)) && (
              <Text style={styles.pct}>
                {mode === 'ratio' &&
                  (showSecret
                    ? `${t('look')} ${lookPct[i].toFixed(0)}% → ${t('actual')} ${realPct[i].toFixed(0)}%`
                    : `${lookPct[i].toFixed(0)}%`)}
                {mode === 'ratio' && premiumIdx.has(i) && '　'}
                {premiumIdx.has(i) && (
                  <Text style={{ color: premium.unlimited ? colors.subText : colors.primary, fontWeight: 'bold' }}>
                    {t('premiumBadge')}
                  </Text>
                )}
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

        {mode === 'percent' && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalText, weightTotal !== 100 && { color: colors.danger }]}>
              {t('look')} {t('total', { n: weightTotal })}
            </Text>
            {showSecret && biasEnabled && biasCustomized && (
              <Text style={[styles.totalText, { color: biasTotal !== 100 ? colors.danger : colors.secret }]}>
                {t('actual')} {t('total', { n: biasTotal })}
              </Text>
            )}
            {!totalsOk && (
              <Pressable onPress={fixTotals} hitSlop={8} testID="fix-total">
                <Text style={styles.fixTotal}>{t('fixTotal')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {items.length >= FREE_MAX_EVEN_ITEMS && !premium.unlimited && (
          <Text style={[styles.hint, { marginTop: 8 }]}>
            {t('manyItemsHint', { n: FREE_MAX_EVEN_ITEMS + 1, low: PREMIUM_LOW_PCT })}
          </Text>
        )}

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
              <Switch
                value={biasEnabled}
                onValueChange={(v) => {
                  setBiasEnabled(v);
                  setOddsDirty(true);
                }}
              />
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

        {needsTicket && (
          // 人前で回す前に、ここでチケットを用意できるようにする
          <Card style={{ marginTop: 20, gap: 10, borderColor: colors.primary }}>
            <Text style={styles.switchTitle}>
              {premium.tickets > 0 ? t('ticketWillUse', { n: premium.tickets }) : t('ticketWillUseNone')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Button
                title={t('earnTicket')}
                variant="secondary"
                onPress={async () => {
                  if (await gate.earnTicket()) Alert.alert(t('ticketEarned', { n: premium.tickets + 1 }));
                }}
                style={{ flexGrow: 1 }}
              />
              <Button
                title={t('buyLifetime', { price: premium.price })}
                variant="ghost"
                onPress={() => router.push('/premium')}
                style={{ flexGrow: 1 }}
              />
            </View>
          </Card>
        )}

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
  itemsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 6 },
  colLabel: { fontSize: 12, fontWeight: 'bold', color: colors.subText },
  numCol: { width: 62, textAlign: 'center' },
  numBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 0 },
  numText: { flexShrink: 1, minWidth: 24, fontSize: 16, color: colors.text, textAlign: 'right', paddingVertical: 10 },
  suffix: { fontSize: 13, color: colors.subText, marginLeft: 1 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  segment: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 10, padding: 2 },
  segmentItem: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  segmentItemActive: { backgroundColor: colors.surface },
  segmentText: { fontSize: 14, color: colors.subText, fontWeight: 'bold' },
  segmentTextActive: { color: colors.primaryText },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 10, marginLeft: 40 },
  totalText: { fontSize: 13, fontWeight: 'bold', color: colors.subText },
  fixTotal: { fontSize: 13, fontWeight: 'bold', color: colors.primary, textDecorationLine: 'underline' },
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
