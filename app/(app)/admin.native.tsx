import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import {
  createSection,
  getAllSections,
  deleteSection,
  Section,
} from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'You must be an admin to access this page.',
        [{ text: 'OK', onPress: () => router.push('/(app)/dashboard') }]
      );
      return;
    }
    loadSections();
  }, [user]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const sectionsList = await getAllSections();
      setSections(sectionsList);
    } catch (error) {
      console.error('Error loading sections:', error);
      Alert.alert('Error', 'Failed to load sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      Alert.alert('Validation Error', 'Section name cannot be empty.');
      return;
    }

    if (newSectionName.trim().length < 2) {
      Alert.alert('Validation Error', 'Section name must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await createSection({ name: newSectionName });
      Alert.alert('Success', `Section "${newSectionName}" created successfully.`);
      setNewSectionName('');
      await loadSections();
    } catch (error: any) {
      const errorMessage = error.message.includes('duplicate')
        ? 'A section with this name already exists.'
        : 'Failed to create section.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = (sectionId: string, sectionName: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete section "${sectionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSection(sectionId);
              Alert.alert('Success', `Section "${sectionName}" deleted successfully.`);
              await loadSections();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete section.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const SectionRow = ({ section }: any) => (
    <View style={styles.sectionRow}>
      <View style={styles.sectionInfo}>
        <Text style={styles.sectionName}>{section.name}</Text>
        {section.created_at && (
          <Text style={styles.sectionDate}>
            Created: {new Date(section.created_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSection(section.id!, section.name)}
      >
        <Ionicons name="trash" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage sections</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/(app)/dashboard')}
          >
            <Ionicons name="bar-chart" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Section</Text>
          <Text style={styles.cardSubtitle}>Add a new section to organize students</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Section Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BSIT 3A, BSCS 2B"
              value={newSectionName}
              onChangeText={setNewSectionName}
              placeholderTextColor="#999"
              editable={!submitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleCreateSection}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Create Section</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Sections */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Existing Sections</Text>
          <Text style={styles.cardSubtitle}>Manage all sections in the system</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open" size={48} color="#999" />
              <Text style={styles.emptyText}>
                No sections created yet. Create one above to get started.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sections}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => <SectionRow section={item} />}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sectionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});
