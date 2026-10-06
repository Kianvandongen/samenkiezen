import React, { useEffect, useState } from 'react';
import { View, Text, useColorScheme, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Unbounded_600SemiBold, Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold } from '@expo-google-fonts/onest';
import { loadStore, useStore, ui, S } from '../lib/store';
import { useC, F } from '../components/ui';

function Toast() {
  useStore(); const c = useC(), ins = useSafeAreaInsets();
  if (!ui.toast) return null;
  return (
    <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', left: 16, right: 16, top: ins.top + 10, backgroundColor: c.primary, padding: 14, borderRadius: 15, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }}>
      <Text style={{ color: c.onPrimary, fontFamily: F.semi, fontSize: 14 }}>{ui.toast}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fonts] = useFonts({ Unbounded_600SemiBold, Unbounded_700Bold, Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold });
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();
  const c = useC();
  useEffect(() => { loadStore().catch(() => {}).finally(() => setReady(true)); }, []);
  if (!fonts || !ready || !S) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.purple} /></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="match/[mid]" options={{ animation: 'fade' }} />
      </Stack>
      <Toast />
    </SafeAreaProvider>
  );
}
