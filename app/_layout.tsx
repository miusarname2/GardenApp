import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupDatabase } from '../db';
import 'react-native-reanimated';

import { useFonts as useManrope, Manrope_400Regular, Manrope_600SemiBold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts as useInter, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navigationState = useRootNavigationState();

  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  const [manropeLoaded] = useManrope({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_800ExtraBold,
  });

  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Setup Local DB synchronously during render to ensure children find it ready
  setupDatabase();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem('isOnboardingCompleted');
        setIsOnboardingCompleted(value === 'true');
      } catch (e) {
        setIsOnboardingCompleted(false);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (manropeLoaded && interLoaded && isOnboardingCompleted !== null && navigationState?.key) {
      SplashScreen.hideAsync();
      
      // If onboarding is completed, redirect directly to tabs
      if (isOnboardingCompleted) {
        router.replace('/(tabs)');
      }
    }
  }, [manropeLoaded, interLoaded, isOnboardingCompleted, navigationState?.key]);

  if (!manropeLoaded || !interLoaded || isOnboardingCompleted === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bluetooth-onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
