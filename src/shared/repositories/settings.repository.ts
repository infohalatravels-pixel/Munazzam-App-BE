import { supabase } from '../../database/supabase.js';
import type { DbSetting } from '../../database/types.js';
import { AppError } from '../../shared/errors/index.js';
import type { OfficeLocation } from '../../types/office.types.js';

const DEFAULT_OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    id: 'qatar-doha',
    name: 'Doha Office, Qatar',
    latitude: 25.2854,
    longitude: 51.531,
    radiusMeters: 500,
  },
  {
    id: 'pakistan-lahore',
    name: 'Lahore Office, Pakistan',
    latitude: 31.5015,
    longitude: 74.244,
    radiusMeters: 1000,
  },
];

function parseOfficeLocations(raw: unknown): OfficeLocation[] {
  if (!Array.isArray(raw)) return DEFAULT_OFFICE_LOCATIONS;

  const offices = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const office = item as Record<string, unknown>;
      const latitude = Number(office.latitude);
      const longitude = Number(office.longitude);
      const radiusMeters = Number(office.radiusMeters);
      const id = String(office.id ?? '').trim();
      const name = String(office.name ?? '').trim();

      if (!id || !name || Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(radiusMeters)) {
        return null;
      }

      return { id, name, latitude, longitude, radiusMeters };
    })
    .filter((office): office is OfficeLocation => office !== null);

  return offices.length ? offices : DEFAULT_OFFICE_LOCATIONS;
}

export class SettingsRepository {
  async findByKey(key: string): Promise<DbSetting | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError(`Failed to fetch setting: ${key}`, 500, 'DATABASE_ERROR', error);
    }

    return data;
  }

  async getOfficeConfig(): Promise<{
    officeLat: number;
    officeLng: number;
    officeRadiusMeters: number;
    lateThresholdMinutes: number;
    workStartTime: string;
    workEndTime: string;
  }> {
    const keys = [
      'office_lat',
      'office_lng',
      'office_radius_meters',
      'late_threshold_minutes',
      'work_start_time',
      'work_end_time',
    ];

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys)
      .is('deleted_at', null);

    if (error) {
      throw new AppError('Failed to fetch office settings', 500, 'DATABASE_ERROR', error);
    }

    const map = new Map((data ?? []).map((row) => [row.key, row.value]));

    return {
      officeLat: Number(map.get('office_lat') ?? 25.2854),
      officeLng: Number(map.get('office_lng') ?? 51.5310),
      officeRadiusMeters: Number(map.get('office_radius_meters') ?? 200),
      lateThresholdMinutes: Number(map.get('late_threshold_minutes') ?? 15),
      workStartTime: String(map.get('work_start_time') ?? '08:00').replace(/"/g, ''),
      workEndTime: String(map.get('work_end_time') ?? '17:00').replace(/"/g, ''),
    };
  }

  async getOfficeLocations(): Promise<OfficeLocation[]> {
    const setting = await this.findByKey('office_locations');
    if (!setting) {
      const legacy = await this.getOfficeConfig();
      const companySetting = await this.findByKey('company_name');
      const companyName = String(companySetting?.value ?? 'Nasaq Office').replace(/"/g, '');

      return [
        {
          id: 'legacy-office',
          name: companyName,
          latitude: legacy.officeLat,
          longitude: legacy.officeLng,
          radiusMeters: legacy.officeRadiusMeters,
        },
      ];
    }

    return parseOfficeLocations(setting.value);
  }
}

export const settingsRepository = new SettingsRepository();
