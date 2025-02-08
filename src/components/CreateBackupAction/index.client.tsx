'use client'

import { LoadingOverlay, Pill, toast, useConfig, useModal } from '@payloadcms/ui'
import { Fragment, useCallback, useState } from 'react'

import { ConfirmBackupModal } from './ConfirmBackupModal/index.js'

const confirmModalSlug = 'confirm-backup-modal'

export const CreateBackupActionClient = () => {
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const { openModal } = useModal()

  const [loading, setLoading] = useState(false)

  const handleOpenModal = () => openModal(confirmModalSlug)

  const handleSubmit = useCallback(async () => {
    if (loading) {
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${apiRoute}/database/backup`, {
        body: '{}',
        method: 'POST',
      })

      if (!res.ok) {
        toast.error('Something went wrong')
        return
      }

      const resData = await res.json()
    } catch (_err) {
      // swallow error
    } finally {
      setLoading(false)
    }
  }, [apiRoute, loading])

  return (
    <Fragment>
      <Pill className="pill--has-action" onClick={handleOpenModal}>
        Create Backup
      </Pill>
      <ConfirmBackupModal onConfirm={handleSubmit} slug={confirmModalSlug} />
      {loading && <LoadingOverlay />}
    </Fragment>
  )
}
