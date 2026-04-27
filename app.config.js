/**
 * Expo app config: merges app.json and injects Google Maps API keys for native MapView.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (same key for Maps + Places in Google Cloud).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appJson = require('./app.json');

const googleKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

const { expo } = appJson;

module.exports = {
  expo: {
    ...expo,
    ios: {
      ...expo.ios,
      config: {
        ...expo.ios?.config,
        googleMapsApiKey: googleKey,
      },
    },
    android: {
      ...expo.android,
      config: {
        ...expo.android?.config,
        googleMaps: {
          ...expo.android?.config?.googleMaps,
          apiKey: googleKey,
        },
      },
    },
  },
};
