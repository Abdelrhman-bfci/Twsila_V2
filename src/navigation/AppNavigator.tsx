import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { Colors } from '@core/theme';
import { UserRole } from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { PassengerNavigator } from './PassengerNavigator';
import { CaptainNavigator } from './CaptainNavigator';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    primary: Colors.primary,
    text: Colors.text,
    border: Colors.borderLight,
    card: Colors.surfaceLowest,
    notification: Colors.error,
  },
};

export const AppNavigator: React.FC = () => {
  const { user, initialising } = useAuth();

  if (initialising) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthNavigator />
      ) : user.role === UserRole.Captain ? (
        <CaptainNavigator />
      ) : (
        <PassengerNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
