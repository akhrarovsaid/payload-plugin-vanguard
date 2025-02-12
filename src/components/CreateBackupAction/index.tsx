import type { ServerProps } from 'payload'
import type { FC } from 'react'

import { CreateBackupActionClient } from './index.client.js'

type Props = { backupEndpointPath: string } & ServerProps

export const CreateBackupAction: FC<Props> = ({ backupEndpointPath }) => {
  return <CreateBackupActionClient backupEndpointPath={backupEndpointPath} />
}
