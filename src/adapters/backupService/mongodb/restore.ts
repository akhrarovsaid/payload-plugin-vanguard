import { spawn } from 'child_process'
import fs from 'fs'

import type { RestoreAdapterArgs, RestoreOperationArgs } from '../types.js'

import { withRestoreContext } from '../shared/withRestoreContext.js'

export async function runOperation({
  connectionString,
  dbName,
  req: { payload },
  tempFileInfos: { logs: logsFileInfo },
  url,
}: RestoreOperationArgs): Promise<void> {
  return new Promise((resolve, reject) => {
    const logStream = fs.createWriteStream(logsFileInfo.path)
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

export async function restore(args: RestoreAdapterArgs) {
  return withRestoreContext({
    ...args,
    runOperation,
  })
}
