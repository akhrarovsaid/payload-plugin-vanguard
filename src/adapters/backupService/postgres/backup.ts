import { spawn } from 'child_process'
import fs from 'fs'
import zlib from 'zlib'

import type { BackupAdapterArgs, BackupOperationArgs } from '../types.js'

import { toSnakeCase } from '../../../utilities/toSnakeCase.js'
import { withBackupContext } from '../shared/withBackupContext.js'

export async function runOperation({
  backupSlug,
  connectionString,
  historySlug,
  req: { payload },
  tempFileInfos,
  uploadSlug,
}: BackupOperationArgs): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const rawDumpPath = tempFileInfos.archive.path.replace(/\.gz$/, '') // uncompressed temp archive file
    const compressedStream = fs.createWriteStream(tempFileInfos.archive.path)
    const logStream = fs.createWriteStream(tempFileInfos.logs.path, { flags: 'a' })

    const excludeTables = [
      toSnakeCase(backupSlug),
      toSnakeCase(uploadSlug),
      toSnakeCase(historySlug),
    ]

    const pgArgs = [
      `--dbname=${connectionString}`,
      '--format=custom',
      `--file=${rawDumpPath}`,
      '--verbose',
      ...excludeTables.map((t) => `--exclude-table=${t}`),
    ]

    const dumpProcess = spawn('pg_dump', pgArgs)

    dumpProcess.stderr.pipe(logStream)

    dumpProcess.on('error', (err) => {
      payload.logger.error(err)
      logStream.end()
      reject(err)
    })

    dumpProcess.on('close', (code) => {
      logStream.end()

      if (code !== 0) {
        const err = new Error(`pg_dump exited with code ${code}`)
        payload.logger.error(err)
        return reject(err)
      }

      try {
        // Gzip the file
        const gzip = zlib.createGzip()
        const rawStream = fs.createReadStream(rawDumpPath)

        rawStream
          .pipe(gzip)
          .pipe(compressedStream)
          .on('finish', async () => {
            try {
              const fileBuffer = await fs.promises.readFile(tempFileInfos.archive.path)
              await fs.promises.unlink(rawDumpPath) // clean up uncompressed file
              resolve(fileBuffer)
            } catch (_err) {
              const err = _err as Error
              payload.logger.error(err)
              reject(err)
            }
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
