import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { templates } from '../templates';
import { colors } from '../theme';
import { useWheelPalette } from '../useWheelPalette';
import { Wheel } from './Wheel';

/**
 * コーチマークに添える図。文章だけだと「どこを押して何が変わるのか」が伝わらなかった（2026-10-19 指摘）。
 * 例の項目名はランチのテンプレートから取る（言語ごとに用意済みのため）。
 */
const lunch = templates[0];
const names = lunch.items.map((it) => it.name);

/** ％ と 比率 は同じことを表している */
export function ModeIllustration() {
  return (
    <View style={styles.row}>
      <View style={styles.box}>
        <Text style={styles.boxLabel}>{t('displayPercent')}</Text>
        <Text style={styles.boxValue}>50 · 25 · 25</Text>
      </View>
      <Text style={styles.equal}>＝</Text>
      <View style={styles.box}>
        <Text style={styles.boxLabel}>{t('displayRatio')}</Text>
        <Text style={styles.boxValue}>2 : 1 : 1</Text>
      </View>
    </View>
  );
}

/** 盤面は均等なのに、「本当」の欄では 1 つだけ当たりやすい */
export function OddsIllustration() {
  const palette = useWheelPalette();
  const real = [50, 17, 17, 16];
  return (
    <View style={[styles.row, { gap: 14 }]}>
      <Wheel
        items={names.map((name, i) => ({ id: String(i), name, weight: 1, bias: 1 }))}
        palette={palette}
        size={72}
        showPointer={false}
      />
      <View style={{ gap: 3 }}>
        <View style={styles.tableRow}>
          <Text style={[styles.cellName, styles.head]} />
          <Text style={[styles.cell, styles.head]}>{t('weight')}</Text>
          <View style={[styles.cell, styles.secretHead]}>
            <Ionicons name="lock-open" size={10} color="#FFFFFF" />
            <Text style={styles.secretHeadText}>{t('bias')}</Text>
          </View>
        </View>
        {names.slice(0, 3).map((name, i) => (
          <View key={name} style={styles.tableRow}>
            <View style={[styles.cellName, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <View style={[styles.swatch, { backgroundColor: palette[i % palette.length] }]} />
              <Text style={styles.nameText} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Text style={styles.cell}>25%</Text>
            <Text style={[styles.cell, styles.secretCell, i === 0 && { fontWeight: 'bold' }]}>{real[i]}%</Text>
          </View>
        ))}
        <Text style={[styles.nameText, { color: colors.subText }]}>…</Text>
      </View>
    </View>
  );
}

/** プレイ画面のタイトルを長押しすると、横の点の色が変わる */
export function ToggleIllustration() {
  return (
    <View style={{ alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={16} color={colors.primaryText} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>{lunch.name}</Text>
            <View style={styles.dotRing}>
              <View style={[styles.dot, { backgroundColor: colors.secret }]} />
            </View>
          </View>
          <View style={styles.press}>
            <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
            <Text style={styles.pressText}>{t('illusLongPress')}</Text>
          </View>
        </View>
        <Ionicons name="create-outline" size={16} color={colors.primaryText} />
      </View>
      <View style={{ gap: 4, alignSelf: 'stretch', paddingHorizontal: 6 }}>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: colors.secret }]} />
          <Text style={styles.legendText}>{t('illusDotOn')}</Text>
        </View>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: '#D9D9D9' }]} />
          <Text style={styles.legendText}>{t('illusDotOff')}</Text>
        </View>
      </View>
    </View>
  );
}

/** 動画 1 本でチケット 1 枚 */
export function TicketIllustration() {
  return (
    <View style={styles.row}>
      <View style={styles.box}>
        <Ionicons name="play-circle-outline" size={26} color={colors.primary} />
        <Text style={styles.boxLabel}>{t('illusVideo')}</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.subText} />
      <View style={styles.box}>
        <Ionicons name="ticket-outline" size={26} color={colors.primary} />
        <Text style={styles.boxLabel}>{t('illusTicket')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  box: {
    minWidth: 92,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxLabel: { fontSize: 12, color: colors.subText, fontWeight: 'bold' },
  boxValue: { fontSize: 16, color: colors.text, fontWeight: 'bold' },
  equal: { fontSize: 18, color: colors.subText, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellName: { width: 72 },
  cell: { width: 44, fontSize: 12, textAlign: 'center', color: colors.text },
  head: { fontSize: 11, fontWeight: 'bold', color: colors.subText },
  secretHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.secret,
    borderRadius: 6,
    paddingVertical: 1,
  },
  secretHeadText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  secretCell: { color: colors.secret, backgroundColor: colors.secretSoft, borderRadius: 4, overflow: 'hidden' },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  nameText: { fontSize: 12, color: colors.text, flexShrink: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: colors.primaryText },
  dotRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  press: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pressText: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { fontSize: 12, color: colors.text, flexShrink: 1 },
});
