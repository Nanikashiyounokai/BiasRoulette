import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, SectionTitle } from '../components/ui';
import { FREE_MAX_EVEN_ITEMS, PREMIUM_HIGH_PCT, PREMIUM_LOW_PCT } from '../domain/roulette';
import { t } from '../i18n';
import { usePremium } from '../premium/PremiumProvider';
import { useTicketGate } from '../premium/useTicketGate';
import { colors } from '../theme';

/**
 * プレミアム（買い切り ¥980）とチケットの案内。
 * RevenueCat の API キーが未設定のあいだは、買い切りボタンは「準備中」で押せない。
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
      <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
        <Text style={{ fontSize: 40 }}>👑</Text>
        <Text style={styles.title}>{t('premiumTitle')}</Text>
        <Text style={styles.lead}>{t('premiumLead')}</Text>
      </View>

      <Card style={{ gap: 12 }}>
        {[t('premiumBenefit1'), t('premiumBenefit2', vars), t('premiumBenefit3')].map((b) => (
          <View key={b} style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.body}>{b}</Text>
          </View>
        ))}
        <Text style={styles.note}>{t('premiumFreeRange', vars)}</Text>
      </Card>

      {premium.purchased ? (
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <Text style={styles.body}>{t('purchased')}</Text>
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {premium.grandfathered && (
            <Card style={{ backgroundColor: colors.primarySoft }}>
              <Text style={styles.body}>{t('grandfatheredNote')}</Text>
            </Card>
          )}
          <Button
            title={
              premium.storeReady
                ? t('buyLifetime', { price: premium.price })
                : `${t('buyLifetime', { price: premium.price })}（${t('comingSoon')}）`
            }
            onPress={buy}
            disabled={!premium.storeReady}
            testID="buy-lifetime"
          />
          <Text style={[styles.note, { textAlign: 'center' }]}>{t('buyLifetimeNote')}</Text>
          <Button title={t('restore')} variant="ghost" onPress={restore} disabled={!premium.storeReady} />
        </View>
      )}

      {!premium.unlimited && (
        <>
          <SectionTitle>{t('tickets')}</SectionTitle>
          <Card style={{ gap: 12 }}>
            <View style={styles.benefit}>
              <Ionicons name="ticket" size={22} color={colors.primary} />
              <Text style={styles.ticketCount}>{t('ticketCount', { n: premium.tickets, max: premium.maxTickets })}</Text>
            </View>
            <Text style={styles.note}>{t('ticketHowTo')}</Text>
            <Button
              title={t('earnTicket')}
              variant="secondary"
              icon={<Ionicons name="play-circle" size={20} color={colors.primaryText} />}
              onPress={earn}
              disabled={premium.tickets >= premium.maxTickets}
              testID="earn-ticket"
            />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primaryText },
  lead: { fontSize: 14, color: colors.subText, textAlign: 'center' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { fontSize: 15, color: colors.text, flex: 1 },
  ticketCount: { fontSize: 18, fontWeight: 'bold', color: colors.primaryText },
  note: { fontSize: 12, color: colors.subText },
});
