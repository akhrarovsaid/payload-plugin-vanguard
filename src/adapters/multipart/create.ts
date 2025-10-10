import type { AdapterType } from './shared/adapterNames.js'
import type { MultipartStorageAdapter, MultipartStorageAdapterFactory } from './types.js'

import { VanguardPluginError } from '../../errors/VanguardPluginError.js'
import { gcsAdapter } from './gcs/index.js'
import { localAdapter } from './local/index.js'
import { AdapterNames } from './shared/adapterNames.js'
import { getStorageAdapterName } from './shared/getStorageAdapterName.js'

const adapterMap: Record<AdapterType, MultipartStorageAdapter> = {
  [AdapterNames.GCS]: gcsAdapter,
  [AdapterNames.LOCAL]: localAdapter,
}

export const createMultipartAdapter: MultipartStorageAdapterFactory = (req, collectionSlug) => {
  const adapterName = getStorageAdapterName(req, collectionSlug)
  const adapter = adapterMap[adapterName]

  if (!adapter) {
    throw new VanguardPluginError({ message: `Unsupported storage adapter: ${adapterName}` })
  }

  return adapter
}
