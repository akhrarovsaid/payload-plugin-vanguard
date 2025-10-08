import type { ReadableStream } from 'stream/web'

import { spawn } from 'child_process'
import fs, { createWriteStream } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import zlib from 'zlib'

import type { RestoreAdapterArgs, RestoreOperationArgs } from '../types.js'

import { withRestoreContext } from '../shared/withRestoreContext.js'

export async function runOperation({
  connectionString,
  req: { payload },
  tempFileInfos: { logsFileInfo },
  url,
}: RestoreOperationArgs): Promise<void> {
  const logStream = createWriteStream(logsFileInfo.path)
  const backupFileURL = `${payload.config.serverURL}${url}`
  const tempDir = path.dirname(logsFileInfo.path)
  const extractedSQLPath = path.join(tempDir, 'uncompressed.sql')

  try {
    // Fetch and gunzip
    const response = await fetch(backupFileURL)

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch archive from ${backupFileURL}: ${response.statusText}`)
    }

    const gunzip = zlib.createGunzip()
    gunzip.on('error', (err) => logStream.write(`gunzip: ${err.message}\n`))

    const outStream = createWriteStream(extractedSQLPath)
    const readableDump = Readable.fromWeb(response.body as ReadableStream)

    await pipeline(readableDump, gunzip, outStream)

    const sqlitePath = connectionString.replace(/^sqlite:\/\//, '')

    const restoreProcess = spawn('sqlite3', [sqlitePath])

    // Pipe SQL file into sqlite3 stdin
    const sqlFileStream = fs.createReadStream(extractedSQLPath)
    sqlFileStream.pipe(restoreProcess.stdin)

    restoreProcess.stderr.pipe(logStream)

    await new Promise<void>((resolve, reject) => {
      restoreProcess.on('close', (codeFromProcess) => {
        logStream.end()
        const code = codeFromProcess ?? 1
        if (code !== 0) {
          reject(new Error(`sqlite3 restore failed with code ${code}`))
        } else {
          resolve()
        }
      })

      restoreProcess.on('error', (err) => {
        logStream.end()
        reject(err)
      })
    })

    await fs.promises.unlink(extractedSQLPath)
  } catch (err) {
    logStream.end()
    payload.logger.error(err)
  }
}

export async function restore(args: RestoreAdapterArgs) {
  return withRestoreContext({
    ...args,
    runOperation,
  })
}
