import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { parseQRData } from "@/lib/qrParser";
import {
  recordAttendance,
  checkRecentScan,
  AttendanceRecord,
  createStudentSession,
  getActiveSession,
  logoutStudentSession,
  checkCooldownStatus,
  getStudentActiveSessions,
} from "@/lib/database";
import { useSession } from "@/context/sessionContext";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

interface StudentLoginState {
  studentId: string;
  fullName: string;
  department: string;
  sessionId: number;
  loginTime: Date;
}

export function QRScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [studentLogin, setStudentLogin] = useState<StudentLoginState | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "error";
    message: string;
    name?: string;
  } | null>(null);
  const [loginTimer, setLoginTimer] = useState<number>(0);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const { selectedSection } = useSession();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // Timer effect for login countdown (1 minute to allow logout)
  useEffect(() => {
    if (studentLogin) {
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - studentLogin.loginTime.getTime()) / 1000
        );
        setLoginTimer(elapsedSeconds);
      }, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [studentLogin]);

  // Load active sessions when section changes
  useEffect(() => {
    if (studentLogin) {
      loadActiveSessions(studentLogin.studentId);
    }
  }, [selectedSection]);

  const loadActiveSessions = async (studentId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const sessions = await getStudentActiveSessions(studentId, today);
    setActiveSessions(sessions);
  };

  const handleLogout = async () => {
    if (!studentLogin) return;

    try {
      await logoutStudentSession(studentLogin.sessionId, 5); // 5 minute cooldown
      setScanResult({
        status: "success",
        message: `✓ Logged out - ${studentLogin.fullName}`,
      });
      setStudentLogin(null);
      setActiveSessions([]);
      setLoginTimer(0);
      setTimeout(() => setScanResult(null), 2000);
    } catch (error: any) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || loading) return;

      // Check if section is selected
      if (!selectedSection) {
        setScanResult({
          status: "error",
          message: "Please select a section first",
        });
        setTimeout(() => setScanResult(null), 2000);
        return;
      }

      setScanned(true);
      setLoading(true);

      try {
        // Parse QR data
        const parsed = parseQRData(data);

        if (!parsed) {
          setScanResult({
            status: "error",
            message: "Invalid QR code format",
          });
          setTimeout(() => {
            setScanned(false);
            setScanResult(null);
          }, 2000);
          return;
        }

        const { studentId, fullName, department } = parsed;
        const today = format(new Date(), "yyyy-MM-dd");

        // Check if student has active session in THIS section
        const activeSession = await getActiveSession(studentId, selectedSection.id!, today);

        if (activeSession) {
          // Student already logged in to this section - show logout option
          setStudentLogin({
            studentId,
            fullName,
            department,
            sessionId: activeSession.id,
            loginTime: new Date(activeSession.login_time),
          });
          setShowSessionModal(true);
          setScanResult({
            status: "success",
            message: `👤 ${fullName} - Logged In`,
            name: "Click logout button to leave",
          });
          setTimeout(() => setScanResult(null), 3000);
          setScanned(false);
          setLoading(false);
          return;
        }

        // Check cooldown for THIS section only
        const cooldown = await checkCooldownStatus(studentId, selectedSection.id!, today);
        if (cooldown && new Date() < new Date(cooldown.cooldown_until)) {
          const remaining = Math.ceil(
            (new Date(cooldown.cooldown_until).getTime() - Date.now()) / 1000
          );
          setScanResult({
            status: "error",
            message: `⏳ Cooldown: Wait ${remaining}s (${Math.ceil(remaining / 60)}min)`,
            name: fullName,
          });
          setTimeout(() => {
            setScanned(false);
            setScanResult(null);
          }, 2000);
          setLoading(false);
          return;
        }

        // Check if already checked in today in this section
        const existingRecord = await checkRecentScan(studentId, today);

        if (existingRecord && existingRecord.section_id === selectedSection.id) {
          // Already checked in this section today
          setScanResult({
            status: "success",
            message: "✓ Already Checked In",
            name: fullName,
          });
        } else {
          // New attendance record - can be in different section
          await recordAttendance({
            student_id: studentId,
            full_name: fullName,
            department,
            date: today,
            time_in: new Date().toISOString(),
            section_id: selectedSection.id,
          });

          // Create student session for this section
          await createStudentSession(studentId, selectedSection.id!, today);

          setScanResult({
            status: "success",
            message: "✓ Attendance Recorded",
            name: fullName,
          });
        }

        setTimeout(() => {
          setScanned(false);
          setScanResult(null);
        }, 3000);
      } catch (error: any) {
        console.error("Scan error:", error);
        setScanResult({
          status: "error",
          message: error.message || "An error occurred",
        });
        setTimeout(() => {
          setScanned(false);
          setScanResult(null);
        }, 3000);
      } finally {
        setLoading(false);
      }
    },
    [scanned, loading, selectedSection]
  );

  const canLogout = loginTimer >= 60; // Can logout after 1 minute

  if (!permission?.granted && permission !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>📷 Camera permission required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Camera Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleCamera}>
        <Text style={styles.toggleButtonText}>{facing === "front" ? "📷 Back" : "📷 Front"}</Text>
      </TouchableOpacity>

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

      {/* Result indicator */}
      {scanResult && (
        <View
          style={[
            styles.result,
            scanResult.status === "success" ? styles.resultSuccess : styles.resultError,
          ]}
        >
          <Text style={styles.resultMessage}>{scanResult.message}</Text>
          {scanResult.name && <Text style={styles.resultName}>{scanResult.name}</Text>}
        </View>
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Login status and logout button */}
      {studentLogin && (
        <View style={styles.loginStatusContainer}>
          <View style={styles.loginStatus}>
            <View style={styles.loginInfo}>
              <Text style={styles.loginStudentName}>{studentLogin.fullName}</Text>
              <Text style={styles.loginTimer}>
                Login: {Math.floor(loginTimer / 60)}:{String(loginTimer % 60).padStart(2, "0")}
              </Text>
              <Text
                style={[
                  styles.logoutHint,
                  !canLogout && styles.logoutHintDisabled,
                ]}
              >
                {canLogout ? "✓ Ready to logout" : `Wait ${60 - loginTimer}s to logout`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.logoutButton, !canLogout && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={!canLogout}
            >
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionContainer}>
        {studentLogin ? (
          <Text style={styles.instructionText}>
            👤 {studentLogin.fullName} - Wait {60 - loginTimer}s to logout
          </Text>
        ) : selectedSection ? (
          <Text style={styles.instructionText}>
            📍 {selectedSection.name} - Align QR code in frame
          </Text>
        ) : (
          <Text style={styles.instructionText}>⚠️ Please select a section first</Text>
        )}
      </View>

      {/* Session Modal */}
      <Modal visible={showSessionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Active Session</Text>
            <Text style={styles.modalSubtitle}>{studentLogin?.fullName}</Text>

            <View style={styles.sessionInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>Logged In</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time Logged:</Text>
                <Text style={styles.infoValue}>{loginTimer}s</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Section:</Text>
                <Text style={styles.infoValue}>{selectedSection?.name}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowSessionModal(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              {canLogout && (
                <TouchableOpacity
                  style={styles.modalButtonLogout}
                  onPress={() => {
                    handleLogout();
                    setShowSessionModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Logout</Text>
                </TouchableOpacity>
              )}
            </View>

            {!canLogout && (
              <Text style={styles.modalWarning}>
                ⏳ Wait {60 - loginTimer}s before logging out
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  result: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  resultSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.9)",
  },
  resultError: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  resultName: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionContainer: {
    position: "absolute",
    bottom: 20,
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
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "rgba(0, 122, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loginStatusContainer: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 122, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    zIndex: 20,
  },
  loginStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loginInfo: {
    flex: 1,
  },
  loginStudentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  loginTimer: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  logoutHint: {
    fontSize: 12,
    color: "#4ade80",
    fontWeight: "600",
  },
  logoutHintDisabled: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 20,
  },
  sessionInfo: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modalButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonLogout: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalWarning: {
    marginTop: 12,
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "600",
    textAlign: "center",
  },
});
