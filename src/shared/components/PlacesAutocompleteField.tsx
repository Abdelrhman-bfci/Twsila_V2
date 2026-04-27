import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  I18nManager,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  hasGoogleMapsConfig,
  ResolvedPlace,
  AutocompletePrediction,
} from '@core/services/googleMapsApi';
import { Colors, Spacing, FontFamily, BorderRadius } from '@core/theme';
import { useTranslation } from 'react-i18next';

interface PlacesAutocompleteFieldProps {
  label?: string;
  value: string;
  onChangeAddress: (address: string) => void;
  onPlaceResolved: (place: ResolvedPlace) => void;
  /** Clear stored coordinates when user edits text (default true). */
  clearCoordsOnEdit?: boolean;
  placeholder?: string;
  onClearCoords?: () => void;
  leftIcon?: 'flag' | 'location' | 'pin';
}

const DEBOUNCE_MS = 350;

export const PlacesAutocompleteField: React.FC<PlacesAutocompleteFieldProps> = ({
  label,
  value,
  onChangeAddress,
  onPlaceResolved,
  clearCoordsOnEdit = true,
  placeholder,
  onClearCoords,
  leftIcon = 'location',
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const canSearch = hasGoogleMapsConfig();

  const runSearch = useCallback(
    async (text: string) => {
      if (!canSearch) return;
      setLoading(true);
      try {
        const list = await fetchPlaceAutocomplete(text);
        setSuggestions(list);
      } finally {
        setLoading(false);
      }
    },
    [canSearch]
  );

  useEffect(() => {
    if (!open || !canSearch) return;
    const t0 = setTimeout(() => {
      if (query.trim().length >= 2) {
        void runSearch(query);
      } else {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t0);
  }, [query, open, canSearch, runSearch]);

  const onPick = async (p: AutocompletePrediction) => {
    Keyboard.dismiss();
    setOpen(false);
    setSuggestions([]);
    setLoading(true);
    try {
      const details = await fetchPlaceDetails(p.place_id);
      if (details) {
        onChangeAddress(details.address);
        onPlaceResolved(details);
      } else {
        onChangeAddress(p.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    onChangeAddress(text);
    if (clearCoordsOnEdit) onClearCoords?.();
    if (canSearch && text.trim().length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const showHint = !canSearch;
  const iconName = useMemo(() => {
    if (leftIcon === 'flag') return 'flag-outline' as const;
    if (leftIcon === 'pin') return 'pin-outline' as const;
    return 'location-outline' as const;
  }, [leftIcon]);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {showHint ? (
        <Text style={styles.hint}>{t('maps.addApiKeyForSearch')}</Text>
      ) : null}

      <View style={styles.inputBox}>
        <Ionicons
          name={iconName}
          size={18}
          color={Colors.textLight}
          style={styles.leftIcon}
        />
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          onFocus={() => {
            if (canSearch && query.trim().length >= 2) {
              setOpen(true);
              void runSearch(query);
            }
          }}
        />
        {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
      </View>

      {open && suggestions.length > 0 ? (
        <View style={styles.list}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.flat}
          >
            {suggestions.map((item) => (
              <Pressable
                key={item.place_id}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => onPick(item)}
              >
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={Colors.primary}
                  style={styles.rowIcon}
                />
                <View style={styles.rowText}>
                  <Text style={styles.main} numberOfLines={2}>
                    {item.structured_formatting?.main_text || item.description}
                  </Text>
                  {item.structured_formatting?.secondary_text ? (
                    <Text style={styles.sub} numberOfLines={1}>
                      {item.structured_formatting.secondary_text}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={16}
                  color={Colors.textLight}
                />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: FontFamily.semiBold,
    marginBottom: 6,
  },
  hint: {
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLowest,
    paddingHorizontal: Spacing.sm,
    minHeight: 48,
  },
  leftIcon: { marginEnd: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontFamily: FontFamily.regular,
    paddingVertical: 10,
  },
  list: {
    marginTop: 4,
    maxHeight: 200,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLowest,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }
      : { elevation: 3 }),
  },
  flat: { maxHeight: 200 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  rowPressed: { backgroundColor: Colors.primarySoft },
  rowIcon: { marginTop: 2 },
  rowText: { flex: 1 },
  main: { fontSize: 14, fontFamily: FontFamily.semiBold, color: Colors.text },
  sub: { fontSize: 12, fontFamily: FontFamily.regular, color: Colors.textLight, marginTop: 2 },
});
