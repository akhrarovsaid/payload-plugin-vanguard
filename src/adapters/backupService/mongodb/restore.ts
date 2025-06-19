import type { ReadableStream } from 'stream/web'

import { spawn } from 'child_process'
import { createWriteStream } from 'fs'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

import type { RestoreAdapterArgs, RestoreOperationArgs } from '../types.js'

import { commandMap } from '../shared/commandMap.js'
import { databasePackageMap } from '../shared/databasePackageMap.js'
import { withRestoreContext } from '../shared/withRestoreContext.js'

export async function runOperation({
  connectionString,
  dbName,
  req: { payload },
  tempFileInfos: { logsFileInfo },
  url,
}: RestoreOperationArgs): Promise<void> {
  const logStream = createWriteStream(logsFileInfo.path)
  const archiveURL = `${payload.config.serverURL}${url}`

  try {
    const response = await fetch(archiveURL)

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch archive from ${archiveURL}: ${response.statusText}`)
    }

    const readableArchive = Readable.fromWeb(response.body as ReadableStream)

    const command = commandMap[databasePackageMap.mongodb].restore

    const restoreProcess = spawn(command, [
      `--uri=${connectionString}`,
      `--nsInclude=${dbName}.*`,
      '--gzip',
      '--archive',
    ])

    restoreProcess.stderr.pipe(logStream)

    await pipeline(readableArchive, restoreProcess.stdin)

    await new Promise<void>((resolve, reject) => {
      restoreProcess.on('close', (codeFromProcess) => {
        logStream.end()
        const code = codeFromProcess ?? 1
        if (code !== 0) {
          reject(new Error(`${command} failed with code ${code}`))
        } else {
          resolve()
        }
      })

      restoreProcess.on('error', (err) => {
        logStream.end()
        reject(err)
      })
    })
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
