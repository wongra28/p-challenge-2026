import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text, useWindowDimensions, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SessionProvider } from '../lib/context';
import { colors, spacing, fonts, type as typeStyles } from '../lib/theme';

const MAX_MOBILE_WIDTH = 480;

function MobileGate({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width <= MAX_MOBILE_WIDTH) {
    return <>{children}</>;
  }

  return (
    <View style={gateStyles.wrapper}>
      {children}
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
        </View>
      </View>
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
