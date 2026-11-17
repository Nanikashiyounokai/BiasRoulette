/** 旧アプリのオレンジ（#FFC18A 付近）を引き継いだ配色 */
export const colors = {
  bg: '#FFFAF5',
  surface: '#FFFFFF',
  primary: '#F08A3C',
  primarySoft: '#FFC18A',
  primaryText: '#3A2414',
  text: '#222222',
  subText: '#6B6B6B',
  border: '#E6DCD2',
  danger: '#D64545',
  secret: '#3C3C64',
  secretSoft: '#E8E8F4',
};

/**
 * 盤面の既定パレット。旧 Android 版の 10 色を土台に、隣り合っても区別しやすい順に並べた。
 * 項目ごとに色を変えたい要望（Play レビュー ★3）は編集画面のカラーピッカーで応える。
 */
export const slicePalette = [
  '#E93A24',
  '#F2A33A',
  '#F5D33F',
  '#7BC86C',
  '#2FA39A',
  '#3E8ED0',
  '#6A5ACD',
  '#C45AB3',
  '#EA6F8A',
  '#8D6E63',
  '#9CCC65',
  '#4DD0E1',
];

/** リワード広告で一時的に解放するテーマ */
export type WheelTheme = {
  id: string;
  premium: boolean;
  palette: string[];
};

export const wheelThemes: WheelTheme[] = [
  { id: 'classic', premium: false, palette: slicePalette },
  {
    id: 'pastel',
    premium: true,
    palette: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D7BAFF', '#FFC6E7', '#C9F2E8'],
  },
  {
    id: 'neon',
    premium: true,
    palette: ['#FF2E88', '#FFD300', '#00F5D4', '#7B2FF7', '#00BBF9', '#F15BB5', '#9EF01A', '#FF6D00'],
  },
  {
    id: 'mono',
    premium: true,
    palette: ['#222222', '#555555', '#888888', '#BBBBBB', '#3A3A3A', '#707070', '#A0A0A0', '#D0D0D0'],
  },
];

export function readableTextColor(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#222222' : '#FFFFFF';
}
