import type { Endpoint } from 'payload'

import { defaultBackupEndpointPath } from './defaults.js'
import { type BackupHandlerArgs, generateBackupHandler } from './generateBackupHandler.js'

export const getBackupEndpoint = (args: BackupHandlerArgs): Endpoint => ({
  handler: generateBackupHandler(args),
  method: 'post',
  path: args.pluginConfig?.routes?.backup ?? defaultBackupEndpointPath,
})
