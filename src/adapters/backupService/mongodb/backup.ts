import { spawn } from 'child_process'
import fs from 'fs'

import type { BackupAdapterArgs, BackupOperationArgs } from '../types.js'

import { databasePackageMap } from '../../../utilities/databasePackageMap.js'
import { commandMap } from '../shared/commandMap.js'
import { withBackupContext } from '../shared/withBackupContext.js'

export async function runOperation({
  backupSlug,
  connectionString,
  dbName,
  historySlug,
  req: { payload },
  tempFileInfos,
  uploadSlug,
}: BackupOperationArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archiveStream = fs.createWriteStream(tempFileInfos.archiveFileInfo.path)
    const logStream = fs.createWriteStream(tempFileInfos.logsFileInfo.path, { flags: 'a' })

    const command = commandMap[databasePackageMap.mongodb].backup

    const dumpProcess = spawn(command, [
      `--uri=${connectionString}`,
      `--db=${dbName}`,
      '--archive',
      '--gzip',
      `--excludeCollection=${backupSlug}`,
      `--excludeCollection=${historySlug}`,
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
        const fileBuffer = await fs.promises.readFile(tempFileInfos.archiveFileInfo.path)
        resolve(fileBuffer)
      } catch (_err) {
        const err = _err as Error
        payload.logger.error(err)
        reject(err)
      }
    })
  })
}

export async function backup(args: BackupAdapterArgs) {
  return withBackupContext({
    ...args,
    runOperation,
  })
}
