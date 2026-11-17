import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

import { usePremium } from '../premium/PremiumProvider';
import { adUnits, interstitialPolicy } from './config';

type Ads = {
  /** 同意の確認と SDK 初期化が済んだ */
  ready: boolean;
  /** 買い切り購入済み。バナーを出さない */
  adFree: boolean;
  /** プライバシー オプション フォームを出す必要がある地域か（EEA など） */
  privacyOptionsRequired: boolean;
  showPrivacyOptions: () => void;
  /** 1 回回すごとに呼ぶ */
  recordSpin: () => void;
  /** 自然な区切り（プレイ画面を離れる）で呼ぶ。条件を満たしたときだけ表示する */
  maybeShowInterstitial: () => Promise<void>;
  rewardedAvailable: boolean;
  /** 最後まで見たら true */
  showRewarded: () => Promise<boolean>;
};

const Ctx = createContext<Ads | null>(null);

/**
 * 同意 → ATT → SDK 初期化 の順に進める。
 * 旧版は UMP（同意）も ATT も無しで各画面ごとに `MobileAds.initialize` を呼んでいた。
 */
export function AdsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const [rewardedAvailable, setRewardedAvailable] = useState(false);
  // 買い切りを買った人にはバナーもインタースティシャルも出さない（リワードは本人が選んだときだけなので残す）
  const adFree = usePremium().adFree;
  const adFreeRef = useRef(adFree);
  useEffect(() => {
    adFreeRef.current = adFree;
  }, [adFree]);

  const launchedAt = useRef(0);
  const spinsSinceInterstitial = useRef(0);
  const lastInterstitialAt = useRef(0);
  const interstitial = useRef<InterstitialAd | null>(null);
  const interstitialLoaded = useRef(false);
  const rewarded = useRef<RewardedAd | null>(null);

  useEffect(() => {
    launchedAt.current = Date.now();
    let cancelled = false;
    (async () => {
      try {
        try {
          const info = await AdsConsent.gatherConsent();
          setPrivacyOptionsRequired(info.privacyOptionsRequirementStatus === 'REQUIRED');
          if (!info.canRequestAds) return;
        } catch (e) {
          // AdMob 側に同意メッセージ（GDPR）が未設定だと「no form(s) configured」で失敗する（2026-10 時点の状態）。
          // 同意の要らない地域まで広告が止まらないよう、前回までの同意状況で判断して続ける
          console.warn('consent failed', e);
          const info = await AdsConsent.getConsentInfo().catch(() => null);
          if (info && info.status === 'REQUIRED' && !info.canRequestAds) return;
        }
        if (Platform.OS === 'ios') await requestTrackingPermissionsAsync();
        await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
        await mobileAds().initialize();
        if (!cancelled) setReady(true);
      } catch (e) {
        // 同意フォームが取れない（オフラインなど）ときは広告なしで動かす
        console.warn('ads init failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadInterstitial = useCallback(function load() {
    if (!adUnits.interstitial) return;
    const ad = InterstitialAd.createForAdRequest(adUnits.interstitial);
    interstitialLoaded.current = false;
    ad.addAdEventListener(AdEventType.LOADED, () => (interstitialLoaded.current = true));
    ad.addAdEventListener(AdEventType.CLOSED, () => load());
    ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded.current = false;
    });
    ad.load();
    interstitial.current = ad;
  }, []);

  const loadRewarded = useCallback(() => {
    if (!adUnits.rewarded) return;
    const ad = RewardedAd.createForAdRequest(adUnits.rewarded);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => setRewardedAvailable(true));
    ad.addAdEventListener(AdEventType.ERROR, () => setRewardedAvailable(false));
    ad.load();
    rewarded.current = ad;
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadInterstitial();
    loadRewarded();
  }, [ready, loadInterstitial, loadRewarded]);

  const recordSpin = useCallback(() => {
    spinsSinceInterstitial.current += 1;
  }, []);

  const maybeShowInterstitial = useCallback(async () => {
    const now = Date.now();
    const p = interstitialPolicy;
    if (adFreeRef.current) return;
    if (!interstitial.current || !interstitialLoaded.current) return;
    if (now - launchedAt.current < p.graceAfterLaunchMs) return;
    if (spinsSinceInterstitial.current < p.minSpinsBetween) return;
    if (now - lastInterstitialAt.current < p.minIntervalMs) return;
    spinsSinceInterstitial.current = 0;
    lastInterstitialAt.current = now;
    interstitialLoaded.current = false;
    await interstitial.current.show().catch(() => loadInterstitial());
  }, [loadInterstitial]);

  const showRewarded = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        const ad = rewarded.current;
        if (!ad || !rewardedAvailable) return resolve(false);
        let earned = false;
        const offEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true));
        setRewardedAvailable(false);
        const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          offEarned();
          offClosed();
          loadRewarded();
          resolve(earned);
        });
        ad.show().catch(() => {
          offEarned();
          offClosed();
          loadRewarded();
          resolve(false);
        });
      }),
    [rewardedAvailable, loadRewarded],
  );

  const showPrivacyOptions = useCallback(() => {
    AdsConsent.showPrivacyOptionsForm().catch((e) => console.warn(e));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      adFree,
      privacyOptionsRequired,
      showPrivacyOptions,
      recordSpin,
      maybeShowInterstitial,
      rewardedAvailable,
      showRewarded,
    }),
    [ready, adFree, privacyOptionsRequired, showPrivacyOptions, recordSpin, maybeShowInterstitial, rewardedAvailable, showRewarded],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAds(): Ads {
  const v = useContext(Ctx);
  if (!v) throw new Error('AdsProvider がない');
  return v;
}
