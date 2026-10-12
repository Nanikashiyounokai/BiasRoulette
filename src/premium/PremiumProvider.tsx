import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { needsPremium, type Roulette } from '../domain/roulette';
import { useStore } from '../store';
import { ENTITLEMENT_ID, FALLBACK_PRICE, LIFETIME_PRODUCT_ID, MAX_TICKETS, revenueCatApiKey } from './config';

type PurchaseResult = 'purchased' | 'cancelled' | 'failed' | 'unavailable';

type Premium = {
  /** 買い切りを購入済み（広告も消える） */
  purchased: boolean;
  /** 極端な確率をチケットなしで使える（購入済み or 旧版からの引き継ぎ） */
  unlimited: boolean;
  grandfathered: boolean;
  tickets: number;
  maxTickets: number;
  /** ストア表示用の価格（例: ¥1,000） */
  price: string;
  /** 課金が使える状態か（API キー設定済み・商品が取れた） */
  storeReady: boolean;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  addTicket: () => boolean;
  /** チケットを 1 枚使う。持っていなければ false */
  spendTicket: () => boolean;
  /** このルーレットを回すのにチケットが要るか（チケット不要の人は常に false） */
  requiresTicket: (r: Pick<Roulette, 'biasEnabled' | 'items'>) => boolean;
};

const Ctx = createContext<Premium | null>(null);

function hasEntitlement(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

/**
 * 買い切り（RevenueCat）とチケット（リワード広告）をまとめて扱う。
 *
 * 極端な確率（0%・100%・5% 未満・95% 超・21 項目以上）を回す方法:
 * - 買い切り ¥1,000 … ずっと使える。広告も消える
 * - チケット … リワード広告 1 本で 1 枚、最大 5 枚。プレイ画面に入って最初に回したときに 1 枚使い、画面を閉じるまで回し放題
 * - 旧版から引き継いだ人 … 旧版で無料だったので、ずっと使える（広告は出る）
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
        setPkg(pkgs.find((p) => p.product.identifier.startsWith(LIFETIME_PRODUCT_ID)) ?? offerings.current?.lifetime ?? null);
      } catch (e) {
        // オフラインでも、前回の購入情報は SDK のキャッシュから getCustomerInfo で返る
        console.warn('purchases init failed', e);
      }
    })();
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  const purchased = hasEntitlement(info);
  const unlimited = purchased || settings.grandfathered;

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

  const addTicket = useCallback(() => {
    if (settings.tickets >= MAX_TICKETS) return false;
    return changeTickets(1, MAX_TICKETS);
  }, [settings.tickets, changeTickets]);

  const spendTicket = useCallback(() => changeTickets(-1, MAX_TICKETS), [changeTickets]);

  const requiresTicket = useCallback(
    (r: Pick<Roulette, 'biasEnabled' | 'items'>) => !unlimited && needsPremium(r),
    [unlimited],
  );

  const value = useMemo<Premium>(
    () => ({
      purchased,
      unlimited,
      grandfathered: settings.grandfathered,
      tickets: settings.tickets,
      maxTickets: MAX_TICKETS,
      price: pkg?.product.priceString ?? FALLBACK_PRICE,
      storeReady: configured && !!pkg,
      purchase,
      restore,
      addTicket,
      spendTicket,
      requiresTicket,
    }),
    [purchased, unlimited, settings.grandfathered, settings.tickets, pkg, configured, purchase, restore, addTicket, spendTicket, requiresTicket],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium(): Premium {
  const v = useContext(Ctx);
  if (!v) throw new Error('PremiumProvider がない');
  return v;
}
