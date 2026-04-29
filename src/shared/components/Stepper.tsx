import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, Spacing } from '@core/theme';

export interface StepperStep {
  key: string;
  title: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** 0-indexed current step. */
  currentIndex: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentIndex }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const completed = idx < currentIndex;
        const active = idx === currentIndex;
        const upcoming = idx > currentIndex;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepBlock}>
              <View
                style={[
                  styles.dot,
                  completed && styles.dotCompleted,
                  active && styles.dotActive,
                  upcoming && styles.dotUpcoming,
                ]}
              >
                {completed ? (
                  <Ionicons name="checkmark" size={12} color={Colors.onPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      active && styles.dotTextActive,
                      upcoming && styles.dotTextUpcoming,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  upcoming && styles.labelUpcoming,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>

            {idx < steps.length - 1 ? (
              <View
                style={[
                  styles.connector,
                  completed && styles.connectorCompleted,
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  stepBlock: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  dotUpcoming: {
    backgroundColor: Colors.surfaceLowest,
    borderColor: Colors.borderLight,
  },
  dotText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  dotTextActive: { color: Colors.primary },
  dotTextUpcoming: { color: Colors.textLight },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.textLight,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    maxWidth: 80,
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  labelUpcoming: { color: Colors.textLight },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 18,
    borderRadius: 1,
  },
  connectorCompleted: {
    backgroundColor: Colors.primary,
  },
});
