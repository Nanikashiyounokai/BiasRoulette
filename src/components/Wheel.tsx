import { memo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Polygon, Text as SvgText } from 'react-native-svg';

import { sliceAngles, type Item } from '../domain/roulette';
import { readableTextColor } from '../theme';

type Props = {
  items: Item[];
  palette: string[];
  size: number;
  rotation?: SharedValue<number>;
  /** 除外済み（当たった項目を外すモード）の項目を薄く表示する */
  excludedIds?: Set<string>;
  showPointer?: boolean;
};

function point(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 359.999) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const a = point(cx, cy, r, start);
  const b = point(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function ellipsize(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function itemColor(items: Item[], index: number, palette: string[]): string {
  return items[index]?.color ?? palette[index % palette.length];
}

/** 盤面だけ（回転するのはここ） */
const Face = memo(function Face({ items, palette, size, excludedIds }: Omit<Props, 'rotation' | 'showPointer'>) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const slices = sliceAngles(items);
  const fontSize = Math.max(10, Math.min(18, size / 18 - items.length * 0.3));
  const maxChars = items.length > 12 ? 5 : 8;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r + 1} fill="#FFFFFF" stroke="#3A2414" strokeWidth={2} />
      {items.map((it, i) => {
        const { start, end } = slices[i];
        const color = itemColor(items, i, palette);
        const excluded = excludedIds?.has(it.id);
        const mid = (start + end) / 2;
        const label = point(cx, cy, r * 0.6, mid);
        // 一覧のサムネイルなど小さい盤面では文字を出さない（潰れて読めない）
        const showLabel = size >= 120 && end - start >= 8;
        // 左半分（6 時〜12 時）の文字は逆さまにならないよう 180° 返す
        const textAngle = mid > 180 ? mid + 90 : mid - 90;
        return (
          <G key={it.id} opacity={excluded ? 0.25 : 1}>
            <Path d={slicePath(cx, cy, r, start, end)} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />
            {showLabel && (
              <SvgText
                x={label.x}
                y={label.y}
                fill={readableTextColor(color)}
                fontSize={fontSize}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${textAngle} ${label.x} ${label.y})`}
              >
                {ellipsize(it.name, maxChars)}
              </SvgText>
            )}
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={size * 0.06} fill="#3A2414" stroke="#FFFFFF" strokeWidth={3} />
    </Svg>
  );
});

/**
 * ルーレット本体。針は 12 時方向に固定で、盤面を回す。
 * 旧版は針の画像と盤面の画像が離れて配置されていて、端末によっては針が盤面に届いていなかった。
 */
export function Wheel({ items, palette, size, rotation, excludedIds, showPointer = true }: Props) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation ? rotation.value : 0}deg` }],
  }));
  const pw = size * 0.09;
  return (
    <View style={{ width: size, height: size + (showPointer ? pw * 0.6 : 0) }}>
      <Animated.View style={[{ position: 'absolute', top: showPointer ? pw * 0.6 : 0 }, style]}>
        <Face items={items} palette={palette} size={size} excludedIds={excludedIds} />
      </Animated.View>
      {showPointer && (
        <Svg width={size} height={pw * 1.8} style={{ position: 'absolute', top: 0 }}>
          <Polygon
            points={`${size / 2 - pw / 2},0 ${size / 2 + pw / 2},0 ${size / 2},${pw * 1.6}`}
            fill="#3A2414"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </Svg>
      )}
    </View>
  );
}
