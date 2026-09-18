// Geo & Location Utilities for Imah Kayu Jatinangor Attendance

export const RESTO_LOCATION = {
  name: 'Imah Kayu Jatinangor',
  address: 'Jl. Raya Bandung - Sumedang No.315, Hegarmanah, Jatinangor, Sumedang, Jawa Barat',
  latitude: -6.9246533,
  longitude: 107.784383,
  maxRadiusMeters: 70,
  mapsUrl: 'https://maps.app.goo.gl/ahDsZCRyezULZRj17',
};

/**
 * Calculates great-circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number = RESTO_LOCATION.latitude, lon2: number = RESTO_LOCATION.longitude): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Validates whether the given coordinate is within the permitted restaurant radius.
 */
export function isWithinRestoRadius(latitude: number, longitude: number, maxRadius: number = RESTO_LOCATION.maxRadiusMeters): {
  isWithin: boolean;
  distanceMeters: number;
} {
  const distance = calculateDistanceMeters(latitude, longitude);
  return {
    isWithin: distance <= maxRadius,
    distanceMeters: distance,
  };
}
