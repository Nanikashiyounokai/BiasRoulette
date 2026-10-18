import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { appIconAvailable, getAppIconVariant } from '../../modules/app-icon/src';
import { AdsProvider } from '../ads/AdsProvider';
import { useBranding } from '../branding';
import { t } from '../i18n';
import { PremiumProvider } from '../premium/PremiumProvider';
import { StoreProvider, useStore } from '../store';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <PremiumProvider>
        <AdsProvider>
          {/* 旧版はステータスバーの文字が白で、白背景に溶けて見えなかった */}
          <StatusBar style="dark" />
          <AppStack />
        </AdsProvider>
        </PremiumProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function AppStack() {
  const { ready, settings, updateSettings } = useStore();
  const { appName } = useBranding();

  // ホーム画面の表示の正本は OS 側。再インストールや OS の都合でずれたら、OS に合わせる
  useEffect(() => {
    if (!ready || !appIconAvailable) return;
    getAppIconVariant()
      .then((v) => {
        if (v !== settings.homeIcon) updateSettings({ homeIcon: v });
      })
      .catch(() => {});
    // 起動時に 1 回だけ合わせる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
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
      <Stack.Screen name="index" options={{ title: appName }} />
      <Stack.Screen name="edit" options={{ title: '' }} />
      <Stack.Screen name="play/[id]" options={{ title: '' }} />
      <Stack.Screen name="settings" options={{ title: t('settings') }} />
      <Stack.Screen name="premium" options={{ title: t('ticketsAndAds'), presentation: 'modal' }} />
    </Stack>
  );
}
