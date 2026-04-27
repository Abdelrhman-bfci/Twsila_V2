/**
 * Google Maps Platform REST: Places Autocomplete, Place Details, Geocoding.
 * Enable in Google Cloud: Places API, Geocoding API, Maps SDK (native).
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env
 */

export interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface ResolvedPlace {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

const getKey = (): string | undefined => process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export const hasGoogleMapsConfig = (): boolean => !!getKey()?.length;

export async function fetchPlaceAutocomplete(
  input: string
): Promise<AutocompletePrediction[]> {
  const key = getKey();
  if (!key || input.trim().length < 2) return [];

  const params = new URLSearchParams({
    input: input.trim(),
    key,
    language: 'en',
  });
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;

  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    predictions?: AutocompletePrediction[];
  };

  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') return [];
  return json.predictions ?? [];
}

export async function fetchPlaceDetails(
  placeId: string
): Promise<ResolvedPlace | null> {
  const key = getKey();
  if (!key) return null;

  const fields = 'geometry/location,formatted_address,name';
  const params = new URLSearchParams({
    place_id: placeId,
    fields,
    key,
  });
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;

  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: { lat: number; lng: number } };
    };
  };

  if (json.status !== 'OK' || !json.result?.geometry?.location) return null;
  const loc = json.result.geometry.location;
  return {
    placeId,
    address:
      json.result.formatted_address ||
      json.result.name ||
      placeId,
    lat: loc.lat,
    lng: loc.lng,
  };
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const key = getKey();
  if (!key || !address.trim()) return null;

  const params = new URLSearchParams({
    address: address.trim(),
    key,
  });
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

  const res = await fetch(url);
  const json = (await res.json()) as {
    status: string;
    results?: { geometry: { location: { lat: number; lng: number } } }[];
  };

  if (json.status !== 'OK' || !json.results?.[0]) return null;
  const loc = json.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}
