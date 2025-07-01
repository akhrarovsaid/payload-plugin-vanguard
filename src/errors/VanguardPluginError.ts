export type BaseErrorArgs = {
  options?: ErrorOptions
}

type Args = {
  message: string
} & BaseErrorArgs

export class VanguardPluginError extends Error {
  constructor({ message, options }: Args) {
    super(message, options)
    this.name = new.target.name || 'VanguardPluginError'
  }
}
