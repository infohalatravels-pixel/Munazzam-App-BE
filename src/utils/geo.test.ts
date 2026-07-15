import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters, findMatchingOffice, isWithinRadius } from './geo.js';

describe('geo utilities', () => {
  it('calculates zero distance for same coordinates', () => {
    expect(calculateDistanceMeters(25.2854, 51.531, 25.2854, 51.531)).toBe(0);
  });

  it('validates radius boundary', () => {
    const officeLat = 25.2854;
    const officeLng = 51.531;
    const nearLat = 25.28545;
    const nearLng = 51.53105;

    expect(isWithinRadius(nearLat, nearLng, officeLat, officeLng, 200)).toBe(true);
  });

  it('matches any configured office zone', () => {
    const offices = [
      { latitude: 25.2854, longitude: 51.531, radiusMeters: 500 },
      { latitude: 31.5015, longitude: 74.244, radiusMeters: 1000 },
    ];

    expect(findMatchingOffice(25.2854, 51.531, offices)?.index).toBe(0);
    expect(findMatchingOffice(31.5015, 74.244, offices)?.index).toBe(1);
    expect(findMatchingOffice(0, 0, offices)).toBeNull();
  });
});
