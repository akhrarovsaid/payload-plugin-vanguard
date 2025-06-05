'use client'

import type { BackupHandlerResponse } from 'src/endpoints/backup/generateBackupHandler.js'

import { LoadingOverlay, Pill, toast, useConfig, useModal } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation.js'
import { Fragment, useCallback, useState } from 'react'

import { ConfirmBackupModal } from './ConfirmBackupModal/index.js'

const confirmModalSlug = 'confirm-backup-modal'

export const CreateBackupActionClient = ({
  backupEndpointPath,
}: {
  backupEndpointPath: string
}) => {
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()
  const { openModal } = useModal()
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(false)

  const handleOpenModal = () => openModal(confirmModalSlug)

  const handleSubmit = useCallback(async () => {
    if (loading) {
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${apiRoute}${backupEndpointPath}`, {
        body: '{}',
        method: 'POST',
      })

      const { doc, message } = (await res.json()) as BackupHandlerResponse

      if (!res.ok) {
        toast.error(message)
      } else {
        toast.success(message)
      }

      if (doc) {
        router.push(`${pathname}/${doc.id}`)
      }
    } catch (_err) {
      // swallow error
    } finally {
      setLoading(false)
    }
  }, [apiRoute, backupEndpointPath, loading, pathname, router])

  return (
    <Fragment>
      <Pill className="pill--has-action" onClick={handleOpenModal} size="small">
        Create Backup
      </Pill>
      <ConfirmBackupModal onConfirm={handleSubmit} slug={confirmModalSlug} />
      {loading && <LoadingOverlay />}
    </Fragment>
  )
}
