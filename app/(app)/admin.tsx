import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/supabase";
import { sectionNameSchema } from "@/lib/validation";

interface Section {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminScreen() {
  const router = useRouter();
  const { signOut, userRole } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (userRole !== "admin") {
      Alert.alert(
        "Access Denied",
        "You must be an admin to access this page.",
        [
          {
            text: "Go Back",
            onPress: () => router.replace("/(app)/dashboard"),
          },
        ]
      );
      return;
    }
    fetchSections();
  }, [userRole]);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await db.getSections();

    if (!error) {
      setSections(data || []);
    } else {
      Alert.alert("Error", "Failed to load sections");
    }
    setLoading(false);
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      Alert.alert("Error", "Please enter a section name");
      return;
    }

    setCreating(true);

    try {
      const validatedName = sectionNameSchema.parse(newSectionName);

      const { error } = await db.createSection(validatedName);

      if (error) {
        Alert.alert(
          "Error",
          error.message.includes("duplicate")
            ? "A section with this name already exists."
            : "Failed to create section."
        );
      } else {
        Alert.alert("Success", `Section "${newSectionName}" created!`);
        setNewSectionName("");
        fetchSections();
      }
    } catch (error: any) {
      Alert.alert(
        "Validation Error",
        error.errors?.[0]?.message || "Invalid section name"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSection = (sectionId: string, sectionName: string) => {
    Alert.alert(
      "Delete Section",
      `Are you sure you want to delete "${sectionName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await db.deleteSection(sectionId);

            if (error) {
              Alert.alert("Error", "Failed to delete section");
            } else {
              Alert.alert("Success", "Section deleted!");
              fetchSections();
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const SectionItem = ({ section }: { section: Section }) => (
    <View style={styles.sectionItem}>
      <View style={styles.sectionInfo}>
        <Text style={styles.sectionName}>{section.name}</Text>
        <Text style={styles.sectionDate}>
          Created: {new Date(section.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSection(section.id, section.name)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage sections</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/(app)/dashboard")}
          >
            <Text style={styles.headerButtonIcon}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Text style={styles.headerButtonIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* Create Section Card */}
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create New Section</Text>
            <Text style={styles.createSubtitle}>
              Add a new section to organize students
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., BSIT 3A, BSCS 2B"
                placeholderTextColor="#999"
                value={newSectionName}
                onChangeText={setNewSectionName}
                editable={!creating}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, creating && styles.createButtonDisabled]}
              onPress={handleCreateSection}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>+ Create Section</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sections List Card */}
          <View style={styles.sectionsCard}>
            <Text style={styles.sectionsTitle}>Existing Sections</Text>
            <Text style={styles.sectionsSubtitle}>
              Manage all sections in the system
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading sections...</Text>
              </View>
            ) : sections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No sections created yet. Create one above to get started.
                </Text>
              </View>
            ) : (
              <FlatList
                data={sections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <SectionItem section={item} />}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    color: "#000",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
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
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  headerButtonIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  createCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  createSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#fff",
  },
  createButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  sectionsSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  sectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  sectionDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteButtonText: {
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
});
