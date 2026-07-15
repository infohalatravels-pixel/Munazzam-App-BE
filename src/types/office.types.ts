export interface OfficeLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface OfficeMatch {
  office: OfficeLocation;
  distanceMeters: number;
  isWithinRadius: boolean;
}
