const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function isWithinRadius(
  userLat: number,
  userLon: number,
  officeLat: number,
  officeLon: number,
  radiusMeters: number,
): boolean {
  return calculateDistanceMeters(userLat, userLon, officeLat, officeLon) <= radiusMeters;
}

export function findMatchingOffice(
  userLat: number,
  userLon: number,
  offices: Array<{ latitude: number; longitude: number; radiusMeters: number }>,
): { index: number; distanceMeters: number } | null {
  for (let index = 0; index < offices.length; index++) {
    const office = offices[index];
    const distanceMeters = calculateDistanceMeters(
      userLat,
      userLon,
      office.latitude,
      office.longitude,
    );
    if (distanceMeters <= office.radiusMeters) {
      return { index, distanceMeters };
    }
  }
  return null;
}

export function findNearestOffice(
  userLat: number,
  userLon: number,
  offices: Array<{ latitude: number; longitude: number; radiusMeters: number }>,
): { index: number; distanceMeters: number; isWithinRadius: boolean } {
  if (!offices.length) {
    throw new Error('At least one office location is required');
  }

  let nearestIndex = 0;
  let nearestDistance = calculateDistanceMeters(
    userLat,
    userLon,
    offices[0].latitude,
    offices[0].longitude,
  );

  for (let index = 1; index < offices.length; index++) {
    const distanceMeters = calculateDistanceMeters(
      userLat,
      userLon,
      offices[index].latitude,
      offices[index].longitude,
    );
    if (distanceMeters < nearestDistance) {
      nearestDistance = distanceMeters;
      nearestIndex = index;
    }
  }

  return {
    index: nearestIndex,
    distanceMeters: nearestDistance,
    isWithinRadius: nearestDistance <= offices[nearestIndex].radiusMeters,
  };
}
