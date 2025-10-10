import type { WriteStream } from 'fs'

import { createWriteStream } from 'fs'

import type { MultipartStorageAdapter } from '../types.js'

import { VanguardPluginError } from '../../../errors/VanguardPluginError.js'
import { AdapterNames } from '../shared/adapterNames.js'

export type LocalMultipartAdapter = {
  _filePath: string
  _stream: null | WriteStream
} & MultipartStorageAdapter

export const localAdapter: LocalMultipartAdapter = {
  name: AdapterNames.LOCAL,

  _filePath: '',
  _stream: null,

  abort(): void {
    if (this._stream) {
      this._stream.destroy()
    }
    this._stream = null
    this._filePath = ''
  },

  chunk(buffer: Buffer) {
    if (!this._stream) {
      throw new VanguardPluginError({
        message: 'Multipart adapter not initialized. Call init() first.',
      })
    }
    this._stream.write(buffer)
  },

  async complete(): Promise<string> {
    if (!this._stream) {
      throw new VanguardPluginError({
        message: 'Multipart adapter not initialized. Call init() first.',
      })
    }

    await new Promise<void>((resolve, reject) => {
      this._stream?.on('error', reject)
      this._stream?.end(() => resolve())
    })

    const completedPath = this._filePath

    this._stream = null
    this._filePath = ''

    return completedPath
  },

  init(filePath: string): void {
    this._filePath = filePath
    this._stream = createWriteStream(this._filePath)
  },
}
