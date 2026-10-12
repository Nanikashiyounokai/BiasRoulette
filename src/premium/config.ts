import { Platform } from 'react-native';

/**
 * RevenueCat の公開 SDK キー（アプリに埋め込む前提のキー。秘密鍵ではない）。
 * RevenueCat のプロジェクト「BiasRoulette」（2026-10-12 作成）→ API keys の SDK API keys。
 * 空にすると課金を初期化せず、買い切りボタンは「準備中」になる。
 */
const API_KEYS = {
  ios: 'appl_RmjQcBoQKDTDmZIKmeFZgNWkteD',
  android: 'goog_KaJZhevttzBoIuHiwDdlgEDOnvt',
};

export const revenueCatApiKey: string = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

/**
 * RevenueCat 側で作る名前。ダッシュボードの設定と揃えること。
 * - Entitlement: `premium`
 * - Product（両ストア共通の ID）: `biasroulette_premium_lifetime`（非消耗型・買い切り ¥1,000）
 * - Offering: `default` に Lifetime パッケージとして入れる
 */
export const ENTITLEMENT_ID = 'premium';
export const LIFETIME_PRODUCT_ID = 'biasroulette_premium_lifetime';
/** ストアから価格が取れないとき（オフライン・未設定）の表示 */
export const FALLBACK_PRICE = '¥1,000';

/** チケットの上限。広告を何本でも貯められると買い切りの理由が薄れる */
export const MAX_TICKETS = 5;
