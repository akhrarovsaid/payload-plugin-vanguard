import type { PayloadRequest } from 'payload'

import type { AdapterType } from './adapterNames.js'

import { AdapterNames } from './adapterNames.js'

export function getStorageAdapterName(req: PayloadRequest, collectionSlug: string): AdapterType {
  const nameFromConfig = req.payload.collections[collectionSlug]?.config?.upload?.adapter as
    | AdapterType
    | undefined
  return nameFromConfig ?? AdapterNames.LOCAL
}
