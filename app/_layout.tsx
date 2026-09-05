import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7c5af3',
    secondary: '#38bdf8',
    tertiary: '#f43f5e',
    background: '#0a0a0f',
    surface: '#12121a',
    surfaceVariant: '#1a1b26',
    onSurface: '#f1f5f9',
    outline: 'rgba(255,255,255,0.1)',
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // On web, fonts are preloaded via HTML header so we don't block instant render
  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={customDarkTheme}>
        <StatusBar style="light" backgroundColor="#0a0a0f" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0f' },
            headerTintColor: '#e2e8f0',
            headerTitleStyle: {
              fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'Inter_700Bold',
              fontSize: 18,
            },
            contentStyle: { backgroundColor: '#0a0a0f' },
            headerBackTitle: '',
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="series/[id]"
            options={{
              title: '',
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name="episode/[id]"
            options={{
              title: '',
              headerTransparent: true,
              headerStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
