import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { needsPremium, type Roulette } from '../domain/roulette';
import { useStore } from '../store';
import { ENTITLEMENT_ID, FALLBACK_PRICE, MONTHLY_PRODUCT_ID, revenueCatApiKey } from './config';

type PurchaseResult = 'purchased' | 'cancelled' | 'failed' | 'unavailable';

type Premium = {
  /** 広告削除（月額）を契約中 */
  adFree: boolean;
  tickets: number;
  /** ストア表示用の価格（例: ¥300） */
  price: string;
  /** 課金が使える状態か（API キー設定済み・商品が取れた） */
  storeReady: boolean;
  /** 契約の管理（解約）ページ。ストアから取れたときだけ */
  managementUrl: string | null;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  addTicket: () => boolean;
  /** チケットを 1 枚使う。持っていなければ false */
  spendTicket: () => boolean;
  /** このルーレットを回すのにチケットが要るか */
  requiresTicket: (r: Pick<Roulette, 'biasEnabled' | 'items'>) => boolean;
};

const Ctx = createContext<Premium | null>(null);

function hasEntitlement(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

/**
 * 広告削除のサブスクリプション（RevenueCat）とチケット（リワード広告）をまとめて扱う。
 *
 * 2026-10-13 報告会の決定:
 * - 極端な確率（0%・100%・5% 未満・95% 超・21 項目以上）は課金せず、チケットだけで解放する。
 *   リワード広告 1 本で 1 枚、何枚でも貯められる。プレイ画面で最初に回したときに 1 枚使い、閉じるまで回し放題
 * - 課金は広告削除の月額 ¥300。バナーとインタースティシャルが消える（リワードは本人が選んだときだけなので残る）
 * - 旧版の利用者も特別扱いしない
 */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const { settings, changeTickets } = useStore();
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!revenueCatApiKey) return;
    const onUpdate = (next: CustomerInfo) => setInfo(next);
    (async () => {
      try {
        Purchases.configure({ apiKey: revenueCatApiKey });
        setConfigured(true);
        Purchases.addCustomerInfoUpdateListener(onUpdate);
        setInfo(await Purchases.getCustomerInfo());
        const offerings = await Purchases.getOfferings();
        const pkgs = offerings.current?.availablePackages ?? [];
        setPkg(pkgs.find((p) => p.product.identifier.startsWith(MONTHLY_PRODUCT_ID)) ?? offerings.current?.monthly ?? null);
      } catch (e) {
        // オフラインでも、前回の購入情報は SDK のキャッシュから getCustomerInfo で返る
        console.warn('purchases init failed', e);
      }
    })();
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  const adFree = hasEntitlement(info);

  const purchase = useCallback(async (): Promise<PurchaseResult> => {
    if (!configured || !pkg) return 'unavailable';
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setInfo(customerInfo);
      return hasEntitlement(customerInfo) ? 'purchased' : 'failed';
    } catch (e: unknown) {
      if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
      console.warn('purchase failed', e);
      return 'failed';
    }
  }, [configured, pkg]);

  const restore = useCallback(async () => {
    if (!configured) return false;
    try {
      const restored = await Purchases.restorePurchases();
      setInfo(restored);
      return hasEntitlement(restored);
    } catch (e) {
      console.warn('restore failed', e);
      return false;
    }
  }, [configured]);

  const addTicket = useCallback(() => changeTickets(1), [changeTickets]);
  const spendTicket = useCallback(() => changeTickets(-1), [changeTickets]);
  const requiresTicket = useCallback((r: Pick<Roulette, 'biasEnabled' | 'items'>) => needsPremium(r), []);

  const value = useMemo<Premium>(
    () => ({
      adFree,
      tickets: settings.tickets,
      price: pkg?.product.priceString ?? FALLBACK_PRICE,
      storeReady: configured && !!pkg,
      managementUrl: info?.managementURL ?? null,
      purchase,
      restore,
      addTicket,
      spendTicket,
      requiresTicket,
    }),
    [adFree, settings.tickets, pkg, configured, info, purchase, restore, addTicket, spendTicket, requiresTicket],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium(): Premium {
  const v = useContext(Ctx);
  if (!v) throw new Error('PremiumProvider がない');
  return v;
}
