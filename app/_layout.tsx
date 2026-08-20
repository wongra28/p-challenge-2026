import { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text, Pressable, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SessionProvider } from '../lib/context';
import { colors, spacing, fonts } from '../lib/theme';

const MAX_MOBILE_WIDTH = 480;

function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerWidth
      : 0
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function MobileGate({ children }: { children: React.ReactNode }) {
  const width = useWindowWidth();
  const [dismissed, setDismissed] = useState(false);

  const showOverlay =
    Platform.OS === 'web' && width > MAX_MOBILE_WIDTH && !dismissed;

  return (
    <View style={gateStyles.wrapper}>
      {children}
      {showOverlay && (
        <View style={gateStyles.overlay}>
          <View style={gateStyles.content}>
            <Feather name="smartphone" size={40} color={colors.textBrand} />
            <Text style={gateStyles.title}>Mobile viewport required</Text>
            <Text style={gateStyles.body}>
              Resize your window to view in mobile width!
            </Text>
            <Text style={gateStyles.hint}>
              Narrow your browser to under {MAX_MOBILE_WIDTH}px
            </Text>
            <Pressable
              onPress={() => setDismissed(true)}
              style={gateStyles.dismissBtn}
            >
              <Text style={gateStyles.dismissText}>View app anyway</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const gateStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 17, 29, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    // @ts-expect-error backdrop-filter works on web
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  },
  content: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing['4xl'],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  dismissBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  dismissText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'ClashGrotesk-Medium': require('../assets/fonts/ClashGrotesk-Medium.ttf'),
    'ClashGrotesk-Semibold': require('../assets/fonts/ClashGrotesk-Semibold.ttf'),
    'InstrumentSans-Regular': require('../assets/fonts/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Medium': require('../assets/fonts/InstrumentSans-Medium.ttf'),
    'InstrumentSans-SemiBold': require('../assets/fonts/InstrumentSans-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <SessionProvider>
      <StatusBar style="light" />
      <MobileGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bgPrimary },
            animation: 'slide_from_right',
          }}
        />
      </MobileGate>
    </SessionProvider>
  );
}
