import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import { Colors } from '@core/theme';
import { UserRole } from '@core/constants';

import { useAuth } from '@features/auth/presentation/context/AuthContext';
import { SplashView } from '@shared/components/SplashView';
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
    return <SplashView />;
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
