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
    const rawDumpPath = tempFileInfos.archiveFileInfo.path.replace(/\.gz$/, '')
    const compressedStream = fs.createWriteStream(tempFileInfos.archiveFileInfo.path)
    const logStream = fs.createWriteStream(tempFileInfos.logsFileInfo.path, { flags: 'a' })

    const excludeTables = [
      toSnakeCase(backupSlug),
      toSnakeCase(uploadSlug),
      toSnakeCase(historySlug),
    ]

    const sqlitePath = connectionString.replace(/^sqlite:\/\//, '') // remove sqlite:// protocol if present

    // Construct `.dump` command with table filtering
    const dumpArgs = ['.dump']
    const dumpProcess = spawn('sqlite3', [sqlitePath, ...dumpArgs])

    const filteredDumpStream = fs.createWriteStream(rawDumpPath)

    dumpProcess.stdout.on('data', (data: Buffer) => {
      const sql = data.toString()
      const filteredSQL =
        sql
          .split('\n')
          .filter((line) => {
            const lcLine = line.toLowerCase()
            return !excludeTables.some(
              (tbl) => lcLine.includes(`table ${tbl}`) || lcLine.includes(`insert into ${tbl}`),
            )
          })
          .join('\n') + '\n'

      filteredDumpStream.write(filteredSQL)
    })

    dumpProcess.stderr.pipe(logStream)

    dumpProcess.on('error', (err) => {
      payload.logger.error(err)
      logStream.end()
      filteredDumpStream.end()
      reject(err)
    })

    dumpProcess.on('close', (code) => {
      logStream.end()
      filteredDumpStream.end()

      if (code !== 0) {
        const err = new Error(`sqlite3 .dump exited with code ${code}`)
        payload.logger.error(err)
        return reject(err)
      }

      try {
        const gzip = zlib.createGzip()
        const rawStream = fs.createReadStream(rawDumpPath)

        rawStream
          .pipe(gzip)
          .pipe(compressedStream)
          .on('finish', async () => {
            try {
              const fileBuffer = await fs.promises.readFile(tempFileInfos.archiveFileInfo.path)
              await fs.promises.unlink(rawDumpPath) // clean up
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
