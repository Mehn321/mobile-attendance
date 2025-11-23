import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { QRScanner } from "@/components/QRScanner";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "@/context/sessionContext";
import { createSection } from "@/lib/database";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function ScannerScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { selectedSection, setSelectedSection, sections, loading, refreshSections } = useSession();
  const [showSectionList, setShowSectionList] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleDashboard = () => {
    router.push("/(app)/dashboard");
  };

  const handleSelectSection = (section: any) => {
    setSelectedSection(section);
    setShowSectionList(false);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      alert("Section name cannot be empty");
      return;
    }

    setCreating(true);
    try {
      const newSection = await createSection({ name: newSectionName.trim() });
      setNewSectionName("");
      setShowCreateSection(false);
      await refreshSections();
      setSelectedSection(newSection);
    } catch (error: any) {
      alert(`Error creating section: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  // If no section is selected, show section selection UI
  if (!selectedSection) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>📱</Text>
            <View style={styles.headerText}>
              <Text style={styles.title}>QR Attendance</Text>
              <Text style={styles.subtitle}>Select a section to start</Text>
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

        {/* Content */}
        <ScrollView style={styles.sectionSelectContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionSelectContainer}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>📂</Text>
            </View>
            <Text style={styles.sectionSelectTitle}>Select Section</Text>
            <Text style={styles.sectionSelectSubtitle}>
              Choose a section to begin taking attendance
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            ) : sections.length === 0 ? (
              <View style={styles.emptySections}>
                <Text style={styles.emptyText}>No sections available</Text>
                <Text style={styles.emptySubtext}>Create a new section to get started</Text>
              </View>
            ) : (
              <View style={styles.sectionsList}>
                {sections.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={styles.sectionCard}
                    onPress={() => handleSelectSection(section)}
                  >
                    <View style={styles.sectionCardContent}>
                      <Text style={styles.sectionCardName}>{section.name}</Text>
                      <Text style={styles.sectionCardDate}>
                        Created: {new Date(section.created_at || "").toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.sectionCardArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Create Section Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateSection(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create New Section</Text>
            </TouchableOpacity>
          </View>

          {/* Create Section Modal */}
          {showCreateSection && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create New Section</Text>
                <View style={styles.modalInput}>
                  <Text style={styles.modalLabel}>Section Name (e.g., BSIT 3A)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter section name"
                    value={newSectionName}
                    onChangeText={setNewSectionName}
                    editable={!creating}
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={() => setShowCreateSection(false)}
                    disabled={creating}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonCreate}
                    onPress={handleCreateSection}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalButtonText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          </ScrollView>
          </SafeAreaView>
          );
  }

  // Scanner view with selected section
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📱</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>QR Attendance</Text>
            <Text style={styles.subtitle}>{selectedSection.name}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSelectedSection(null)}
          >
            <Text style={styles.headerButtonIcon}>🔄</Text>
          </TouchableOpacity>
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

import { TextInput } from "react-native";

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
  sectionSelectContent: {
    flex: 1,
  },
  sectionSelectContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  sectionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIconText: {
    fontSize: 50,
  },
  sectionSelectTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  sectionSelectSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 30,
  },
  sectionsList: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionCardContent: {
    flex: 1,
  },
  sectionCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionCardDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 4,
  },
  sectionCardArrow: {
    fontSize: 20,
    color: "rgba(0, 122, 255, 0.8)",
  },
  emptySections: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
  },
  createButton: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalButtonCreate: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
