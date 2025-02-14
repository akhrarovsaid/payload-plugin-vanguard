import type { Endpoint } from 'payload'

import { defaultRestoreEndpointPath } from './defaults.js'
import { generateRestoreHandler, type RestoreHandlerArgs } from './generateRestoreHandler.js'

export const getRestoreEndpoint = (args: RestoreHandlerArgs): Endpoint => ({
  handler: generateRestoreHandler(args),
  method: 'post',
  path: args.pluginConfig?.routes?.restore ?? defaultRestoreEndpointPath,
})
