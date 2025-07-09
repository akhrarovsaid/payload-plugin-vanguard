import type { VanguardBeforeOperationArgs, VanguardPluginConfig } from '../types.js'

type Args = {
  pluginConfig: VanguardPluginConfig
} & VanguardBeforeOperationArgs

export async function runBeforeOperationHooks({
  args: argsFromProps,
  pluginConfig,
  ...rest
}: Args) {
  let args = argsFromProps
  const beforeOperationHooks = pluginConfig.hooks?.beforeOperation || []
  for (const hook of beforeOperationHooks) {
    args =
      (await hook({
        args,
        ...rest,
      })) || args
  }
  return args
}
