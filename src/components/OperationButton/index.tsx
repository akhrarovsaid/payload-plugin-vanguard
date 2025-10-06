import type { ServerProps } from 'payload'
import type { FC } from 'react'

import { OperationButtonClient } from './index.client.js'

type Props = { backupEndpointRoute: string; restoreEndpointRoute: string } & ServerProps

export const OperationButton: FC<Props> = ({ backupEndpointRoute, restoreEndpointRoute }) => {
  return (
    <OperationButtonClient
      backupEndpointRoute={backupEndpointRoute}
      restoreEndpointRoute={restoreEndpointRoute}
    />
  )
}
