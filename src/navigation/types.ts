import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type PassengerTabParamList = {
  ExploreTab: NavigatorScreenParams<PassengerExploreStackParamList>;
  MyTripsTab: NavigatorScreenParams<PassengerMyTripsStackParamList>;
  ProfileTab: undefined;
};

export type PassengerExploreStackParamList = {
  Search: undefined;
  SearchResults: { startQuery?: string; endQuery?: string };
  CreateTrip: { startQuery?: string; endQuery?: string };
  TripDetails: { tripId: string };
  Attendance: { tripId: string };
  Pricing: { tripId: string };
  Offers: { tripId: string };
};

export type PassengerMyTripsStackParamList = {
  MyTrips: undefined;
  TripDetails: { tripId: string };
  Attendance: { tripId: string };
  Pricing: { tripId: string };
  Offers: { tripId: string };
};

export type CaptainTabParamList = {
  MarketplaceTab: NavigatorScreenParams<CaptainMarketplaceStackParamList>;
  MyBidsTab: NavigatorScreenParams<CaptainBidsStackParamList>;
  ProfileTab: undefined;
};

export type CaptainMarketplaceStackParamList = {
  Marketplace: undefined;
  TripDetails: { tripId: string };
  SubmitBid: { tripId: string };
};

export type CaptainBidsStackParamList = {
  MyBids: undefined;
  TripDetails: { tripId: string };
};
