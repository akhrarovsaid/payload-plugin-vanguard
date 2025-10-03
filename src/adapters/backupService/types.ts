import type { BasePayload, JsonObject, PayloadRequest, TypeWithID } from 'payload'

import type { VanguardPluginConfig } from '../../types.js'
import type { OperationType } from '../../utilities/operationType.js'

export type OperationContextArgs<
  ContextType = unknown,
  OperationArgs = unknown,
  OperationResult = unknown,
> = {
  runOperation: (args: OperationArgs) => Promise<OperationResult>
} & ContextType

export type BaseBackupServiceAdapterArgs = {
  backupSlug: string
  operation: OperationType
  pluginConfig: VanguardPluginConfig
  req: PayloadRequest
  uploadSlug: string
}

export type BackupAdapterArgs = BaseBackupServiceAdapterArgs
export type BackupOperationArgs = {
  connectionString: string
  dbName: string
  tempFileInfos: TempFileInfos
} & BaseBackupServiceAdapterArgs
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
} & BaseBackupServiceAdapterArgs
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
  archiveFileInfo: TempFileInfo
  logsFileInfo: TempFileInfo
}

export type GenerateFilenameFnArgs = {
  dbName: string
  extension: string
  operation: 'backup' | 'restore'
  payload: BasePayload
  timestamp: string
}
export type GenerateFilenameFn = (args: GenerateFilenameFnArgs) => Promise<string> | string
