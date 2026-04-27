import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BorderRadius, Colors, FontFamily, Shadows, Spacing } from '@core/theme';

interface CalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  initialMonth?: Date;
  minDate?: Date;
  style?: StyleProp<ViewStyle>;
  weekdayLabels?: [string, string, string, string, string, string, string];
  monthLabel?: (d: Date) => string;
  highlightWeekdays?: number[];
}

const DEFAULT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const monthLabelDefault = (d: Date) =>
  d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

interface CalendarCell {
  date: Date;
  inMonth: boolean;
  iso: string;
}

const buildMonthGrid = (anchor: Date): CalendarCell[] => {
  const first = startOfMonth(anchor);
  const startDow = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startDow);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === anchor.getMonth(),
      iso: toIso(d),
    });
  }
  return cells;
};

export const Calendar: React.FC<CalendarProps> = ({
  selectedDates,
  onChange,
  initialMonth,
  minDate,
  style,
  weekdayLabels = DEFAULT_WEEKDAYS as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ],
  monthLabel = monthLabelDefault,
  highlightWeekdays,
}) => {
  const [anchor, setAnchor] = useState<Date>(
    initialMonth ? startOfMonth(initialMonth) : startOfMonth(new Date())
  );

  const cells = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const today = new Date();
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const goPrev = () => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };
  const goNext = () => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };

  const toggle = (iso: string, date: Date) => {
    if (minDate && date < startOfDay(minDate)) return;
    const next = new Set(selectedSet);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    onChange(Array.from(next).sort());
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.header}>
        <Pressable
          onPress={goPrev}
          hitSlop={8}
          style={styles.chevronBtn}
        >
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color={Colors.primary}
          />
        </Pressable>
        <Text style={styles.monthText}>{monthLabel(anchor)}</Text>
        <Pressable
          onPress={goNext}
          hitSlop={8}
          style={styles.chevronBtn}
        >
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={Colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekdayLabels.map((d, i) => {
          const isHi = highlightWeekdays?.includes(i);
          return (
            <Text
              key={`wd-${i}`}
              style={[styles.weekday, isHi && styles.weekdayHi]}
            >
              {d}
            </Text>
          );
        })}
      </View>

      <View style={styles.grid}>
        {cells.map((c) => {
          const isToday = sameDay(c.date, today);
          const isSelected = selectedSet.has(c.iso);
          const isDisabled = !!minDate && c.date < startOfDay(minDate);
          return (
            <Pressable
              key={c.iso}
              onPress={() => toggle(c.iso, c.date)}
              disabled={isDisabled}
              style={({ pressed }) => [
                styles.cell,
                pressed && !isDisabled && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillSelected,
                  isToday && !isSelected && styles.dayPillToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !c.inMonth && styles.dayTextOut,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                    isDisabled && { opacity: 0.35 },
                  ]}
                >
                  {c.date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const CELL_SIZE = 38;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  monthText: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textLight,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekdayHi: { color: Colors.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPill: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: Colors.primary,
    ...Shadows.subtle,
  },
  dayPillToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: FontFamily.semiBold,
  },
  dayTextOut: { color: Colors.textLight, opacity: 0.4 },
  dayTextSelected: { color: Colors.onPrimary },
  dayTextToday: { color: Colors.primary },
});
