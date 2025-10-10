import { spawn } from 'child_process'

import type { BackupAdapterArgs, BackupOperationArgs, BackupOperationResult } from '../types.js'

import { databasePackageMap } from '../../../utilities/databasePackageMap.js'
import { commandMap } from '../shared/commandMap.js'
import { withBackupContext } from '../shared/withBackupContext.js'

export async function runOperation({
  adapters: { archive: archiveAdapter, logs: logsAdapter },
  backupSlug,
  connectionString,
  dbName,
  req: { payload },
  tempFileInfos,
}: BackupOperationArgs): Promise<BackupOperationResult> {
  return new Promise((resolve, reject) => {
    const command = commandMap[databasePackageMap.mongodb].backup

    const dumpProcess = spawn(command, [
      `--uri=${connectionString}`,
      `--db=${dbName}`,
      '--archive',
      '--gzip',
      `--excludeCollection=${backupSlug}`,
    ])

    /**
     * Backup (stdout) dump to archive adapter
     */
    dumpProcess.stdout.on('data', async (chunk) => {
      try {
        await archiveAdapter.chunk(chunk)
      } catch (_err) {
        const err = _err as Error
        payload.logger.error(err)
        dumpProcess.kill()
        await archiveAdapter.abort()
        await logsAdapter.abort()
        reject(err)
      }
    })

    /**
     * Backup (stderr) logs to logs adapter
     */
    dumpProcess.stderr.on('data', async (chunk) => {
      try {
        await logsAdapter.chunk(chunk)
      } catch (_err) {
        const err = _err as Error
        payload.logger.error(err)
        dumpProcess.kill()
        await archiveAdapter.abort()
        await logsAdapter.abort()
        reject(err)
      }
    })

    /**
     * Backup (process)
     */
    dumpProcess.on('error', async (err) => {
      payload.logger.error(err)
      dumpProcess.kill()
      await archiveAdapter.abort()
      await logsAdapter.abort()
      reject(err)
    })

    dumpProcess.on('close', async (code) => {
      if (code !== 0) {
        const err = new Error(`${command} exited with code ${code}`)
        await archiveAdapter.abort()
        await logsAdapter.abort()
        payload.logger.error(err)
        return reject(err)
      }

      try {
        const archiveFilePath = await archiveAdapter.complete()
        const logsFilePath = await logsAdapter.complete()

        resolve({
          name: archiveAdapter.name,
          archive: {
            filename: tempFileInfos.archiveFileInfo.filename,
            path: archiveFilePath,
          },
          logs: {
            filename: tempFileInfos.logsFileInfo.filename,
            path: logsFilePath,
          },
        })
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
