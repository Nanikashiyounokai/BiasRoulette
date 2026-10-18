import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type AppIconVariant = 'default' | 'plain';

type Native = {
  getVariant(): Promise<AppIconVariant>;
  setVariant(variant: AppIconVariant): Promise<void>;
};

// Expo Go や古い開発ビルドには入っていないので、無いときは機能ごと隠す
const native = requireOptionalNativeModule<Native>('AppIcon');

/**
 * ホーム画面の名前・アイコンを変えられるのは Android だけ。
 * iOS は名前を変えられず、アイコンを変えると OS の通知が出て人前でばれるので、使わない（10/18 決定）
 */
export const appIconAvailable = !!native && Platform.OS === 'android';

export async function getAppIconVariant(): Promise<AppIconVariant> {
  return native ? native.getVariant() : 'default';
}

export async function setAppIconVariant(variant: AppIconVariant): Promise<void> {
  if (!native) throw new Error('AppIcon module is not available');
  await native.setVariant(variant);
}
