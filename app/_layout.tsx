import { useEffect } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { useAuth } from "@/hooks/useAuth";
import { SessionProvider } from "@/context/sessionContext";
import { initializeDatabase } from "@/lib/database";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LogBox } from "react-native";

// Suppress deprecation warnings for shadow styles (used by React Navigation)
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  "Blocked aria-hidden on an element",
  "Unable to activate keep awake",
  "KeepAwake",
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle deep links from email confirmation
  useEffect(() => {
    const handleDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      
      if (initialUrl != null) {
        const parsed = Linking.parse(initialUrl);
        console.log("Deep link received:", parsed);

        // Handle email confirmation callback
        if (
          parsed.path === "/auth/v1/callback" ||
          (parsed.scheme === "qr-attendance" && parsed.hostname === "auth")
        ) {
          const token_hash = parsed.queryParams?.token_hash as string;
          const type = parsed.queryParams?.type as string;

          if (token_hash && type) {
            console.log("Email confirmation link detected");
            router.push({
              pathname: "/(auth)/confirm-email",
              params: { token_hash, type },
            });
          }
        }
      }
    };

    handleDeepLink();

    // Listen for incoming links from deep linking
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("Linking event received:", url);
      const parsed = Linking.parse(url);
      
      if (
        parsed.path === "/auth/v1/callback" ||
        (parsed.scheme === "qr-attendance" && parsed.hostname === "auth")
      ) {
        const token_hash = parsed.queryParams?.token_hash as string;
        const type = parsed.queryParams?.type as string;

        if (token_hash && type) {
          console.log("Email confirmation link detected from event");
          router.push({
            pathname: "/(auth)/confirm-email",
            params: { token_hash, type },
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Initialize database on app startup
  useEffect(() => {
    initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated - go to scanner
        router.replace("/(app)/scanner");
      } else {
        // User is not authenticated - go to auth
        router.replace("/(auth)/login");
      }
    }
  }, [user, loading]);

  if (loading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
