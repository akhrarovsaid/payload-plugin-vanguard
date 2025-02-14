import type { ServerProps } from 'payload'
import type { FC } from 'react'

import { RestoreButtonClient } from './index.client.js'

type Props = { restoreEndpointPath: string } & ServerProps

export const RestoreButton: FC<Props> = ({ restoreEndpointPath }) => {
  return <RestoreButtonClient restoreEndpointPath={restoreEndpointPath} />
}
