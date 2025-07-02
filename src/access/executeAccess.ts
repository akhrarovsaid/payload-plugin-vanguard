import { getAccessResults, type PayloadRequest } from 'payload'

import { OperationType } from '../utilities/operationType.js'

export async function executeAccess({
  backupSlug,
  operation,
  req,
  uploadSlug,
}: {
  backupSlug: string
  operation: OperationType
  req: PayloadRequest
  uploadSlug: string
}) {
  const accessResults = await getAccessResults({ req })
  const isBackup = operation === OperationType.BACKUP
  const operationAccessResult = accessResults.collections?.[backupSlug]
  const uploadAccessResult = accessResults.collections?.[uploadSlug]

  const permissions = [uploadAccessResult?.create]

  if (isBackup) {
    permissions.push(operationAccessResult?.create)
  } else {
    permissions.push(operationAccessResult?.update)
  }

  return permissions.every(Boolean)
    ? {
        hasAccess: true,
      }
    : {
        hasAccess: false,
        message: req.t('error:notAllowedToPerformAction'),
      }
}
