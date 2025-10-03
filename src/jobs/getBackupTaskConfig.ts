import type { TaskConfig } from 'payload'

import type { VanguardPluginConfig } from '../types.js'

import { getBackupTaskHandler } from './getBackupTaskHandler.js'

export function getBackupTaskConfig({
  backupSlug,
  pluginConfig: { jobs },
  pluginConfig,
  uploadSlug,
}: {
  backupSlug: string
  pluginConfig: VanguardPluginConfig
  uploadSlug: string
}): TaskConfig {
  const task = {
    slug: 'vanguard-backup',
    handler: getBackupTaskHandler({ backupSlug, pluginConfig, uploadSlug }),
  }

  if (typeof jobs === 'object' && typeof jobs?.overrideBackupTask === 'function') {
    return jobs.overrideBackupTask(task)
  }

  return task
}
