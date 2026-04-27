import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { BottomTabBar } from '@shared/components';

import { SearchScreen } from '@features/trips/presentation/screens/SearchScreen';
import { SearchResultsScreen } from '@features/trips/presentation/screens/SearchResultsScreen';
import { CreateTripScreen } from '@features/trips/presentation/screens/CreateTripScreen';
import { TripDetailsScreen } from '@features/trips/presentation/screens/TripDetailsScreen';
import { AttendanceScreen } from '@features/trips/presentation/screens/AttendanceScreen';
import { PricingScreen } from '@features/trips/presentation/screens/PricingScreen';
import { OffersScreen } from '@features/offers/presentation/screens/OffersScreen';
import { MyTripsScreen } from '@features/trips/presentation/screens/MyTripsScreen';
import { ProfileScreen } from '@features/profile/presentation/screens/ProfileScreen';

import {
  PassengerExploreStackParamList,
  PassengerMyTripsStackParamList,
  PassengerTabParamList,
} from './types';

const ExploreStack = createNativeStackNavigator<PassengerExploreStackParamList>();
const ExploreNavigator: React.FC = () => (
  <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
    <ExploreStack.Screen name="Search" component={SearchScreen} />
    <ExploreStack.Screen name="SearchResults" component={SearchResultsScreen} />
    <ExploreStack.Screen name="CreateTrip" component={CreateTripScreen} />
    <ExploreStack.Screen name="TripDetails" component={TripDetailsScreen} />
    <ExploreStack.Screen name="Attendance" component={AttendanceScreen} />
    <ExploreStack.Screen name="Pricing" component={PricingScreen} />
    <ExploreStack.Screen name="Offers" component={OffersScreen} />
  </ExploreStack.Navigator>
);

const MyTripsStack = createNativeStackNavigator<PassengerMyTripsStackParamList>();
const MyTripsNavigator: React.FC = () => (
  <MyTripsStack.Navigator screenOptions={{ headerShown: false }}>
    <MyTripsStack.Screen name="MyTrips" component={MyTripsScreen} />
    <MyTripsStack.Screen name="TripDetails" component={TripDetailsScreen as any} />
    <MyTripsStack.Screen name="Attendance" component={AttendanceScreen as any} />
    <MyTripsStack.Screen name="Pricing" component={PricingScreen as any} />
    <MyTripsStack.Screen name="Offers" component={OffersScreen as any} />
  </MyTripsStack.Navigator>
);

const Tabs = createBottomTabNavigator<PassengerTabParamList>();

export const PassengerNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen
        name="ExploreTab"
        component={ExploreNavigator}
        options={{ title: t('nav.explore') }}
      />
      <Tabs.Screen
        name="MyTripsTab"
        component={MyTripsNavigator}
        options={{ title: t('nav.myTrips') }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('nav.profile') }}
      />
    </Tabs.Navigator>
  );
};
