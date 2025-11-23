import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  student_id: string;
  full_name: string;
  department: string;
  time_in: string;
  time_out: string | null;
  date: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { signOut, userRole } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    presentNow: 0,
    totalStudents: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Fetch attendance records
      const { data: recordsData, error: recordsError } = await db.getTodayRecords(dateStr);
      if (!recordsError) {
        setRecords(recordsData || []);
      }

      // Calculate stats
      const totalToday = recordsData?.length || 0;
      const presentNow = recordsData?.filter((r) => !r.time_out).length || 0;

      setStats({
        totalToday,
        presentNow,
        totalStudents: 0, // Would fetch from students table if needed
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const AttendanceItem = ({ record }: { record: AttendanceRecord }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordName}>{record.full_name}</Text>
        <Text
          style={[
            styles.statusBadge,
            record.time_out ? styles.statusCompleted : styles.statusPresent,
          ]}
        >
          {record.time_out ? "Out" : "In"}
        </Text>
      </View>
      <Text style={styles.recordDetail}>ID: {record.student_id}</Text>
      <Text style={styles.recordDetail}>Dept: {record.department}</Text>
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>
          In: {format(new Date(record.time_in), "h:mm a")}
        </Text>
        <Text style={styles.timeLabel}>
          Out: {record.time_out ? format(new Date(record.time_out), "h:mm a") : "-"}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📊</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Live attendance</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          {userRole === "admin" && (
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/(app)/admin")}>
              <Text style={styles.headerButtonIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/(app)/scanner")}>
            <Text style={styles.headerButtonIcon}>📱</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Text style={styles.headerButtonIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard label="Scans Today" value={stats.totalToday} />
          <StatCard label="Present Now" value={stats.presentNow} />
          <StatCard label="Total Students" value={stats.totalStudents} />
        </View>

        {/* Date Filter */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>
            📅 {format(selectedDate, "MMM dd, yyyy")}
          </Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
            >
              <Text style={styles.filterButtonText}>← Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setSelectedDate(new Date())}
            >
              <Text style={styles.filterButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
            >
              <Text style={styles.filterButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Records Section */}
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Attendance Records</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No records for this date</Text>
            </View>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <AttendanceItem record={item} />}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  filterButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  recordsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
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
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
  recordItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPresent: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusCompleted: {
    backgroundColor: "#f3e8ff",
    color: "#581c87",
  },
  recordDetail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  timeLabel: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
});
