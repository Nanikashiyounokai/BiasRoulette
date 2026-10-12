import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdsProvider } from '../ads/AdsProvider';
import { t } from '../i18n';
import { PremiumProvider } from '../premium/PremiumProvider';
import { StoreProvider } from '../store';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <PremiumProvider>
        <AdsProvider>
          {/* 旧版はステータスバーの文字が白で、白背景に溶けて見えなかった */}
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.primaryText,
              headerTitleStyle: { fontWeight: 'bold' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
              headerBackButtonDisplayMode: 'minimal',
            }}
          >
            <Stack.Screen name="index" options={{ title: t('appName') }} />
            <Stack.Screen name="edit" options={{ title: '' }} />
            <Stack.Screen name="play/[id]" options={{ title: '' }} />
            <Stack.Screen name="settings" options={{ title: t('settings') }} />
            <Stack.Screen name="premium" options={{ title: t('premium'), presentation: 'modal' }} />
          </Stack>
        </AdsProvider>
        </PremiumProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
