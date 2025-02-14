import type { CollectionConfig } from 'payload'

import type { VanguardPluginConfig } from './types.js'

export const getUploadCollection = ({
  pluginConfig,
}: {
  pluginConfig: VanguardPluginConfig
}): CollectionConfig => {
  const { overrideUploadCollection } = pluginConfig

  const slug = 'vanguard-files'

  const collection: CollectionConfig = {
    slug,
    access: {
      create: () => false,
    },
    admin: {
      hidden: true,
    },
    disableDuplicate: true,
    fields: [],
    upload: {
      bulkUpload: false,
      crop: false,
      pasteURL: false,
    },
  }

  if (typeof overrideUploadCollection === 'function') {
    return overrideUploadCollection({ collection })
  }

  return collection
}
