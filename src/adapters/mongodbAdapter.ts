import type { BasePayload } from 'payload'
import type { PayloadDoc } from 'src/types.js'

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type { BackupAdapterArgs, BackupServiceAdapter, RestoreAdapterArgs } from './types.js'

import { BackupStatus } from '../utilities/backupStatus.js'
import { cleanupTempFiles } from '../utilities/cleanupTempFiles.js'
import { getConnectionString } from '../utilities/getConnectionString.js'
import { getDBName } from '../utilities/getDBName.js'
import { getUTCTimestamp } from '../utilities/getUTCTimestamp.js'
import { uploadLogs } from '../utilities/uploadLogs.js'

function runMongodump({
  backupSlug,
  connectionString,
  dbName,
  logFilePath,
  payload,
  tmpFilePath,
  uploadSlug,
}: {
  backupSlug: string
  connectionString: string
  dbName: string
  logFilePath: string
  payload: BasePayload
  tmpFilePath: string
  uploadSlug: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archiveStream = fs.createWriteStream(tmpFilePath)
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' })

    const dumpProcess = spawn('mongodump', [
      `--uri=${connectionString}`,
      `--db=${dbName}`,
      '--archive',
      '--gzip',
      `--excludeCollection=${backupSlug}`,
      `--excludeCollection=${uploadSlug}`,
    ])

    dumpProcess.stdout.pipe(archiveStream)
    dumpProcess.stderr.pipe(logStream)

    dumpProcess.on('error', (err) => {
      payload.logger.error(err)
      logStream.end()
      reject(err)
    })

    dumpProcess.on('close', async (code) => {
      logStream.end()

      if (code !== 0) {
        const err = new Error(`mongodump exited with code ${code}`)
        payload.logger.error(err)
        return reject(err)
      }

      try {
        const fileBuffer = await fs.promises.readFile(tmpFilePath)
        resolve(fileBuffer)
      } catch (_err) {
        const err = _err as Error
        payload.logger.error(err)
        reject(err)
      }
    })
  })
}

export async function mongodbBackup({ backupSlug, req, uploadSlug }: BackupAdapterArgs) {
  const payload = req.payload
  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })

  const fileNameWithoutExtension = `${getDBName({ payload })}_${getUTCTimestamp()}`
  const archiveFileName = `${fileNameWithoutExtension}.gz`
  const logFileName = `${fileNameWithoutExtension}.log`
  const tmpFilePath = path.join(os.tmpdir(), archiveFileName)
  const logFilePath = path.join(os.tmpdir(), logFileName)

  const handleBackupError = async ({
    backupDocId,
    backupLogsId,
    error,
    flushLogs,
    message,
    unlinkTempFile,
  }: {
    backupDocId?: number | string
    backupLogsId?: number | string
    error: unknown
    flushLogs?: boolean
    message: string
    unlinkTempFile?: boolean
  }) => {
    payload.logger.error(error, message)

    const hasBackupLogsAlready = typeof backupLogsId !== 'undefined'
    if (backupDocId) {
      try {
        let logsDoc: PayloadDoc | undefined = undefined
        if (flushLogs && !hasBackupLogsAlready) {
          logsDoc = await uploadLogs({
            filename: logFileName,
            path: logFilePath,
            payload,
            req,
            uploadSlug,
          })
        }

        await payload.update({
          id: backupDocId,
          collection: backupSlug,
          data: {
            backupLogs: hasBackupLogsAlready ? backupLogsId : logsDoc?.id,
            status: BackupStatus.FAILURE,
          },
          req,
        })
      } catch (_err) {
        payload.logger.error(_err)
      }
    }

    if (unlinkTempFile) {
      await cleanupTempFiles(payload, tmpFilePath, logFilePath)
    }

    throw new Error(message)
  }

  let backupDoc: PayloadDoc
  try {
    backupDoc = await payload.create({
      collection: backupSlug,
      data: {
        initiatedBy: req.user,
      },
      req,
    })
  } catch (_err) {
    throw await handleBackupError({
      error: _err,
      message: 'Backup aborted: failed to create initial doc',
    })
  }

  let fileBuffer: Buffer
  try {
    fileBuffer = await runMongodump({
      backupSlug,
      connectionString,
      dbName,
      logFilePath,
      payload,
      tmpFilePath,
      uploadSlug,
    })
  } catch (_err) {
    throw await handleBackupError({
      backupDocId: backupDoc.id,
      error: _err,
      flushLogs: true,
      message: 'Backup failed: mongodump process error',
      unlinkTempFile: true,
    })
  }

  let uploadDoc: PayloadDoc
  try {
    uploadDoc = await payload.create({
      collection: uploadSlug,
      data: {},
      file: {
        name: archiveFileName,
        data: fileBuffer,
        mimetype: 'application/gzip',
        size: fileBuffer.length,
      },
      req,
    })
  } catch (_err) {
    throw await handleBackupError({
      backupDocId: backupDoc.id,
      error: _err,
      flushLogs: true,
      message: req.t('error:problemUploadingFile'),
      unlinkTempFile: true,
    })
  }

  const logsDoc: PayloadDoc | undefined = await uploadLogs({
    filename: logFileName,
    path: logFilePath,
    payload,
    req,
    uploadSlug,
  })

  try {
    await payload.update({
      id: backupDoc.id,
      collection: backupSlug,
      data: {
        backup: uploadDoc.id,
        backupLogs: logsDoc?.id,
        completedAt: new Date().toISOString(),
        status: BackupStatus.SUCCESS,
      },
      req,
    })
  } catch (_err) {
    throw await handleBackupError({
      backupDocId: backupDoc.id,
      backupLogsId: logsDoc?.id,
      error: _err,
      flushLogs: true,
      message: 'Backup failed: update backup doc error',
      unlinkTempFile: true,
    })
  }

  await cleanupTempFiles(payload, tmpFilePath, logFilePath)

  return backupDoc
}

function runMongorestore({
  connectionString,
  dbName,
  logFilePath,
  payload,
  url,
}: {
  connectionString: string
  dbName: string
  logFilePath: string
  payload: BasePayload
  url: string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const logStream = fs.createWriteStream(logFilePath)
    const curl = spawn('curl', [`${payload.config.serverURL}${url}`])

    const restoreProcess = spawn('mongorestore', [
      `--uri=${connectionString}`,
      `--nsInclude="${dbName}.*"`,
      '--gzip',
      '--archive',
    ])

    curl.stdout.pipe(restoreProcess.stdin)

    restoreProcess.stderr.on('data', (data) => {
      logStream.write(data)
    })

    restoreProcess.on('close', (code) => {
      logStream.end()
      if (code !== 0) {
        reject(new Error(`mongorestore failed with code ${code}`))
      } else {
        resolve()
      }
    })

    restoreProcess.on('error', (err) => {
      logStream.end()
      reject(err)
    })
  })
}

export async function mongodbRestore({ id, backupSlug, req, uploadSlug }: RestoreAdapterArgs) {
  const payload = req.payload

  let backupDoc: PayloadDoc
  try {
    backupDoc = await payload.findByID({
      id,
      collection: backupSlug,
      req,
      select: {
        backup: true,
        status: true,
      },
    })
  } catch (_err) {
    const message = req.t('error:notFound')
    payload.logger.error(_err, message)
    throw new Error(message)
  }

  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })
  const url = backupDoc?.backup.url

  const fileNameWithoutExtension = `${dbName}_${getUTCTimestamp()}`
  const logFileName = `${fileNameWithoutExtension}.log`
  const logFilePath = path.join(os.tmpdir(), logFileName)

  try {
    await runMongorestore({
      connectionString,
      dbName,
      logFilePath,
      payload,
      url: `${req.origin}${url}`,
    })
  } catch (_err) {
    const err = _err as Error
    payload.logger.error(err)
    throw new Error(err.message)
  }

  let logsDoc: PayloadDoc | undefined = undefined
  try {
    const logBuffer = await fs.promises.readFile(logFilePath)

    logsDoc = await payload.create({
      collection: uploadSlug,
      data: {},
      file: {
        name: logFileName,
        data: logBuffer,
        mimetype: 'text/plain',
        size: logBuffer.length,
      },
      req,
    })
  } catch (_err) {
    payload.logger.warn(_err, `Failed to read log file: ${logFilePath}`)
  }

  try {
    await payload.update({
      id,
      collection: backupSlug,
      data: {
        restoredAt: new Date().toISOString(),
        restoredBy: req.user!.id,
        restoreLogs: logsDoc?.id,
      },
      req,
    })
  } catch (_err) {
    payload.logger.warn(_err, `Unable to update backup doc with id: ${id} after restore.`)
  }
}

export const mongodbAdapter: BackupServiceAdapter = {
  backup: mongodbBackup,
  restore: mongodbRestore,
}
