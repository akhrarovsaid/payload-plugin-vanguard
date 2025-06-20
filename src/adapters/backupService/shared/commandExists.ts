import type { PayloadRequest } from 'payload'

import { exec } from 'child_process'
import { platform } from 'os'
import * as path from 'path'
import { promisify } from 'util'

import type { OperationType } from '../../../utilities/operationType.js'

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
  operation,
  packageName,
  req,
}: {
  backupSlug: string
  operation: OperationType
  packageName: string
  req: PayloadRequest
}) {
  const command = getCommand({ packageName })[operation]

  try {
    await commandExists(command, false)
  } catch (error) {
    await reportAndThrow({
      backupSlug,
      error,
      message: `Backup aborted: cannot execute command '${command}'`,
      req,
    })
  }
}
