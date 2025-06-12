import type { ReadableStream } from 'stream/web'

import { spawn } from 'child_process'
import fs, { createWriteStream } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import zlib from 'zlib'

import type { RestoreAdapterArgs, RestoreOperationArgs } from '../types.js'

import { commandMap } from '../shared/commandMap.js'
import { databasePackageMap } from '../shared/databasePackageMap.js'
import { resyncSequences } from '../shared/resyncSequences.js'
import { withRestoreContext } from '../shared/withRestoreContext.js'

export async function runOperation({
  backupSlug,
  connectionString,
  historySlug,
  req: { payload },
  tempFileInfos: { logs: logsFileInfo },
  uploadSlug,
  url,
}: RestoreOperationArgs): Promise<void> {
  const logStream = createWriteStream(logsFileInfo.path)
  const backupFileURL = `${payload.config.serverURL}${url}`
  const tempDir = path.dirname(logsFileInfo.path)
  const extractedPath = path.join(tempDir, 'uncompressed.pgdump')

  try {
    // Fetch and gunzip
    const response = await fetch(backupFileURL)

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch archive from ${backupFileURL}: ${response.statusText}`)
    }

    const gunzip = zlib.createGunzip()
    gunzip.on('error', (err) => logStream.write(`gunzip: ${err.message}\n`))

    const outStream = createWriteStream(extractedPath)
    const readableDump = Readable.fromWeb(response.body as ReadableStream)

    await pipeline(readableDump, gunzip, outStream)

    const command = commandMap[databasePackageMap.postgres].restore

    const restoreProcess = spawn(command, [
      `--dbname=${connectionString}`,
      '--verbose',
      '--no-owner',
      '--no-privileges',
      '--format=custom',
      extractedPath,
    ])

    restoreProcess.stderr.pipe(logStream)

    await new Promise<void>((resolve, reject) => {
      restoreProcess.on('close', (codeFromProcess) => {
        logStream.end()
        const code = codeFromProcess ?? 1
        if (code > 1) {
          reject(new Error(`pg_restore failed with code ${code}`))
        } else {
          resolve()
        }
      })

      restoreProcess.on('error', (err) => {
        logStream.end()
        reject(err)
      })
    })

    await fs.promises.unlink(extractedPath)

    // Reset the sequence for vanguard collections to prevent
    // error on uploading logs/pushing history
    if (payload.db.idType !== 'uuid') {
      await resyncSequences({ collectionSlugs: [uploadSlug, backupSlug, historySlug], payload })
    }
  } catch (err) {
    logStream.end()
    throw err
  }
}

export async function restore(args: RestoreAdapterArgs) {
  return withRestoreContext({
    ...args,
    runOperation,
  })
}
