import { useState, useEffect, useCallback } from "react";
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

interface Section {
  id: string;
  name: string;
}

interface Stats {
  totalToday: number;
  presentNow: number;
  totalStudents: number;
}

export const useAttendanceData = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalToday: 0,
    presentNow: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch sections
  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching sections:", error);
      } else {
        setSections(data || []);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  }, []);

  // Fetch attendance records
  const fetchAttendanceRecords = useCallback(async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      let query = supabase
        .from("attendance_records")
        .select("*")
        .eq("date", dateStr);

      if (selectedSection !== "all") {
        query = query.eq("section_id", selectedSection);
      }

      const { data, error } = await query.order("time_in", {
        ascending: false,
      });

      if (error) {
        console.error("Error fetching records:", error);
      } else {
        setRecords(data || []);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  }, [selectedDate, selectedSection]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      // Total scans today
      let todayQuery = supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("date", dateStr);

      // Currently present (no time_out)
      let presentQuery = supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("date", dateStr)
        .is("time_out", null);

      // Total students
      let studentsQuery = supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      if (selectedSection !== "all") {
        todayQuery = todayQuery.eq("section_id", selectedSection);
        presentQuery = presentQuery.eq("section_id", selectedSection);
        studentsQuery = studentsQuery.eq("section_id", selectedSection);
      }

      const [todayResult, presentResult, studentsResult] = await Promise.all([
        todayQuery,
        presentQuery,
        studentsQuery,
      ]);

      setStats({
        totalToday: todayResult.count || 0,
        presentNow: presentResult.count || 0,
        totalStudents: studentsResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [selectedDate, selectedSection]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSections();
      setLoading(false);
    };

    loadData();
  }, [fetchSections]);

  // Update records and stats when filters change
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAttendanceRecords(), fetchStats()]).then(() => {
      setLoading(false);
    });
  }, [fetchAttendanceRecords, fetchStats, selectedSection, selectedDate]);

  // Subscribe to realtime updates
  useEffect(() => {
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
          fetchAttendanceRecords();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAttendanceRecords, fetchStats]);

  return {
    records,
    sections,
    stats,
    loading,
    selectedSection,
    selectedDate,
    setSelectedSection,
    setSelectedDate,
  };
};
