import type { JsonObject, User } from 'payload'

import type { ReportAndThrowArgs } from './reportAndThrow.js'

import { reportAndThrow } from './reportAndThrow.js'

type Args = {
  data: JsonObject
  user: null | User
} & ReportAndThrowArgs

export async function upsertBackupDoc({
  backupDocId,
  backupSlug,
  data,
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
      message: 'Operation aborted: failed to upsert backup doc',
      req,
    })
  }
}
