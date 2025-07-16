import ProfileCreateModal from '@/components/profile/ProfileCreateModal'
import { BaseButton } from '@/components/solana/base-button'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import { useProfile } from '@/contexts/ProfileContext'
import React, { useEffect, useState } from 'react'

export function WalletUiButtonConnect({ label = 'Connect' }: { label?: string }) {
  const { connect, account } = useWalletUi()
  const { profile, isProfileLoaded } = useProfile()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleConnect = async () => {
    await connect()
  }

  // Always show the modal if connected, profile is loaded, and profile is missing
  useEffect(() => {
    if (account && isProfileLoaded && !profile) {
      setShowProfileModal(true)
    }
  }, [account, isProfileLoaded, profile])

  return (
    <>
      <BaseButton label={label} onPress={handleConnect} />
      {showProfileModal && (
        <ProfileCreateModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
      )}
    </>
  )
}
