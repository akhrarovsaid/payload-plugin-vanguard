import type { VanguardAfterOperationArgs, VanguardPluginConfig } from '../types.js'

type Args = {
  pluginConfig: VanguardPluginConfig
} & VanguardAfterOperationArgs

export async function runAfterOperationHooks({ data, pluginConfig, ...rest }: Args) {
  const afterOperationHooks = pluginConfig.hooks?.afterOperation || []
  for (const hook of afterOperationHooks) {
    await hook({
      data,
      ...rest,
    })
  }
}
