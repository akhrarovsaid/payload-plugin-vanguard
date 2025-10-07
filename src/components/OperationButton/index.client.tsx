'use client'

import {
  Button,
  ConfirmationModal,
  LoadingOverlay,
  toast,
  useConfig,
  useDocumentInfo,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation.js'
import { Fragment, useCallback, useState } from 'react'

import type { BackupHandlerResponse } from '../../endpoints/backup/generateBackupHandler.js'
import type { RestoreHandlerResponse } from '../../endpoints/restore/generateRestoreHandler.js'

import './index.scss'
import { BackupStatus } from '../../utilities/backupStatus.js'
import { UploadTypes } from '../../utilities/uploadTypes.js'

const baseClass = 'vanguard-operation-btn'

const confirmRestoreModalSlug = 'confirm-restore-modal'

/** TODO: Translations */
export const OperationButtonClient = ({
  backupEndpointRoute,
  restoreEndpointRoute,
}: {
  backupEndpointRoute: string
  restoreEndpointRoute: string
}) => {
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()
  const { id, data } = useDocumentInfo()
  const router = useRouter()
  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const pathname = usePathname()

  const [loading, setLoading] = useState(false)

  const handleOpenRestoreModal = () => openModal(confirmRestoreModalSlug)

  const handleBackup = useCallback(async () => {
    if (loading) {
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${apiRoute}${backupEndpointRoute}`, {
        body: '{}',
        credentials: 'include',
        method: 'POST',
      })

      const { doc, message } = (await res.json()) as BackupHandlerResponse

      if (!res.ok) {
        toast.error(message)
      } else {
        toast.success(message)
        router.push(pathname.replace(/create$/, `${doc?.id}`))
      }
    } catch (_err) {
      // swallow error
    } finally {
      setLoading(false)
    }
  }, [loading, apiRoute, backupEndpointRoute, router, pathname])

  const handleRestore = useCallback(async () => {
    if (loading || !id) {
      return
    }
    setLoading(true)
    closeModal(confirmRestoreModalSlug)

    try {
      const res = await fetch(`${apiRoute}${restoreEndpointRoute}`, {
        body: JSON.stringify({ id }),
        cache: 'no-store',
        credentials: 'include',
        method: 'POST',
      })

      const { message } = (await res.json()) as RestoreHandlerResponse

      if (!res.ok) {
        toast.error(message)
      } else {
        toast.success(message)
      }
    } catch (_err) {
      // swallow error
    } finally {
      setLoading(false)

      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
  }, [loading, id, closeModal, apiRoute, restoreEndpointRoute])

  const isCreate = !id
  const isBackup = data?.type === UploadTypes.BACKUP
  const disabled = !isCreate && data?.status !== BackupStatus.SUCCESS

  if (!isBackup && !isCreate) {
    return null
  }

  return (
    <Fragment>
      <Button
        className={baseClass}
        disabled={disabled}
        onClick={isCreate ? handleBackup : handleOpenRestoreModal}
        type="button"
      >
        {isCreate ? t('general:save') : t('general:restore')}
      </Button>

      {!isCreate && (
        <ConfirmationModal
          body={'This will restore the database from this backup.'}
          heading={t('version:confirmVersionRestoration')}
          modalSlug={confirmRestoreModalSlug}
          onConfirm={handleRestore}
        />
      )}

      {loading && <LoadingOverlay />}
    </Fragment>
  )
}
