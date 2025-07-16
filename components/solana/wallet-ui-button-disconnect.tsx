import { BaseButton } from '@/components/solana/base-button'
import { useWalletUi } from '@/components/solana/use-wallet-ui'
import React from 'react'

export function WalletUiButtonDisconnect({ label = 'Disconnect' }: { label?: string }) {
  const { disconnect } = useWalletUi()

  return (
    <BaseButton
      label={label}
      onPress={() => disconnect()}
      style={{ backgroundColor: '#FCA5A5', borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center', width: '100%' }}
      textStyle={{ color: '#B91C1C', textAlign: 'center', fontWeight: '600' }}
    />
  )
}
