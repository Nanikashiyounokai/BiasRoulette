import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useAds } from '../ads/AdsProvider';
import { REWARD_UNLOCK_MS } from '../ads/config';
import { Wheel } from '../components/Wheel';
import { Card, SectionTitle } from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../i18n';
import { useStore } from '../store';
import { colors, wheelThemes } from '../theme';
import { useNow } from '../useNow';

const PREVIEW_ITEMS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: String(n), name: '', weight: 1, bias: 1 }));

const OTHER_APPS =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/jp/developer/masaki-hirayama/id1693736943'
    : 'https://play.google.com/store/apps/developer?id=SKart';

export default function Settings() {
  const { settings, updateSettings, unlockTheme } = useStore();
  const ads = useAds();
  const insets = useSafeAreaInsets();
  const now = useNow();

  const selectTheme = async (id: string, premium: boolean) => {
    const unlockedUntil = settings.themeUnlocks[id] ?? 0;
    if (!premium || unlockedUntil > now) {
      updateSettings({ themeId: id });
      return;
    }
    const earned = await ads.showRewarded();
    if (!earned) {
      if (!ads.rewardedAvailable) Alert.alert(t('rewardFailed'));
      return;
    }
    unlockTheme(id, REWARD_UNLOCK_MS);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 + insets.bottom }}>
      <SectionTitle>{t('theme')}</SectionTitle>
      <View style={styles.themes}>
        {wheelThemes.map((th) => {
          const until = settings.themeUnlocks[th.id] ?? 0;
          const locked = th.premium && until <= now;
          const selected = settings.themeId === th.id && !locked;
          return (
            <Pressable
              key={th.id}
              onPress={() => selectTheme(th.id, th.premium)}
              style={[styles.theme, selected && styles.themeSelected]}
              testID={`theme-${th.id}`}
            >
              <Wheel items={PREVIEW_ITEMS} palette={th.palette} size={64} showPointer={false} />
              <Text style={styles.themeName}>{t(`themeNames_${th.id}` as 'themeNames_classic')}</Text>
              {th.premium && (
                <Text style={styles.themeSub} numberOfLines={2}>
                  {locked
                    ? `▶ ${t('themeLocked')}`
                    : t('themeUnlockedUntil', {
                        time: new Date(until).toLocaleString(undefined, {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      })}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>{t('settings')}</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Row label={t('sound')}>
          <Switch value={settings.sound} onValueChange={(v) => updateSettings({ sound: v })} />
        </Row>
        <Row label={t('haptics')}>
          <Switch value={settings.haptics} onValueChange={(v) => updateSettings({ haptics: v })} />
        </Row>
      </Card>

      <SectionTitle>{t('howTo')}</SectionTitle>
      <Card>
        <Text style={styles.body}>{t('howToBody')}</Text>
        <Text style={[styles.body, { color: colors.subText, marginTop: 10 }]}>{t('disclaimer')}</Text>
      </Card>

      <SectionTitle> </SectionTitle>
      <Card style={{ gap: 4 }}>
        <LinkRow label={t('rateApp')} onPress={() => StoreReview.requestReview().catch(() => {})} />
        <LinkRow label={t('otherApps')} onPress={() => Linking.openURL(OTHER_APPS)} />
        {ads.privacyOptionsRequired && <LinkRow label={t('privacy')} onPress={ads.showPrivacyOptions} />}
      </Card>
      <Text style={styles.version}>
        {t('version')} {Constants.expoConfig?.version} · © SKart
      </Text>
    </ScrollView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { paddingVertical: 10 }, pressed && { opacity: 0.6 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.subText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  theme: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  themeSelected: { borderColor: colors.primary },
  themeName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  themeSub: { fontSize: 11, color: colors.subText, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, color: colors.text },
  body: { fontSize: 14, lineHeight: 21, color: colors.text },
  version: { textAlign: 'center', fontSize: 12, color: colors.subText, marginTop: 24 },
});
