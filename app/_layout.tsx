import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text, Pressable, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SessionProvider } from '../lib/context';
import { colors, spacing, fonts } from '../lib/theme';

const MAX_MOBILE_WIDTH = 500;

function useWindowWidth() {
  const [width, setWidth] = useState(() => {
    if (Platform.OS !== 'web') return 0;
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Set initial value in case SSR value was 0
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

function MobileGate({ children }: { children: React.ReactNode }) {
  const width = useWindowWidth();
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== 'web') return <>{children}</>;

  const showOverlay = width > MAX_MOBILE_WIDTH && !dismissed;

  return (
    <View style={gateStyles.wrapper}>
      {children}
      {showOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(12, 17, 29, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
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
        </div>
      )}
    </View>
  );
}

const gateStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
    color: colors.textBrand,
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
