import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * 広告ユニット ID。
 *
 * 旧版の問題（2026-10 調査）:
 * - 全 6 画面に同じバナーユニットを上下 2 枚ずつ（計 12 枚）貼っていた
 * - そのうちホームと一覧の 4 枚は ID が `cca-app-pub-…` と打ち間違っており、一度も表示されていなかった
 *
 * 新版はバナー 1 画面 1 枚 + インタースティシャル（頻度制限つき）+ リワード（テーマ解放）。
 * iOS も Android と同じ AdMob アカウント（pub-2149…）。GitHub の旧 iOS コードにある pub-2529… は使われていない。
 * インタースティシャルとリワードは 2026-10-11 に作成（AdMob 上の名前は「偏り{OS}インタースティシャル」など）。
 */
type Units = { banner: string | null; interstitial: string | null; rewarded: string | null };

const production: Record<'ios' | 'android', Units> = {
  android: {
    banner: 'ca-app-pub-2149317250626507/2129548313',
    interstitial: 'ca-app-pub-2149317250626507/1921352602',
    rewarded: 'ca-app-pub-2149317250626507/4223996595',
  },
  ios: {
    banner: 'ca-app-pub-2149317250626507/7457842712',
    interstitial: 'ca-app-pub-2149317250626507/9001766270',
    rewarded: 'ca-app-pub-2149317250626507/6375602934',
  },
};

const test: Units = {
  banner: TestIds.ADAPTIVE_BANNER,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,
};

// 実機テスト用のリリースビルドは EXPO_PUBLIC_TEST_ADS=1 でテスト広告にする（自分の広告を押すと AdMob の規約違反になる）
const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_TEST_ADS === '1';

export const adUnits: Units = useTestAds
  ? test
  : production[Platform.OS === 'ios' ? 'ios' : 'android'];

/**
 * インタースティシャルの頻度制限。
 * 抽選の最中や結果表示の直後には出さない。プレイ画面から「戻る」ときだけ候補にする。
 */
export const interstitialPolicy = {
  /** 前回表示からこの回数以上回していること */
  minSpinsBetween: 3,
  /** 前回表示からこの時間以上たっていること */
  minIntervalMs: 3 * 60 * 1000,
  /** 起動直後はしばらく出さない */
  graceAfterLaunchMs: 2 * 60 * 1000,
};

/** リワードで解放したテーマの有効期間 */
export const REWARD_UNLOCK_MS = 24 * 60 * 60 * 1000;
