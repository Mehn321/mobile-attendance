import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { parseQRData } from "@/lib/qrParser";
import { getUserByEmail } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";

export default function QRAuthScreen() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const { mode, email, password, fullName } = useLocalSearchParams<{
    mode: "login" | "signup";
    email: string;
    password: string;
    fullName?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const cameraRef = useRef<CameraView>(null);

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      console.log("QR Code detected:", data);

      if (scanned || loading) return;

      setScanned(true);
      setLoading(true);

      try {
        // Parse QR data
        const parsed = parseQRData(data);
        console.log("Parsed QR data:", parsed);

        if (!parsed) {
          Alert.alert(
            "Invalid QR",
            "Please scan a valid student ID QR code"
          );
          setScanned(false);
          setLoading(false);
          return;
        }

        const { studentId, fullName: scannedName, department } = parsed;

        if (mode === "signup") {
          // Check if email already exists
          const existingUser = await getUserByEmail(email!);
          if (existingUser) {
            Alert.alert(
              "Email Already Registered",
              "This email is already associated with an account. Please login instead or use a different email."
            );
            router.back();
            setScanned(false);
            setLoading(false);
            return;
          }

          // Sign up with scanned data
          console.log("Signup attempt with:", {
            email,
            studentId,
            scannedName,
          });

          const { error, data } = await signUp(
            email!,
            password!,
            fullName || scannedName,
            studentId
          );

          console.log("Signup response:", {
            error: error?.message,
            data: data?.user?.id ? "User created" : "No user",
            needsConfirmation: data?.user?.user_metadata,
          });

          if (error) {
            Alert.alert("Signup Failed", error.message || "Unknown error");
            setScanned(false);
            setLoading(false);
            return;
          }

          // Check if email confirmation is required
          if (data?.user && !data.user.confirmed_at) {
            // Email confirmation is needed
            router.replace({
              pathname: "/(auth)/email-confirmation",
              params: {
                email: email!,
              },
            });
          } else {
            // Email confirmation is not required, proceed to scanner
            Alert.alert("Success", "Account created successfully!");
            router.replace("/(app)/scanner");
          }
        } else if (mode === "login") {
          // Sign in with scanned data
          console.log("Login attempt:", {
            email,
            studentId,
            scannedName,
          });

          const { error } = await signIn(email!, password!, studentId);

          if (error) {
            console.error("Login error details:", error);

            // Check if email needs confirmation
            if ((error as any).message === "EMAIL_NOT_CONFIRMED") {
              router.replace({
                pathname: "/(auth)/email-confirmation-required",
                params: {
                  email: email!,
                },
              });
              setScanned(false);
              setLoading(false);
              return;
            }

            Alert.alert(
              "Login Failed",
              (error as any).message ||
                "Invalid credentials. Make sure your email and password are correct.",
              [
                {
                  text: "Try Different Account",
                  onPress: () => {
                    router.back();
                    setScanned(false);
                  },
                },
                {
                  text: "Create New Account",
                  onPress: () => router.replace("/(auth)/signup"),
                },
              ]
            );
            setScanned(false);
            setLoading(false);
            return;
          }

          Alert.alert("Success", "Logged in successfully!");
          router.replace("/(app)/scanner");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "An error occurred");
        setScanned(false);
        setLoading(false);
      }
    },
    [scanned, loading, mode, email, password, fullName, signUp, signIn, router]
  );

  // Request camera permission on mount
  if (!permission?.granted && permission !== null) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.text}>We need camera access to scan QR codes</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.text, { marginTop: 16 }]}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Student ID</Text>
        <TouchableOpacity
          style={styles.cameraToggleBtn}
          onPress={toggleCameraFacing}
          disabled={loading}
        >
          <Ionicons name="camera-reverse" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Camera Container */}
      <View style={styles.cameraContainer}>
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraFacing}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
        )}

        {/* QR Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.unfocused} />
          <View style={styles.focusedRow}>
            <View style={styles.unfocused} />
            <View style={styles.focusedContainer}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.unfocused} />
          </View>
          <View style={styles.unfocused} />
        </View>

        {/* Instruction text */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            📍 Position QR code within the frame
          </Text>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cameraToggleBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  unfocused: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  focusedRow: {
    flexDirection: "row",
    height: 250,
    justifyContent: "space-between",
  },
  focusedContainer: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#00FF00",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  topLeft: {
    top: -10,
    left: -10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -10,
    right: -10,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointerEventsNone: {
    pointerEvents: "none" as const,
  },
  loadingOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
