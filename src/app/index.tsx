import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner } from '../ads/Banner';
import { Wheel } from '../components/Wheel';
import { Button, Card, SectionTitle } from '../components/ui';
import { newId, type Roulette } from '../domain/roulette';
import { t } from '../i18n';
import { usePremium } from '../premium/PremiumProvider';
import { useTicketGate } from '../premium/useTicketGate';
import { useStore } from '../store';
import { templates } from '../templates';
import { colors } from '../theme';
import { useWheelPalette } from '../useWheelPalette';

export default function Home() {
  const { ready, roulettes, migratedCount, remove, upsert } = useStore();
  const palette = useWheelPalette();
  const premium = usePremium();
  const gate = useTicketGate();
  const [toastDismissed, setToastDismissed] = useState(false);
  const toast = migratedCount > 0 && !toastDismissed ? t('migrated', { n: migratedCount }) : null;

  useEffect(() => {
    if (migratedCount === 0) return;
    const id = setTimeout(() => setToastDismissed(true), 5000);
    return () => clearTimeout(id);
  }, [migratedCount]);

  const sorted = [...roulettes].sort(
    (a, b) => (b.lastPlayedAt ?? b.updatedAt) - (a.lastPlayedAt ?? a.updatedAt),
  );

  const openMenu = (r: Roulette) =>
    Alert.alert(r.name, undefined, [
      { text: t('edit'), onPress: () => router.push({ pathname: '/edit', params: { id: r.id } }) },
      {
        text: t('duplicate'),
        onPress: () => {
          let name = `${r.name} (2)`;
          for (let n = 3; roulettes.some((x) => x.name === name); n++) name = `${r.name} (${n})`;
          upsert({
            ...r,
            id: newId(),
            name,
            items: r.items.map((it) => ({ ...it, id: newId() })),
            lastPlayedAt: undefined,
          });
        },
      },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmBody', { name: r.name }), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: () => remove(r.id) },
          ]),
      },
      { text: t('cancel'), style: 'cancel' },
    ]);

  const header = (
    <View>
      <View style={styles.hero}>
        <Wheel
          items={[
            { id: 'a', name: '', weight: 3, bias: 1 },
            { id: 'b', name: '', weight: 1, bias: 1 },
            { id: 'c', name: '', weight: 2, bias: 1 },
            { id: 'd', name: '', weight: 2, bias: 1 },
          ]}
          palette={palette}
          size={72}
          showPointer={false}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{t('appName')}</Text>
          <Text style={styles.heroSub}>{t('tagline')}</Text>
        </View>
      </View>
      <Button
        testID="new-roulette"
        title={t('newRoulette')}
        icon={<Ionicons name="add" size={22} color="#FFFFFF" />}
        onPress={() => router.push('/edit')}
      />
      <SectionTitle>{t('templates')}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {templates.map((tpl, i) => (
          <Pressable
            key={tpl.name}
            style={({ pressed }) => [styles.template, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: '/edit', params: { template: String(i) } })}
          >
            <Text style={{ fontSize: 22 }}>{tpl.emoji}</Text>
            <Text style={styles.templateText} numberOfLines={1}>
              {tpl.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <SectionTitle>{t('myRoulettes')}</SectionTitle>
      {ready && sorted.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={styles.emptyTitle}>{t('emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('emptyBody')}</Text>
        </Card>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {!premium.unlimited && (
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push('/premium')}
                  accessibilityLabel={t('tickets')}
                  style={styles.ticketChip}
                  testID="ticket-chip"
                >
                  <Ionicons name="ticket-outline" size={16} color={colors.primaryText} />
                  <Text style={styles.ticketText}>{premium.tickets}</Text>
                </Pressable>
              )}
              <Pressable hitSlop={12} onPress={() => router.push('/settings')} accessibilityLabel={t('settings')}>
                <Ionicons name="settings-outline" size={24} color={colors.primaryText} />
              </Pressable>
            </View>
          ),
        }}
      />
      <FlatList
        data={sorted}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
        renderItem={({ item: r }) => (
          <Pressable
            testID={`roulette-${r.name}`}
            onPress={() => gate.openWithGate(r, () => router.push({ pathname: '/play/[id]', params: { id: r.id } }))}
            onLongPress={() => openMenu(r)}
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Card style={styles.row}>
              <Wheel items={r.items} palette={palette} size={56} showPointer={false} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {premium.requiresTicket(r) ? '👑 ' : ''}
                  {r.name}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {r.items.length} {t('items')}・{r.items.map((i) => i.name).join(' / ')}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => openMenu(r)} accessibilityLabel={t('edit')}>
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.subText} />
              </Pressable>
            </Card>
          </Pressable>
        )}
      />
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={{ color: '#FFFFFF' }}>{toast}</Text>
        </View>
      )}
      <Banner />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primaryText },
  heroSub: { fontSize: 13, color: colors.subText, marginTop: 2 },
  template: {
    width: 104,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  templateText: { fontSize: 13, color: colors.text },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  emptyBody: { fontSize: 13, color: colors.subText, marginTop: 6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  rowSub: { fontSize: 12, color: colors.subText, marginTop: 3 },
  ticketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  ticketText: { fontSize: 14, fontWeight: 'bold', color: colors.primaryText },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 90,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(40,30,20,0.92)',
  },
});
