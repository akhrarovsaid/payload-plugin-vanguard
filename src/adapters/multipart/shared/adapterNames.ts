export const AdapterNames = {
  GCS: 'gcs',
  LOCAL: 'local',
} as const

export type AdapterType = (typeof AdapterNames)[keyof typeof AdapterNames]
