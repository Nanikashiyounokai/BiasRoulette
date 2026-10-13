import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type AppIconVariant = 'default' | 'plain';

type Native = {
  getVariant(): Promise<AppIconVariant>;
  setVariant(variant: AppIconVariant): Promise<void>;
};

// Expo Go や古い開発ビルドには入っていないので、無いときは機能ごと隠す
const native = requireOptionalNativeModule<Native>('AppIcon');

export const appIconAvailable = !!native && (Platform.OS === 'android' || Platform.OS === 'ios');
/** Android は名前も変わる。iOS はアイコンだけ */
export const appIconChangesName = Platform.OS === 'android';

export async function getAppIconVariant(): Promise<AppIconVariant> {
  return native ? native.getVariant() : 'default';
}

export async function setAppIconVariant(variant: AppIconVariant): Promise<void> {
  if (!native) throw new Error('AppIcon module is not available');
  await native.setVariant(variant);
}
