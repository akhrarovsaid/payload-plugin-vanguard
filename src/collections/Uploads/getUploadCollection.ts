import type { CollectionConfig } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

import { defaultUploadSlug } from '../../collections/shared.js'

export const getUploadCollection = ({
  pluginConfig,
}: {
  pluginConfig: VanguardPluginConfig
}): CollectionConfig => {
  const { debug, overrideUploadCollection } = pluginConfig

  const collection: CollectionConfig = {
    slug: defaultUploadSlug,
    access: {
      create: () => Boolean(debug),
      delete: () => Boolean(debug),
      update: () => Boolean(debug),
    },
    admin: {
      hidden: !debug,
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
