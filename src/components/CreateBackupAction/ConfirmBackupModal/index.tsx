'use client'

import type { FC } from 'react'

import { Button, Modal, useModal, useTranslation } from '@payloadcms/ui'

import './index.scss'

type Props = {
  onConfirm: () => void
  slug: string
}

const baseClass = 'backup-confirm-modal'

export const ConfirmBackupModal: FC<Props> = ({ slug, onConfirm }) => {
  const {
    i18n: { t },
  } = useTranslation()

  const { closeModal } = useModal()

  const handleCancel = () => closeModal(slug)
  const handleConfirm = () => {
    handleCancel()
    onConfirm()
  }

  return (
    <Modal className={baseClass} slug={slug}>
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__content`}>
          <h1>Confirm Backup?</h1>
          <p>This will create a full database backup.</p>
        </div>
        <div className={`${baseClass}__controls`}>
          <Button buttonStyle="secondary" onClick={handleCancel} size="large">
            {t('general:cancel')}
          </Button>
          <Button onClick={handleConfirm} size="large">
            {t('general:confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
