import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, SectionTitle } from '../components/ui';
import { FREE_MAX_EVEN_ITEMS, PREMIUM_HIGH_PCT, PREMIUM_LOW_PCT } from '../domain/roulette';
import { t } from '../i18n';
import { PRIVACY_URL, TERMS_URL } from '../premium/config';
import { usePremium } from '../premium/PremiumProvider';
import { useTicketGate } from '../premium/useTicketGate';
import { colors } from '../theme';

/**
 * チケットと広告削除（月額）の画面。
 * サブスクリプションの画面には、料金・期間・自動更新の説明・利用規約・プライバシーポリシーを載せる（App Store 3.1.2）。
 */
export default function Premium() {
  const premium = usePremium();
  const gate = useTicketGate();
  const insets = useSafeAreaInsets();
  const vars = { low: PREMIUM_LOW_PCT, high: PREMIUM_HIGH_PCT, n: FREE_MAX_EVEN_ITEMS + 1 };

  const buy = async () => {
    const result = await premium.purchase();
    if (result === 'purchased') Alert.alert(t('purchased'));
    else if (result === 'failed' || result === 'unavailable') Alert.alert(t('purchaseFailed'));
  };

  const restore = async () => {
    Alert.alert((await premium.restore()) ? t('restored') : t('restoreNone'));
  };

  const earn = async () => {
    if (await gate.earnTicket()) Alert.alert(t('ticketEarned', { n: premium.tickets + 1 }));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 + insets.bottom, gap: 14 }}>
      <SectionTitle>{t('tickets')}</SectionTitle>
      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <Ionicons name="ticket" size={24} color={colors.primary} />
          <Text style={styles.count}>{t('ticketCount', { n: premium.tickets })}</Text>
        </View>
        <Text style={styles.note}>{t('ticketHowTo', vars)}</Text>
        <Button
          title={t('earnTicket')}
          variant="secondary"
          icon={<Ionicons name="play-circle" size={20} color={colors.primaryText} />}
          onPress={earn}
          testID="earn-ticket"
        />
      </Card>

      <SectionTitle>{t('premiumTitle')}</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Text style={styles.body}>{t('premiumLead')}</Text>
        {[t('premiumBenefit1'), t('premiumBenefit2')].map((b) => (
          <View key={b} style={styles.row}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.body}>{b}</Text>
          </View>
        ))}
        <Text style={styles.note}>{t('premiumNote')}</Text>
        {premium.adFree ? (
          <>
            <Text style={[styles.body, { fontWeight: 'bold' }]}>{t('purchased')}</Text>
            {premium.managementUrl && (
              <Button
                title={t('manageSubscription')}
                variant="ghost"
                onPress={() => Linking.openURL(premium.managementUrl!)}
              />
            )}
          </>
        ) : (
          <>
            <Button
              title={
                premium.storeReady
                  ? t('subscribe', { price: premium.price })
                  : `${t('subscribe', { price: premium.price })}（${t('comingSoon')}）`
              }
              onPress={buy}
              disabled={!premium.storeReady}
              testID="subscribe"
            />
            <Text style={styles.note}>{t('subscribeTerms')}</Text>
            <Button title={t('restore')} variant="ghost" onPress={restore} disabled={!premium.storeReady} />
          </>
        )}
        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.link}>{t('terms')}</Text>
          </Pressable>
          {!!PRIVACY_URL && (
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text style={styles.link}>{t('privacyPolicy')}</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { fontSize: 15, color: colors.text, flex: 1 },
  count: { fontSize: 22, fontWeight: 'bold', color: colors.primaryText },
  note: { fontSize: 12, color: colors.subText, lineHeight: 18 },
  links: { flexDirection: 'row', gap: 20, justifyContent: 'center', marginTop: 4 },
  link: { fontSize: 13, color: colors.primaryText, textDecorationLine: 'underline' },
});
