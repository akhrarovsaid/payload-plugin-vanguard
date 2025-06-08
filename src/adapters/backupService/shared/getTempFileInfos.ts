import type { BasePayload } from 'payload'

import os from 'os'
import path from 'path'

import type {
  GenerateFilenameFn,
  GenerateFilenameFnArgs,
  TempFileInfo,
  TempFileInfos,
} from '../types.js'

import { getDBName } from '../../../utilities/getDBName.js'
import { getUTCTimestamp } from '../../../utilities/getUTCTimestamp.js'

type Args = {
  extensions?: {
    archive?: string
    logs?: string
  }
  generateFilename?: GenerateFilenameFn
  operation: 'backup' | 'restore'
  payload: BasePayload
}

export async function getTempFileInfos({
  extensions = { archive: 'gz', logs: 'log' },
  generateFilename = defaultGenerateFilename,
  operation,
  payload,
}: Args): Promise<TempFileInfos> {
  const dbName = getDBName({ payload })
  const timestamp = getUTCTimestamp()

  const archiveFileName = await generateFilename({
    dbName,
    extension: extensions.archive ?? 'gz',
    operation,
    payload,
    timestamp,
  })
  const archiveFilePath = path.join(os.tmpdir(), archiveFileName)

  const logsFileName = await generateFilename({
    dbName,
    extension: extensions.logs ?? 'log',
    operation,
    payload,
    timestamp,
  })
  const logsFilePath = path.join(os.tmpdir(), logsFileName)

  const archive: TempFileInfo = {
    filename: archiveFileName,
    path: archiveFilePath,
  }

  const logs: TempFileInfo = {
    filename: logsFileName,
    path: logsFilePath,
  }

  return {
    archive,
    logs,
  }
}

export function defaultGenerateFilename({
  dbName,
  extension,
  operation,
  timestamp,
}: GenerateFilenameFnArgs): string {
  return `${operation}_${dbName}_${timestamp}.${extension}`
}
