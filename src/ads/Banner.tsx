import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { adUnits } from './config';
import { useAds } from './AdsProvider';

/**
 * 画面下に固定するアダプティブバナー。1 画面 1 枚。
 * 旧版は固定サイズ 320x50 を上下 2 枚。上の 1 枚はステータスバーに潜っていた。
 */
export function Banner() {
  const { ready } = useAds();
  const insets = useSafeAreaInsets();
  if (!ready || !adUnits.banner) return <View style={{ height: insets.bottom }} />;
  return (
    <View style={{ alignItems: 'center', paddingBottom: insets.bottom, backgroundColor: colors.bg }}>
      <BannerAd unitId={adUnits.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
