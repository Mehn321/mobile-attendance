import { z } from "zod";

// Authentication validation
export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters");

// Student data validation
export const studentIdSchema = z
  .string()
  .regex(/^[0-9]{10,11}$/, "Student ID must be 10-11 digits");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty")
  .max(200, "Name must be less than 200 characters");

export const departmentSchema = z
  .string()
  .trim()
  .min(2, "Department must be at least 2 characters")
  .max(50, "Department must be less than 50 characters");

// Admin validation
export const sectionNameSchema = z
  .string()
  .trim()
  .min(1, "Section name cannot be empty")
  .max(100, "Section name must be less than 100 characters");

// Combined schemas
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = authSchema.extend({
  fullName: nameSchema,
});

export const qrDataSchema = z.object({
  fullName: nameSchema,
  studentId: studentIdSchema,
  department: departmentSchema,
});
