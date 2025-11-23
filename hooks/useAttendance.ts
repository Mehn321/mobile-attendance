import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { parseQRData } from "@/lib/qrParser";
import { useAuth } from "./useAuth";

interface ScanResult {
  success: boolean;
  message: string;
  student?: {
    name: string;
    id: string;
    department: string;
    status: "time-in" | "time-out";
  };
}

export const useAttendance = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQRScan = useCallback(
    async (decodedText: string): Promise<ScanResult> => {
      if (isProcessing) {
        return {
          success: false,
          message: "Processing previous scan...",
        };
      }

      setIsProcessing(true);
      setScanResult(null);

      try {
        // 1. Parse QR data
        const parsedData = parseQRData(decodedText);

        if (!parsedData) {
          const result: ScanResult = {
            success: false,
            message: "Invalid QR code format. Please scan a valid student ID.",
          };
          setScanResult(result);
          setIsProcessing(false);
          return result;
        }

        const { fullName, studentId, department } = parsedData;

        // 2. Check for 1-minute throttle
        const today = new Date().toISOString().split("T")[0];
        const { data: recentScans, error: recentError } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("student_id", studentId)
          .eq("date", today)
          .order("created_at", { ascending: false })
          .limit(1);

        if (recentError) {
          console.error("Error checking recent scans:", recentError);
        } else if (recentScans && recentScans.length > 0) {
          const lastScan = recentScans[0];
          const lastScanTime = new Date(lastScan.created_at).getTime();
          const currentTime = new Date().getTime();
          const timeDiff = (currentTime - lastScanTime) / 1000;

          if (timeDiff < 60) {
            const remainingSeconds = Math.ceil(60 - timeDiff);
            const result: ScanResult = {
              success: false,
              message: `Please wait ${remainingSeconds} seconds before scanning again.`,
            };
            setScanResult(result);
            setIsProcessing(false);
            return result;
          }
        }

        // 3. Check if student exists, if not create them
        let { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("student_id", studentId)
          .single();

        if (!student) {
          const { data: newStudent, error: insertError } = await supabase
            .from("students")
            .insert({
              student_id: studentId,
              full_name: fullName,
              department: department,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          student = newStudent;
        }

        // 4. Check for existing attendance record today
        const { data: existingRecord } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("student_id", studentId)
          .eq("date", today)
          .is("time_out", null)
          .single();

        if (existingRecord) {
          // Check if trying to login to the same section twice
          if (existingRecord.section_id === student.section_id) {
            const result: ScanResult = {
              success: false,
              message: "You are already logged in to this section. Please logout first.",
            };
            setScanResult(result);
            setIsProcessing(false);
            return result;
          }
          
          // TIME OUT from previous section
          const { error: updateError } = await supabase
            .from("attendance_records")
            .update({ time_out: new Date().toISOString() })
            .eq("id", existingRecord.id);

          if (updateError) throw updateError;

          const result: ScanResult = {
            success: true,
            message: "Time Out recorded successfully!",
            student: {
              name: fullName,
              id: studentId,
              department: department,
              status: "time-out",
            },
          };

          setScanResult(result);
          setIsProcessing(false);
          return result;
        } else {
          // TIME IN
          const { error: insertError } = await supabase
            .from("attendance_records")
            .insert({
              student_id: studentId,
              full_name: fullName,
              department: department,
              time_in: new Date().toISOString(),
              date: today,
              section_id: student.section_id,
            });

          if (insertError) throw insertError;

          const result: ScanResult = {
            success: true,
            message: "Time In recorded successfully!",
            student: {
              name: fullName,
              id: studentId,
              department: department,
              status: "time-in",
            },
          };

          setScanResult(result);
          setIsProcessing(false);
          return result;
        }
      } catch (error: any) {
        console.error("Error processing scan:", error);
        const result: ScanResult = {
          success: false,
          message: error.message || "An error occurred while processing the scan",
        };
        setScanResult(result);
        setIsProcessing(false);
        return result;
      }
    },
    [isProcessing]
  );

  const clearResult = useCallback(() => {
    setScanResult(null);
  }, []);

  return {
    handleQRScan,
    scanResult,
    isProcessing,
    clearResult,
  };
};
