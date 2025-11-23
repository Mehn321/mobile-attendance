import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams<{
    token_hash: string;
    type: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    confirmEmail();
  }, [token_hash, type]);

  const confirmEmail = async () => {
    if (!token_hash || !type) {
      setError("Invalid confirmation link");
      setLoading(false);
      return;
    }

    try {
      console.log("Confirming email with token_hash:", token_hash);

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: (type as any) || "email",
      });

      if (error) {
        console.error("Email confirmation error:", error);
        setError(error.message || "Failed to confirm email");
        setLoading(false);
        return;
      }

      console.log("Email confirmed successfully!");
      setSuccess(true);
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
    } catch (error: any) {
      console.error("Confirmation error:", error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.text, { marginTop: 16 }]}>
            Confirming your email...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Email Confirmed!</Text>
            <Text style={styles.successText}>
              Your email has been successfully confirmed. You can now login to your account.
            </Text>
          </View>
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
          <Text style={[styles.text, { marginTop: 8 }]}>
            Redirecting to login...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Confirmation Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={confirmEmail}
          >
            <Text style={styles.secondaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.text, { marginTop: 16 }]}>
          Processing...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00B050",
    marginBottom: 12,
    textAlign: "center",
  },
  successText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#D32F2F",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    maxWidth: 300,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
