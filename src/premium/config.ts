import { Platform } from 'react-native';

/**
 * RevenueCat の公開 SDK キー（アプリに埋め込む前提のキー。秘密鍵ではない）。
 * RevenueCat のプロジェクト「BiasRoulette」（2026-10-12 作成）→ API keys の SDK API keys。
 * 空にすると課金を初期化せず、購入ボタンは「準備中」になる。
 */
const API_KEYS = {
  ios: 'appl_RmjQcBoQKDTDmZIKmeFZgNWkteD',
  android: 'goog_KaJZhevttzBoIuHiwDdlgEDOnvt',
};

export const revenueCatApiKey: string = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

/**
 * 課金は「広告削除」の月額 ¥300 だけ（2026-10-13 報告会で決定）。
 * 極端な確率は課金せず、リワード広告のチケットでのみ解放する。
 *
 * RevenueCat 側の名前。ダッシュボードの設定と揃えること。
 * - Entitlement: `ad_free`
 * - Product（両ストア共通の ID）: `biasroulette_adfree_monthly`（自動更新サブスクリプション・1 か月）
 * - Offering: `default` に Monthly パッケージとして入れる
 */
export const ENTITLEMENT_ID = 'ad_free';
export const MONTHLY_PRODUCT_ID = 'biasroulette_adfree_monthly';
/** ストアから価格が取れないとき（オフライン・未設定）の表示 */
export const FALLBACK_PRICE = '¥300';

/** サブスクリプションの画面に必ず載せるリンク（App Store 審査ガイドライン 3.1.2） */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_URL = 'https://doc-hosting.flycricket.io/bias-roulette-privacy-policy/2d86e6b8-42a8-4c66-8b2d-dd9bd28bfd14/';
