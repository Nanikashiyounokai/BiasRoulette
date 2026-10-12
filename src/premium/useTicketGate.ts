import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAds } from '../ads/AdsProvider';
import { FREE_MAX_EVEN_ITEMS, PREMIUM_HIGH_PCT, PREMIUM_LOW_PCT, type Roulette } from '../domain/roulette';
import { t } from '../i18n';
import { usePremium } from './PremiumProvider';

/**
 * 極端な確率のルーレットを開く前の確認。
 *
 * チケットを持っていれば何も聞かずに進む（使うのはプレイ画面で最初に回したとき）。
 * 持っていなければ、ホーム画面などプレイ画面に入る前にだけ聞く。人前で回している最中に
 * 課金や広告の案内が出ると、裏で何か仕込んでいるのが見ている人に分かってしまうため。
 */
export function useTicketGate() {
  const ads = useAds();
  const premium = usePremium();

  /** リワード広告を見てチケットを 1 枚もらう */
  const earnTicket = useCallback(async () => {
    if (premium.tickets >= premium.maxTickets) {
      Alert.alert(t('ticketFull', { n: premium.maxTickets }));
      return false;
    }
    const earned = await ads.showRewarded();
    if (!earned) {
      Alert.alert(t('rewardFailed'));
      return false;
    }
    return premium.addTicket();
  }, [ads, premium]);

  /** チケットの案内を出す。広告を見てチケットを得たら onReady を呼ぶ */
  const prompt = useCallback(
    (onReady?: () => void, onCancel?: () => void) =>
      Alert.alert(
        t('ticketNeededTitle'),
        t('ticketNeededBody', { low: PREMIUM_LOW_PCT, high: PREMIUM_HIGH_PCT, n: FREE_MAX_EVEN_ITEMS + 1 }),
        [
          { text: t('cancel'), style: 'cancel', onPress: onCancel },
          {
            text: t('buyLifetime', { price: premium.price }),
            onPress: () => {
              onCancel?.();
              router.push('/premium');
            },
          },
          {
            text: t('earnTicket'),
            onPress: async () => {
              if (await earnTicket()) onReady?.();
              else onCancel?.();
            },
          },
        ],
        { cancelable: true, onDismiss: onCancel },
      ),
    [premium.price, earnTicket],
  );

  /** 回せる状態ならすぐ onReady。チケットが足りなければ案内を出す */
  const openWithGate = useCallback(
    (r: Pick<Roulette, 'biasEnabled' | 'items'>, onReady: () => void, onCancel?: () => void) => {
      if (!premium.requiresTicket(r) || premium.tickets > 0) {
        onReady();
        return;
      }
      prompt(onReady, onCancel);
    },
    [premium, prompt],
  );

  return { earnTicket, prompt, openWithGate };
}
