import { getAccessResults, type PayloadRequest } from 'payload'

import { OperationType } from '../utilities/operationType.js'

export async function executeAccess({
  backupSlug,
  operation,
  req,
}: {
  backupSlug: string
  operation: OperationType
  req: PayloadRequest
}) {
  const accessResults = await getAccessResults({ req })
  const operationAccessResult = accessResults.collections?.[backupSlug]

  const permissions = []

  if (operation === OperationType.BACKUP) {
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
