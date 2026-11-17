import { useStore } from './store';
import { useNow } from './useNow';
import { slicePalette, wheelThemes } from './theme';

/** 選択中のテーマの配色。プレミアムテーマは解放期限切れなら既定に戻す */
export function useWheelPalette(): string[] {
  const { settings } = useStore();
  const now = useNow();
  const theme = wheelThemes.find((th) => th.id === settings.themeId);
  if (!theme) return slicePalette;
  if (theme.premium && (settings.themeUnlocks[theme.id] ?? 0) < now) return slicePalette;
  return theme.palette;
}
