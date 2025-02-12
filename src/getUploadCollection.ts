import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { VanguardPluginConfig } from './types.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
      staticDir: path.resolve(dirname, slug),
    },
  }

  if (typeof overrideUploadCollection === 'function') {
    return overrideUploadCollection(collection)
  }

  return collection
}
