import type { JsonObject, User } from 'payload'

import type { OperationType } from '../../../utilities/operationType.js'
import type { ReportAndThrowArgs } from './reportAndThrow.js'

import { capitalize } from '../../../utilities/capitalize.js'
import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  data: JsonObject
  operation: OperationType
  user: null | User
} & ReportAndThrowArgs

export async function upsertBackupDoc({
  backupDocId,
  backupSlug,
  data,
  operation,
  req,
  req: { payload },
  ...rest
}: Args) {
  try {
    return backupDocId
      ? payload.update({
          id: backupDocId,
          collection: backupSlug,
          data,
          req,
        })
      : payload.create({
          collection: backupSlug,
          data,
          req,
        })
  } catch (error) {
    await reportAndThrow({
      ...rest,
      backupSlug,
      error,
      message: `${capitalize(operation)} error: failed to upsert archive doc`,
      operation,
      req,
    })
  }
}
