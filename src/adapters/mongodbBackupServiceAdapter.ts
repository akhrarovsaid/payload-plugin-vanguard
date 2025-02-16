import type { BasePayload, JsonObject, TypeWithID } from 'payload'

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import type { AdapterArgs, BackupServiceAdapter } from './backupServiceAdapter.js'

import { BackupStatus } from '../utilities/backupStatus.js'
import { getConnectionString } from '../utilities/getConnectionString.js'
import { getDBName } from '../utilities/getDBName.js'
import { getUTCTimestamp } from '../utilities/getUTCTimestamp.js'

type PayloadDoc = JsonObject & TypeWithID

function runMongodump({
  backupSlug,
  connectionString,
  dbName,
  payload,
  tmpFilePath,
  uploadSlug,
}: {
  backupSlug: string
  connectionString: string
  dbName: string
  payload: BasePayload
  tmpFilePath: string
  uploadSlug: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(tmpFilePath)
    const dumpProcess = spawn('mongodump', [
      `--uri=${connectionString}`,
      `--db=${dbName}`,
      '--archive',
      '--gzip',
      `--excludeCollection=${backupSlug}`,
      `--excludeCollection=${uploadSlug}`,
    ])

    dumpProcess.stdout.pipe(writeStream)

    dumpProcess.on('error', (err) => {
      payload.logger.error(err)
      reject(err)
    })

    dumpProcess.on('close', async (code) => {
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

export async function mongodbBackup({ backupSlug, req, uploadSlug }: AdapterArgs) {
  const payload = req.payload
  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })
  const fileName = `${getDBName({ payload })}_${getUTCTimestamp()}.gz`
  const tmpFilePath = path.join(os.tmpdir(), fileName)

  const cleanupTempFile = async () => {
    try {
      await fs.promises.unlink(tmpFilePath)
    } catch (_err) {
      const err = _err as Error
      payload.logger.warn(err, `Failed to delete temp file: ${tmpFilePath}`)
    }
  }

  const handleBackupError = async (
    error: unknown,
    message: string,
    backupDocId?: number | string,
    unlinkTempFile?: boolean,
  ) => {
    payload.logger.error(error, message)

    if (backupDocId) {
      // TODO:: Store error log
      await payload.update({
        id: backupDocId,
        collection: backupSlug,
        data: {
          status: BackupStatus.FAILURE,
        },
        req,
      })
    }

    if (unlinkTempFile) {
      await cleanupTempFile()
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
    throw await handleBackupError(_err, 'Backup aborted: failed to create initial doc')
  }

  let fileBuffer: Buffer
  try {
    fileBuffer = await runMongodump({
      backupSlug,
      connectionString,
      dbName,
      payload,
      tmpFilePath,
      uploadSlug,
    })
  } catch (_err) {
    throw await handleBackupError(
      _err,
      'Backup failed: mongodump process error',
      backupDoc.id,
      true,
    )
  }

  let uploadDoc: PayloadDoc
  try {
    uploadDoc = await payload.create({
      collection: uploadSlug,
      data: {},
      file: {
        name: fileName,
        data: fileBuffer,
        mimetype: 'application/gzip',
        size: fileBuffer.length,
      },
      req,
    })
  } catch (_err) {
    throw await handleBackupError(_err, 'Backup failed: file upload error', backupDoc.id, true)
  }

  try {
    await payload.update({
      id: backupDoc.id,
      collection: backupSlug,
      data: {
        backup: uploadDoc.id,
        completedAt: new Date().toISOString(),
        status: BackupStatus.SUCCESS,
      },
      req,
    })
  } catch (_err) {
    throw await handleBackupError(
      _err,
      'Backup failed: update backup doc error',
      backupDoc.id,
      true,
    )
  }

  await cleanupTempFile()

  return backupDoc
}

function runMongorestore({
  connectionString,
  dbName,
  payload,
  url,
}: {
  connectionString: string
  dbName: string
  payload: BasePayload
  url: string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [`${payload.config.serverURL}${url}`])

    const restoreProcess = spawn('mongorestore', [
      `--uri=${connectionString}`,
      `--nsInclude="${dbName}.*"`,
      '--gzip',
      '--archive',
      /* '--drop', */
    ])

    curl.stdout.pipe(restoreProcess.stdin)

    restoreProcess.stdout.on('data', (data) => console.log(data.toString()))
    restoreProcess.stderr.on('data', (data) => console.log(data.toString()))

    restoreProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`mongorestore failed with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

// TODO:: Restore functionality
export async function mongodbRestore({ backupSlug, req, uploadSlug }: AdapterArgs) {
  const payload = req.payload

  // Get id from args
  if (!req.json) {
    const message = ''
    payload.logger.error(message)
    throw new Error(message)
  }

  const { id } = (await req.json()) as { id?: number | string }
  if (typeof id !== 'string' && typeof id !== 'number') {
    const message = ''
    payload.logger.error(message)
    throw new Error(message)
  }

  // Fetch backup doc
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
    //
    payload.logger.error(_err)
    throw new Error('uh oh')
  }

  const connectionString = getConnectionString({ payload })
  const dbName = getDBName({ payload })
  const url = backupDoc?.backup.url

  // Execute operation
  try {
    await runMongorestore({
      connectionString,
      dbName,
      payload,
      url: `${req.origin}${url}`,
    })
  } catch (_err) {
    //
    payload.logger.error(_err)
    throw new Error('uh oh')
  }
}

export const mongodbBackupServiceAdapter: BackupServiceAdapter = {
  backup: mongodbBackup,
  restore: mongodbRestore,
}
