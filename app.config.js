/**
 * Expo app config: merges app.json and injects Google Maps API keys for native MapView.
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (same key for Maps + Places in Google Cloud).
 */
const googleKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

module.exports = ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: googleKey,
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          ...config.android?.config?.googleMaps,
          apiKey: googleKey,
        },
      },
    },
  };
};
