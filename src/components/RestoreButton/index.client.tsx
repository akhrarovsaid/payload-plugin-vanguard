'use client'

import { Button, LoadingOverlay, toast, useConfig, useDocumentInfo, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { Fragment, useCallback, useState } from 'react'

import type { RestoreHandlerResponse } from '../../endpoints/restore/generateRestoreHandler.js'

import { BackupStatus } from '../../utilities/backupStatus.js'
import { ConfirmRestoreModal } from './ConfirmRestoreModal/index.js'
import './index.scss'

const confirmModalSlug = 'confirm-restore-modal'

const baseClass = 'restore-btn'

export const RestoreButtonClient = ({ restoreEndpointPath }: { restoreEndpointPath: string }) => {
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()
  const { id, savedDocumentData } = useDocumentInfo()
  const { openModal } = useModal()
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const handleOpenModal = () => openModal(confirmModalSlug)

  const handleSubmit = useCallback(async () => {
    if (loading || !id) {
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${apiRoute}${restoreEndpointPath}`, {
        body: JSON.stringify({ id }),
        method: 'POST',
      })

      const { message } = (await res.json()) as RestoreHandlerResponse

      if (!res.ok) {
        toast.error(message)
      } else {
        toast.success(message)
        router.refresh()
      }
    } catch (_err) {
      // swallow error
    } finally {
      setLoading(false)
    }
  }, [loading, id, apiRoute, restoreEndpointPath, router])

  const disabled = savedDocumentData?.status !== BackupStatus.SUCCESS || !id

  return (
    <Fragment>
      <Button className={baseClass} disabled={disabled} onClick={handleOpenModal} type="button">
        Restore
      </Button>
      <ConfirmRestoreModal onConfirm={handleSubmit} slug={confirmModalSlug} />
      {loading && <LoadingOverlay />}
    </Fragment>
  )
}
