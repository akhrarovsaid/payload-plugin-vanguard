import { exec } from 'child_process'
import { platform } from 'os'
import * as path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

export async function commandExists(cmd: string): Promise<boolean> {
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
  } catch {
    return false
  }
}
