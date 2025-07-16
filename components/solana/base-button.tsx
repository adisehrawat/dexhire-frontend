import { AppText } from '@/components/app-text'
import { useWalletUiTheme } from '@/components/solana/use-wallet-ui-theme'
import { UiIconSymbol } from '@/components/ui/ui-icon-symbol.ios'
import React from 'react'
import { StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native'

interface BaseButtonProps {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function BaseButton({ label, onPress, style, textStyle }: BaseButtonProps) {
  const { backgroundColor, borderColor, textColor } = useWalletUiTheme()
  return (
    <TouchableOpacity
      style={[styles.trigger, { backgroundColor, borderColor, flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}
      onPress={onPress}
    >
      <UiIconSymbol name="wallet.pass.fill" color={textColor} />
      <AppText style={textStyle}>{label}</AppText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
})
