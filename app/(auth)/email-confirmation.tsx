import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function EmailConfirmationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      Alert.alert("Error", "Email not found");
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        Alert.alert("Error", error.message || "Failed to resend email");
      } else {
        Alert.alert(
          "Success",
          "Confirmation email sent! Please check your inbox and click the link to verify your email."
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📧</Text>
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>QR Attendance System</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Created Successfully!</Text>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>
                We've sent a confirmation link to:
              </Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>What's Next?</Text>
              <Text style={styles.instructionStep}>
                1. Check your email inbox (including spam folder)
              </Text>
              <Text style={styles.instructionStep}>
                2. Click the verification link in the email
              </Text>
              <Text style={styles.instructionStep}>
                3. Come back here and login
              </Text>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Important</Text>
              <Text style={styles.warningText}>
                You cannot login until you confirm your email. This helps us keep
                your account secure.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, resendLoading && styles.buttonDisabled]}
              onPress={handleResendEmail}
              disabled={resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Resend Confirmation Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleGoToLogin}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already confirmed your email? Go back to login.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  messageBox: {
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
  instructionBox: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFE69C",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#7d5a2c",
    lineHeight: 18,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
