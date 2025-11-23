import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { QRScanner } from "@/components/QRScanner";
import { useAuth } from "@/hooks/useAuth";

export default function ScannerScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleDashboard = () => {
    router.push("/(app)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📱</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>QR Attendance</Text>
            <Text style={styles.subtitle}>Scan to log attendance</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDashboard}>
            <Text style={styles.headerButtonIcon}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Text style={styles.headerButtonIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner */}
      <QRScanner />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerButtonIcon: {
    fontSize: 18,
  },
});
