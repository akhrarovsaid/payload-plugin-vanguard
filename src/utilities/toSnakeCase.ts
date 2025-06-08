const hasSpace = /\s/
// eslint-disable-next-line regexp/no-unused-capturing-group
const hasSeparator = /([_\-.:])/
// eslint-disable-next-line regexp/no-unused-capturing-group
const hasCamel = /([a-z][A-Z]|[A-Z][a-z])/

const separatorSplitter = /[\W_]+(.|$)/g
const camelSplitter = /(.)([A-Z]+)/g

function toNoCase(string: string) {
  if (hasSpace.test(string)) {
    return string.toLowerCase()
  }
  if (hasSeparator.test(string)) {
    return (unseparate(string) || string).toLowerCase()
  }
  if (hasCamel.test(string)) {
    return uncamelize(string).toLowerCase()
  }
  return string.toLowerCase()
}

function unseparate(string: string) {
  return string.replace(separatorSplitter, function (m, next) {
    return next ? ' ' + next : ''
  })
}

function uncamelize(string: string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ')
  })
}

function toSpaceCase(string: string) {
  return toNoCase(string)
    .replace(/[\W_]+(.|$)/g, function (matches, match) {
      return match ? ' ' + match : ''
    })
    .trim()
}

export function toSnakeCase(string: string) {
  return toSpaceCase(string).replace(/\s/g, '_')
}
