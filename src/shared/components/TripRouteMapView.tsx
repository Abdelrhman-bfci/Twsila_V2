import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors, FontFamily, BorderRadius } from '@core/theme';
import { hasGoogleMapsConfig } from '@core/services/googleMapsApi';
import { MapPreview, MapStop } from './MapPreview';

export interface RouteMapPoint {
  lat?: number;
  lng?: number;
  type: 'start' | 'middle' | 'end';
  label: string;
}

interface TripRouteMapViewProps {
  points: RouteMapPoint[];
  height?: number;
  /** Only used in fallback (SVG) preview. */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: 36.7538,
  longitude: 3.0588,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const pinColor = (t: RouteMapPoint['type']): string => {
  if (t === 'start') return Colors.primary;
  if (t === 'end') return Colors.secondary;
  return Colors.primaryLight;
};

export const TripRouteMapView: React.FC<TripRouteMapViewProps> = ({
  points,
  height = 220,
  onZoomIn,
  onZoomOut,
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const coords = points.filter(
    (p) =>
      typeof p.lat === 'number' &&
      typeof p.lng === 'number' &&
      !Number.isNaN(p.lat) &&
      !Number.isNaN(p.lng) &&
      p.lat !== 0 &&
      p.lng !== 0
  );

  const useFallback =
    Platform.OS === 'web' ||
    !hasGoogleMapsConfig() ||
    coords.length < 1;

  useEffect(() => {
    if (useFallback || !mapRef.current || coords.length < 1) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        coords.map((c) => ({ latitude: c.lat, longitude: c.lng })),
        {
          edgePadding: { top: 50, right: 40, bottom: 50, left: 40 },
          animated: true,
        }
      );
    }, 400);
    return () => clearTimeout(t);
  }, [coords, useFallback, points]);

  if (useFallback) {
    const mapStops: MapStop[] = points.map((p) => ({
      type: p.type,
      label: p.label,
      lat: p.lat,
      lng: p.lng,
    }));
    return (
      <View style={{ height, borderRadius: BorderRadius.lg, overflow: 'hidden' }}>
        <MapPreview
          stops={mapStops}
          height={height}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
        {!hasGoogleMapsConfig() && (
          <View style={styles.fallbackNote}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textLight} />
            <Text style={styles.fallbackText}>{t('maps.previewModeNote')}</Text>
          </View>
        )}
      </View>
    );
  }

  const line = coords.map((c) => ({ latitude: c.lat, longitude: c.lng }));

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        mapType="standard"
        showsUserLocation={false}
      >
        {line.length >= 2 ? (
          <Polyline
            coordinates={line}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        ) : null}
        {coords.map((p, i) => (
          <Marker
            key={`${p.lat}-${p.lng}-${i}`}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.label}
            {...(Platform.OS === 'ios' ? { pinColor: pinColor(p.type) } : {})}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#E8E4F5',
  },
  fallbackNote: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: BorderRadius.sm,
  },
  fallbackText: { fontSize: 11, color: Colors.textLight, fontFamily: FontFamily.medium },
});
