import type { Payload, PayloadRequest, User } from 'payload'

import { reportAndThrow } from './reportAndThrow.js'

// DEPRECATED: Delete
export async function createInitialBackupDoc({
  backupSlug,
  payload,
  req,
  runId,
  user,
}: {
  backupSlug: string
  payload: Payload
  req: PayloadRequest
  runId: string
  user: null | User
}) {
  try {
    return payload.create({
      collection: backupSlug,
      data: { initiatedBy: user, latestRunId: runId },
      req,
    })
  } catch (error) {
    await reportAndThrow({
      backupSlug,
      error,
      message: 'Backup aborted: failed to create initial doc',
      req,
    })
  }
}
