import type { CollectionConfig } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

export const getUploadCollection = ({
  pluginConfig,
}: {
  pluginConfig: VanguardPluginConfig
}): CollectionConfig => {
  const { overrideUploadCollection } = pluginConfig

  const collection: CollectionConfig = {
    slug: 'vanguard-files',
    access: {
      create: () => false,
    },
    admin: {
      hidden: !pluginConfig.debug,
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
