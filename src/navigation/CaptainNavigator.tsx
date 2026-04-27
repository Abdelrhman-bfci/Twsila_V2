import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { BottomTabBar } from '@shared/components';

import { MarketplaceScreen } from '@features/captain/presentation/screens/MarketplaceScreen';
import { SubmitBidScreen } from '@features/captain/presentation/screens/SubmitBidScreen';
import { MyBidsScreen } from '@features/captain/presentation/screens/MyBidsScreen';
import { TripDetailsScreen } from '@features/trips/presentation/screens/TripDetailsScreen';
import { ProfileScreen } from '@features/profile/presentation/screens/ProfileScreen';

import {
  CaptainBidsStackParamList,
  CaptainMarketplaceStackParamList,
  CaptainTabParamList,
} from './types';

const MarketStack = createNativeStackNavigator<CaptainMarketplaceStackParamList>();
const MarketNavigator: React.FC = () => (
  <MarketStack.Navigator screenOptions={{ headerShown: false }}>
    <MarketStack.Screen name="Marketplace" component={MarketplaceScreen} />
    <MarketStack.Screen name="TripDetails" component={TripDetailsScreen as any} />
    <MarketStack.Screen name="SubmitBid" component={SubmitBidScreen} />
  </MarketStack.Navigator>
);

const BidsStack = createNativeStackNavigator<CaptainBidsStackParamList>();
const BidsNavigator: React.FC = () => (
  <BidsStack.Navigator screenOptions={{ headerShown: false }}>
    <BidsStack.Screen name="MyBids" component={MyBidsScreen} />
    <BidsStack.Screen name="TripDetails" component={TripDetailsScreen as any} />
  </BidsStack.Navigator>
);

const Tabs = createBottomTabNavigator<CaptainTabParamList>();

export const CaptainNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen
        name="MarketplaceTab"
        component={MarketNavigator}
        options={{ title: t('nav.marketplace') }}
      />
      <Tabs.Screen
        name="MyBidsTab"
        component={BidsNavigator}
        options={{ title: t('nav.bids') }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('nav.profile') }}
      />
    </Tabs.Navigator>
  );
};
