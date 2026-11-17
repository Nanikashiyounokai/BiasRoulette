import { t } from './i18n';
import { useStore } from './store';

/**
 * アプリ名などの表示。ホーム画面を「目立たない」にしているときは「偏り」の語を出さない
 * （人前で開いたときにばれないように）。設定画面の「ホーム画面の表示」だけは例外で、元の名前を出す。
 */
export function useBranding() {
  const { ready, settings } = useStore();
  // 設定を読み終えるまでは、目立たない方に倒す（起動直後に「偏り」が一瞬出ないように）
  const lowKey = !ready || settings.homeIcon === 'plain';
  return {
    lowKey,
    appName: lowKey ? t('appNamePlain') : t('appName'),
    tagline: lowKey ? t('taglinePlain') : t('tagline'),
    shareText: (name: string, result: string) => t(lowKey ? 'shareTextPlain' : 'shareText', { name, result }),
  };
}
