import type { BasePayload, JsonObject, TypeWithID } from 'payload'

import { spawn } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { BackupStatus } from 'src/utilities/backupStatus.js'
import { getConnectionString } from 'src/utilities/getConnectionString.js'

import type { AdapterArgs, BackupServiceAdapter } from './backupServiceAdapter.js'

async function runMongodump({
  backupSlug,
  connectionString,
  payload,
  tmpFilePath,
  uploadSlug,
}: {
  backupSlug: string
  connectionString: string
  payload: BasePayload
  tmpFilePath: string
  uploadSlug: string
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(tmpFilePath)
    const dumpProcess = spawn('mongodump', [
      `--uri=${connectionString}`,
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
  const fileName = `mongodb_backup_${Date.now()}.gz`
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

  let backupDoc: JsonObject & TypeWithID
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

  let uploadDoc: JsonObject & TypeWithID
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
        completedAt: new Date().toISOString(),
        file: uploadDoc.id,
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

// TODO:: Restore functionality
export async function mongodbRestore() {}

export const mongodbBackupServiceAdapter: BackupServiceAdapter = {
  backup: mongodbBackup,
  restore: mongodbRestore,
}
