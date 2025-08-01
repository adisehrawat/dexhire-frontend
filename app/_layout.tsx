import { AppProviders } from '@/components/app-providers'
import { AppSplashController } from '@/components/app-splash-controller'
import { useAuth } from '@/components/auth/auth-provider'
import { AppProvider } from '@/contexts/AppContext'
import { ProfileProvider } from '@/contexts/ProfileContext'
import { ClientProjectsProvider } from '@/contexts/use-fetch-client-projects'
import { ClientProposalsProvider } from '@/contexts/use-fetch-client-proposals'
import { useTrackLocations } from '@/hooks/use-track-locations'
import { PortalHost } from '@rn-primitives/portal'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'
import { View } from 'react-native'
import 'react-native-reanimated'
import "./global.css"
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    // Use this hook to track the locations for analytics or debugging.
    // Delete if you don't need it.
    useTrackLocations((pathname, params) => {
        console.log(`Track ${pathname}`, { params })
    })
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    })

    const onLayoutRootView = useCallback(async () => {
        console.log('onLayoutRootView')
        if (loaded) {
            console.log('loaded')
            // This tells the splash screen to hide immediately! If we call this after
            // `setAppIsReady`, then we may see a blank screen while the app is
            // loading its initial state and rendering its first pixels. So instead,
            // we hide the splash screen once we know the root view has already
            // performed layout.
            await SplashScreen.hideAsync()
        }
    }, [loaded])

    if (!loaded) {
        // Async font loading only occurs in development.
        return null
    }

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AppProviders>
                <ProfileProvider>
                    <ClientProjectsProvider>
                        <ClientProposalsProvider>
                            <AppProvider>
                                <AppSplashController />
                                <RootNavigator />
                                <StatusBar style="auto" />
                            </AppProvider>
                        </ClientProposalsProvider>
                    </ClientProjectsProvider>
                </ProfileProvider>
            </AppProviders>
            <PortalHost />
        </View>
    )
}

function RootNavigator() {
    const { isAuthenticated } = useAuth()
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isAuthenticated}>
                <Stack.Screen name="sign-in" />

            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
            </Stack.Protected>
        </Stack>
    )
}
