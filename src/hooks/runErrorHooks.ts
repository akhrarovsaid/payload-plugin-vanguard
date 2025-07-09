import type { VanguardErrorHookArgs, VanguardPluginConfig } from '../types.js'

type Args = {
  pluginConfig: VanguardPluginConfig
} & VanguardErrorHookArgs

export async function runBeforeErrorHooks({ pluginConfig, ...rest }: Args) {
  const errorHooks = pluginConfig.hooks?.beforeError || []
  for (const hook of errorHooks) {
    await hook(rest)
  }
}

export async function runAfterErrorHooks({ pluginConfig, ...rest }: Args) {
  const errorHooks = pluginConfig.hooks?.afterError || []
  for (const hook of errorHooks) {
    await hook(rest)
  }
}
