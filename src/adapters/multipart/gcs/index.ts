import type { MultipartStorageAdapter } from '../types.js'

import { VanguardPluginError } from '../../../errors/VanguardPluginError.js'
import { AdapterNames } from '../shared/adapterNames.js'

export type GCSAdapterOptions = {
  accessToken?: string
  bucket: string
  contentType?: string
  signedURL?: string
}

export type GCSMultipartAdapter = {
  _aborted: boolean
  _authHeader: string
  _bucket: string
  _offset: number
  _uploadURL: null | string
  _useSignedURL: boolean
} & MultipartStorageAdapter<GCSAdapterOptions>

export const gcsAdapter: GCSMultipartAdapter = {
  name: AdapterNames.GCS,

  _aborted: false,
  _authHeader: '',
  _bucket: '',
  _offset: 0,
  _uploadURL: null,
  _useSignedURL: false,

  /**
   * Initialize resumable upload session.
   * Supports either OAuth2 token or Signed URL pre-authenticated session.
   */
  async init(
    key: string,
    options: {
      accessToken?: string
      bucket: string
      contentType?: string
      signedURL?: string
    },
  ): Promise<void> {
    const { accessToken, bucket, contentType = 'application/octet-stream', signedURL } = options
    this._bucket = bucket
    this._aborted = false
    this._offset = 0

    // case 1: signed URL (pre-generated resumable upload URL)
    if (signedURL) {
      this._uploadURL = signedURL
      this._useSignedURL = true
      this._authHeader = ''
      return
    }

    // case 2: use OAuth 2.0 Bearer token
    if (!accessToken) {
      throw new VanguardPluginError({
        message: 'Either accessToken or signedURL must be provided for GCS adapter init().',
      })
    }

    const initRes = await fetch(
      `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=resumable&name=${encodeURIComponent(key)}`,
      {
        body: JSON.stringify({ name: key }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': contentType,
        },
        method: 'POST',
      },
    )

    if (!initRes.ok) {
      const text = await initRes.text()
      throw new VanguardPluginError({
        message: `Failed to initiate GCS upload: ${initRes.status} ${text}`,
      })
    }

    const uploadURL = initRes.headers.get('location')
    if (!uploadURL) {
      throw new VanguardPluginError({ message: 'Missing upload URL from GCS init response.' })
    }

    this._uploadURL = uploadURL
    this._authHeader = `Bearer ${accessToken}`
    this._useSignedURL = false
  },

  /**
   * Upload a chunk of data to the resumable session.
   */
  async chunk(buffer: Buffer): Promise<void> {
    if (!this._uploadURL) {
      throw new VanguardPluginError({ message: 'Adapter not initialized. Call init() first.' })
    }
    if (this._aborted) {
      return
    }

    const start = this._offset
    const end = this._offset + buffer.length - 1

    const res = await fetch(this._uploadURL, {
      body: new Uint8Array(buffer),
      headers: {
        ...(this._authHeader ? { Authorization: this._authHeader } : {}),
        'Content-Length': buffer.length.toString(),
        'Content-Range': `bytes ${start}-${end}/*`,
      },
      method: 'PUT',
    })

    // Expected responses: 308 (incomplete) or 200/201 (done)
    if (res.status !== 308 && !res.ok) {
      const text = await res.text()
      throw new VanguardPluginError({
        message: `Failed to upload chunk to GCS: ${res.status} ${text}`,
      })
    }

    this._offset += buffer.length
  },

  /**
   * Completes the resumable upload.
   */
  async complete(): Promise<string> {
    if (!this._uploadURL) {
      throw new VanguardPluginError({ message: 'Adapter not initialized. Call init() first.' })
    }

    const res = await fetch(this._uploadURL, {
      headers: {
        ...(this._authHeader ? { Authorization: this._authHeader } : {}),
        'Content-Length': '0',
        'Content-Range': `bytes */${this._offset}`,
      },
      method: 'PUT',
    })

    if (!res.ok) {
      const text = await res.text()
      throw new VanguardPluginError({
        message: `Failed to complete GCS upload: ${res.status} ${text}`,
      })
    }

    const json = await res.json()
    this._uploadURL = null
    return json.selfLink || json.mediaLink || json.id
  },

  /**
   * Abort the resumable upload session.
   * Note: GCS does not provide an API for direct session deletion.
   */
  abort(): void {
    // TODO: Handle resumable delete
    this._aborted = true
    this._uploadURL = null
    this._offset = 0
  },
}
