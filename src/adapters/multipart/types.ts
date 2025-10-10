import type { JsonObject, PayloadRequest } from 'payload'

import type { AdapterType } from './shared/adapterNames.js'

export type MultipartStorageAdapter<T = JsonObject> = {
  abort(): Promise<void> | void
  chunk(buffer: Buffer): Promise<void> | void
  complete(): Promise<string>
  init(filePath: string, options?: T): Promise<void> | void
  name: AdapterType
}

export type MultipartStorageAdapterFactory = (
  req: PayloadRequest,
  collectionSlug: string,
) => MultipartStorageAdapter
