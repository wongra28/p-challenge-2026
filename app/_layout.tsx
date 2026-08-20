import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { SessionProvider } from '../lib/context';
import { colors } from '../lib/theme';

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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgPrimary },
          animation: 'slide_from_right',
        }}
      />
    </SessionProvider>
  );
}
