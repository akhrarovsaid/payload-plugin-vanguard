import type { PayloadRequest } from 'payload'

import { exec } from 'child_process'
import { platform } from 'os'
import * as path from 'path'
import { promisify } from 'util'

import { getCommand } from './commandMap.js'
import { reportAndThrow } from './reportAndThrow.js'

const execPromise = promisify(exec)

export async function commandExists(cmd: string, noThrow: boolean = true): Promise<boolean> {
  if (typeof cmd !== 'string' || !cmd.trim()) {
    return false
  }

  const isWin = platform() === 'win32'
  const checkCmd = isWin ? 'where' : 'which'

  try {
    const { stdout } = await execPromise(`${checkCmd} ${cmd}`)
    return stdout
      .trim()
      .split(/\r?\n/)
      .some((line) => path.isAbsolute(line.trim()))
  } catch (_err) {
    if (noThrow) {
      return false
    } else {
      throw _err
    }
  }
}

export async function ensureCommandExists({
  backupSlug,
  packageName,
  req,
}: {
  backupSlug: string
  packageName: string
  req: PayloadRequest
}) {
  const { backup: backupCommand } = getCommand({ packageName })

  try {
    await commandExists(backupCommand, false)
  } catch (error) {
    await reportAndThrow({
      backupSlug,
      error,
      message: `Backup aborted: cannot execute command '${backupCommand}'`,
      req,
    })
  }
}
