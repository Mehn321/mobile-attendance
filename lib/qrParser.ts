import { qrDataSchema } from "./validation";

/**
 * Parse QR code data
 * Expected format: "NAME STUDENTID(10-11 digits) DEPARTMENT"
 * Example: "NHEM DAY G. ACLO 2023300076 BSIT"
 */
export function parseQRData(data: string) {
  try {
    const parts = data.trim().split(/\s+/);

    if (parts.length < 3) {
      return null;
    }

    // Last part is department (e.g., BSIT)
    const department = parts[parts.length - 1];

    // Second to last is student ID (10-11 digits)
    const studentId = parts[parts.length - 2];

    // Everything else is the name
    const fullName = parts.slice(0, parts.length - 2).join(" ");

    if (!fullName || !studentId || !department) {
      return null;
    }

    // Validate parsed data with Zod schema
    const validated = qrDataSchema.parse({
      fullName,
      studentId,
      department,
    });

    return validated;
  } catch (error) {
    console.error("QR data parsing/validation failed:", error);
    return null;
  }
}

/**
 * Get error message from parsing
 */
export function getQRParseErrorMessage(data: string): string {
  if (!data || data.trim().length === 0) {
    return "Empty QR code data";
  }

  const parts = data.trim().split(/\s+/);

  if (parts.length < 3) {
    return "Invalid QR format - requires name, student ID, and department";
  }

  const parsed = parseQRData(data);

  if (!parsed) {
    // Try to identify what's wrong
    const studentId = parts[parts.length - 2];
    if (!/^[0-9]{10,11}$/.test(studentId)) {
      return `Invalid Student ID: "${studentId}" (must be 10-11 digits)`;
    }

    return "Invalid QR code format or data";
  }

  return "Unknown error";
}
