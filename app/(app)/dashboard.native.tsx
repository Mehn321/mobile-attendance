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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import {
  getAttendanceForDate,
  getAttendanceStats,
  getAllSections,
  AttendanceRecord,
  Section,
} from '@/lib/database';
import { format, subDays, addDays } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalToday: 0, presentNow: 0 });
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedSection, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const [attendanceRecords, sectionsList, statsData] = await Promise.all([
        getAttendanceForDate(dateStr, selectedSection),
        getAllSections(),
        getAttendanceStats(dateStr, selectedSection),
      ]);

      setRecords(attendanceRecords);
      setSections(sectionsList);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    setShowDatePicker(false);
  };

  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const StatCard = ({ label, value, icon }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#007AFF" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const AttendanceRow = ({ record }: any) => (
    <View style={styles.recordRow}>
      <View style={styles.recordInfo}>
        <Text style={styles.studentName}>{record.full_name}</Text>
        <Text style={styles.studentId}>{record.student_id}</Text>
        <Text style={styles.department}>{record.department}</Text>
      </View>
      <View style={styles.timeInfo}>
        <Text style={styles.timeLabel}>In: {format(new Date(record.time_in), 'h:mm a')}</Text>
        <Text style={styles.timeLabel}>
          Out: {record.time_out ? format(new Date(record.time_out), 'h:mm a') : '-'}
        </Text>
        <View style={[
          styles.badge,
          record.time_out ? styles.completedBadge : styles.presentBadge
        ]}>
          <Text style={styles.badgeText}>
            {record.time_out ? 'Completed' : 'Present'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Simple calendar picker
  const DatePickerModal = () => {
    const [monthDate, setMonthDate] = useState(new Date());
    
    const getDaysInMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth(monthDate);
    const firstDay = getFirstDayOfMonth(monthDate);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const handlePreviousMonth = () => {
      setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
      setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1));
    };

    const handleSelectDay = (day: number) => {
      const newDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      handleDateChange(newDate);
    };

    return (
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            {/* Header */}
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Month/Year Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={handlePreviousMonth}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {format(monthDate, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaderRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
              {days.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !day && styles.emptyCell,
                    day === selectedDate.getDate() &&
                      monthDate.getMonth() === selectedDate.getMonth() &&
                      monthDate.getFullYear() === selectedDate.getFullYear() &&
                      styles.selectedDayCell,
                  ]}
                  onPress={() => day && handleSelectDay(day)}
                  disabled={!day}
                >
                  {day && <Text style={[
                    styles.dayText,
                    day === selectedDate.getDate() &&
                      monthDate.getMonth() === selectedDate.getMonth() &&
                      monthDate.getFullYear() === selectedDate.getFullYear() &&
                      styles.selectedDayText,
                  ]}>
                    {day}
                  </Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick buttons */}
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => {
                  goToToday();
                  setMonthDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.quickButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.quickButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Attendance Dashboard</Text>
          <Text style={styles.headerSubtitle}>Real-time monitoring</Text>
        </View>
        <View style={styles.headerButtons}>
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(app)/admin')}
            >
              <Ionicons name="settings" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push('/(app)/scanner')}
          >
            <Ionicons name="camera" size={20} color="#007AFF" />
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
        {/* Filters */}
        <View style={styles.filterSection}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Section</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedSection === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedSection('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSection === 'all' && styles.filterButtonTextActive,
                ]}>
                  All Sections
                </Text>
              </TouchableOpacity>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.filterButton,
                    selectedSection === section.id && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedSection(section.id!)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedSection === section.id && styles.filterButtonTextActive,
                  ]}>
                    {section.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Date</Text>
            <View style={styles.dateNavigationRow}>
              <TouchableOpacity
                style={styles.dateNavButton}
                onPress={goToPreviousDay}
              >
                <Ionicons name="chevron-back" size={18} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={18} color="#007AFF" />
                <Text style={styles.dateButtonText}>
                  {format(selectedDate, 'PPP')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateNavButton}
                onPress={goToNextDay}
              >
                <Ionicons name="chevron-forward" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <StatCard
            label="Total Scans"
            value={stats.totalToday}
            icon="people"
          />
          <StatCard
            label="Currently Present"
            value={stats.presentNow}
            icon="person-add"
          />
        </View>

        {/* Records */}
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Attendance Records</Text>
          <Text style={styles.sectionSubtitle}>
            {format(selectedDate, 'MMMM d, yyyy')}
            {selectedSection !== 'all' && ` - ${sections.find(s => s.id === selectedSection)?.name}`}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : records.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open" size={48} color="#999" />
              <Text style={styles.emptyText}>
                No attendance records found for this date and section.
              </Text>
            </View>
          ) : (
            <FlatList
              data={records}
              keyExtractor={(item) => item.id?.toString() || item.student_id}
              renderItem={({ item }) => <AttendanceRow record={item} />}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <DatePickerModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 0,
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
  filterSection: {
    gap: 12,
    marginBottom: 20,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  dateNavigationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateNavButton: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: '80%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedDayCell: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recordsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  studentId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  department: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  presentBadge: {
    backgroundColor: '#E3F2FD',
  },
  completedBadge: {
    backgroundColor: '#F3E5F5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
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
