import type { File, JsonObject, TypedUser } from 'payload'

import type { OperationType } from '../../../utilities/operationType.js'
import type { ReportAndThrowArgs } from './reportAndThrow.js'

import { UpsertBackupDocError } from '../../../errors/UpsertBackupDocError.js'
import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  data: JsonObject
  file?: File
  operation: OperationType
  user: null | TypedUser
} & ReportAndThrowArgs

export async function upsertBackupDoc({
  backupDocId,
  backupSlug,
  data,
  file,
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
          file,
          req,
        })
      : payload.create({
          collection: backupSlug,
          data,
          file,
          req,
        })
  } catch (error) {
    await reportAndThrow({
      ...rest,
      backupSlug,
      error: new UpsertBackupDocError({ backupSlug, operation, options: { cause: error } }),
      operation,
      req,
    })
  }
}
