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
  generateFilename?: GenerateFilenameFn
  payload: BasePayload
}

export async function getTempFileInfos({
  generateFilename = defaultGenerateFilename,
  payload,
}: Args): Promise<TempFileInfos> {
  const dbName = getDBName({ payload })
  const timestamp = getUTCTimestamp()

  const archiveFileName = await generateFilename({ dbName, extension: 'gz', payload, timestamp })
  const archiveFilePath = path.join(os.tmpdir(), archiveFileName)

  const logsFileName = await generateFilename({ dbName, extension: 'log', payload, timestamp })
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
  timestamp,
}: GenerateFilenameFnArgs): string {
  return `${dbName}_${timestamp}.${extension}`
}
