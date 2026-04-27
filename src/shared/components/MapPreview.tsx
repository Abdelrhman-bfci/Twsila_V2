import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop as SvgStop,
  Rect,
  Path,
  Circle,
  G,
  Line,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { BorderRadius, Colors, FontFamily, Shadows, Spacing } from '@core/theme';

export interface MapStop {
  label: string;
  address?: string;
  type: 'start' | 'middle' | 'end';
  lat?: number;
  lng?: number;
}

interface MapPreviewProps {
  stops: MapStop[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  showZoomControls?: boolean;
}

/**
 * Stylized "Google Maps"-like preview rendered via SVG.
 *
 * If a stop provides lat/lng, those are used to project markers; otherwise we
 * lay them out evenly along a curved path so the preview always looks alive.
 */
export const MapPreview: React.FC<MapPreviewProps> = ({
  stops,
  height = 220,
  style,
  onZoomIn,
  onZoomOut,
  showZoomControls = true,
}) => {
  const W = 360;
  const H = height;

  const projectedStops = useMemo(
    () => projectStopsToCanvas(stops, W, H),
    [stops, W, H]
  );

  const routePath = useMemo(
    () => buildSmoothPath(projectedStops.map((s) => ({ x: s.x, y: s.y }))),
    [projectedStops]
  );

  return (
    <View
      style={[
        styles.wrapper,
        { height: H, borderRadius: BorderRadius.lg },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
            <SvgStop offset="0" stopColor="#E8EEF7" stopOpacity={1} />
            <SvgStop offset="1" stopColor="#DDE7F4" stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="route" x1="0" y1="0" x2="1" y2="0">
            <SvgStop offset="0" stopColor={Colors.primary} stopOpacity={1} />
            <SvgStop offset="1" stopColor={Colors.primaryLight} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill="url(#mapBg)" />

        <G opacity={0.5}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Line
              key={`vline-${i}`}
              x1={(i + 1) * (W / 10)}
              y1={0}
              x2={(i + 1) * (W / 10)}
              y2={H}
              stroke="#FFFFFF"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <Line
              key={`hline-${i}`}
              x1={0}
              y1={(i + 1) * (H / 7)}
              x2={W}
              y2={(i + 1) * (H / 7)}
              stroke="#FFFFFF"
              strokeWidth={1}
            />
          ))}
        </G>

        <G opacity={0.45}>
          <Path
            d={`M0 ${H * 0.78} C ${W * 0.25} ${H * 0.62}, ${W * 0.55} ${H *
              0.92}, ${W} ${H * 0.7}`}
            stroke="#C7D2FE"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M${W * 0.1} 0 C ${W * 0.18} ${H * 0.3}, ${W * 0.04} ${H *
              0.55}, ${W * 0.2} ${H * 0.95}`}
            stroke="#DBEAFE"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
        </G>

        <G opacity={0.18}>
          <Path
            d={`M${W * 0.55} ${H * 0.15} q ${W * 0.18} ${-H * 0.05}, ${W *
              0.22} ${H * 0.18} l ${-W * 0.1} ${H * 0.12} z`}
            fill="#A8D5BA"
          />
          <Path
            d={`M${W * 0.05} ${H * 0.55} q ${W * 0.12} ${-H * 0.18}, ${W *
              0.18} ${H * 0.04} l ${-W * 0.06} ${H * 0.18} z`}
            fill="#A8D5BA"
          />
        </G>

        {routePath ? (
          <>
            <Path
              d={routePath}
              stroke={Colors.primaryFixedDim}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.5}
            />
            <Path
              d={routePath}
              stroke="url(#route)"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}

        {projectedStops.map((s, i) => {
          const isStart = s.type === 'start';
          const isEnd = s.type === 'end';
          const fill = isStart
            ? Colors.primary
            : isEnd
            ? Colors.secondary
            : Colors.primaryLight;
          const radius = isStart || isEnd ? 9 : 6;
          return (
            <G key={`pin-${i}`}>
              <Circle cx={s.x} cy={s.y} r={radius + 6} fill={fill} opacity={0.18} />
              <Circle
                cx={s.x}
                cy={s.y}
                r={radius}
                fill="#FFFFFF"
                stroke={fill}
                strokeWidth={3}
              />
              <Circle cx={s.x} cy={s.y} r={radius - 4} fill={fill} />
            </G>
          );
        })}
      </Svg>

      {projectedStops.map((s, i) => {
        if (s.type === 'middle') return null;
        const align = s.x < W / 2 ? 'flex-start' : 'flex-end';
        const left = (s.x / W) * 100;
        const top = (s.y / H) * 100;
        return (
          <View
            key={`label-${i}`}
            pointerEvents="none"
            style={[
              styles.pinLabel,
              {
                left: `${Math.max(4, Math.min(left, 80))}%`,
                top: `${Math.max(4, Math.min(top - 14, 80))}%`,
                alignItems: align,
              },
            ]}
          >
            <View
              style={[
                styles.pinChip,
                s.type === 'end' && { backgroundColor: Colors.secondary },
              ]}
            >
              <Ionicons
                name={s.type === 'start' ? 'flag' : 'location'}
                size={11}
                color="#FFFFFF"
              />
              <Text style={styles.pinChipText} numberOfLines={1}>
                {s.label}
              </Text>
            </View>
          </View>
        );
      })}

      {showZoomControls ? (
        <View style={styles.zoomBox}>
          <Pressable style={styles.zoomBtn} onPress={onZoomIn}>
            <Ionicons name="add" size={16} color={Colors.primary} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable style={styles.zoomBtn} onPress={onZoomOut}>
            <Ionicons name="remove" size={16} color={Colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.attribution}>
        <Ionicons name="map" size={11} color={Colors.textLight} />
        <Text style={styles.attributionText}>Map preview</Text>
      </View>
    </View>
  );
};

interface ProjectedStop extends MapStop {
  x: number;
  y: number;
}

const projectStopsToCanvas = (
  stops: MapStop[],
  W: number,
  H: number
): ProjectedStop[] => {
  if (!stops.length) return [];

  const padX = 32;
  const padTop = 36;
  const padBottom = 36;

  const lats = stops.map((s) => s.lat).filter((v): v is number => typeof v === 'number');
  const lngs = stops.map((s) => s.lng).filter((v): v is number => typeof v === 'number');
  const useGeo = lats.length === stops.length && lngs.length === stops.length;

  if (useGeo) {
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const dLat = maxLat - minLat || 1;
    const dLng = maxLng - minLng || 1;
    return stops.map((s) => ({
      ...s,
      x: padX + ((s.lng! - minLng) / dLng) * (W - padX * 2),
      y: padTop + ((maxLat - s.lat!) / dLat) * (H - padTop - padBottom),
    }));
  }

  if (stops.length === 1) {
    return [{ ...stops[0], x: W / 2, y: H / 2 }];
  }

  return stops.map((s, i) => {
    const t = i / (stops.length - 1);
    const x = padX + t * (W - padX * 2);
    const baseY = padTop + (H - padTop - padBottom) * 0.45;
    const wave = Math.sin(t * Math.PI) * (H - padTop - padBottom) * 0.18;
    const y = baseY - wave;
    return { ...s, x, y };
  });
};

const buildSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx1 = p0.x + (p1.x - p0.x) / 2;
    const cy1 = p0.y;
    const cx2 = p0.x + (p1.x - p0.x) / 2;
    const cy2 = p1.y;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#E8EEF7',
    position: 'relative',
    ...Shadows.subtle,
  },
  pinLabel: {
    position: 'absolute',
    maxWidth: '60%',
  },
  pinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    ...Shadows.subtle,
  },
  pinChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    maxWidth: 140,
  },
  zoomBox: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  zoomBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: { height: 1, backgroundColor: Colors.borderLight },
  attribution: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  attributionText: {
    fontSize: 9,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
  },
});
