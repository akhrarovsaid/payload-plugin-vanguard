import type { ServerProps } from 'payload'
import type { FC } from 'react'

import { CreateBackupActionClient } from './index.client.js'

type Props = ServerProps

export const CreateBackupAction: FC<Props> = (props) => {
  return <CreateBackupActionClient />
}
