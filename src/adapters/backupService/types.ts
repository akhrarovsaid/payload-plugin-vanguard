import type { BasePayload, JsonObject, PayloadRequest, TypeWithID } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'

export type OperationContextArgs<
  ContextType = unknown,
  OperationArgs = unknown,
  OperationResult = unknown,
> = {
  runOperation: (args: OperationArgs) => Promise<OperationResult>
} & ContextType

export type BackupAdapterArgs = {
  backupSlug: string
  pluginConfig: VanguardPluginConfig
  req: PayloadRequest
  uploadSlug: string
}
export type BackupOperationArgs = {
  connectionString: string
  dbName: string
  tempFileInfos: TempFileInfos
} & BackupAdapterArgs
export type BackupOperationContextArgs = OperationContextArgs<
  BackupAdapterArgs,
  BackupOperationArgs,
  Buffer
>

export type RestoreAdapterArgs = { id: number | string } & BackupAdapterArgs
export type RestoreOperationArgs = {
  connectionString: string
  dbName: string
  req: PayloadRequest
  tempFileInfos: TempFileInfos
  url: string
}
export type RestoreOperationContextArgs = OperationContextArgs<
  RestoreAdapterArgs,
  RestoreOperationArgs,
  void
>

export type BackupFn = (args: BackupAdapterArgs) => Promise<JsonObject & TypeWithID>
export type RestoreFn = (args: RestoreAdapterArgs) => Promise<void>
export type BackupServiceAdapter = {
  backup: BackupFn
  restore: RestoreFn
}

export type PayloadDoc = JsonObject & TypeWithID

export type TempFileInfo = {
  filename: string
  path: string
}
export type TempFileInfos = {
  archive: TempFileInfo
  logs: TempFileInfo
}

export type GenerateFilenameFnArgs = {
  dbName: string
  extension: string
  payload: BasePayload
  timestamp: string
}
export type GenerateFilenameFn = (args: GenerateFilenameFnArgs) => Promise<string> | string
