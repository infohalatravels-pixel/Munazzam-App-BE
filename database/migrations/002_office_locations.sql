-- Multi-office attendance zones: Qatar + Pakistan
INSERT INTO settings (key, value)
VALUES (
  'office_locations',
  '[
    {
      "id": "qatar-doha",
      "name": "Doha Office, Qatar",
      "latitude": 25.2854,
      "longitude": 51.5310,
      "radiusMeters": 500
    },
    {
      "id": "pakistan-lahore",
      "name": "Lahore Office, Pakistan",
      "latitude": 31.5015,
      "longitude": 74.2440,
      "radiusMeters": 1000
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
