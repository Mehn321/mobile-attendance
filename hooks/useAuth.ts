import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  studentIdSchema,
} from "@/lib/validation";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user role
        try {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          setUserRole(roleData?.role ?? null);
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            setUserRole(data?.role ?? null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, studentId: string) => {
      // Validate inputs
      try {
        emailSchema.parse(email);
        passwordSchema.parse(password);
        nameSchema.parse(fullName);
        studentIdSchema.parse(studentId);
      } catch (error: any) {
        return {
          data: null,
          error: {
            message: error.errors?.[0]?.message || "Validation failed",
          },
        };
      }

      const redirectUrl = "myapp://";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId,
          },
        },
      });

      return { data, error };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string, studentId: string) => {
      // Validate inputs
      try {
        emailSchema.parse(email);
        passwordSchema.parse(password);
        studentIdSchema.parse(studentId);
      } catch (error: any) {
        return {
          data: null,
          error: {
            message: error.errors?.[0]?.message || "Validation failed",
          },
        };
      }

      // Normalize email (lowercase and trim)
      const normalizedEmail = email.toLowerCase().trim();

      console.log("Attempting sign in with:", {
        email: normalizedEmail,
        studentId,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error("Sign in error:", {
          message: error.message,
          status: (error as any).status,
          studentIdUsed: studentId,
          emailUsed: normalizedEmail,
        });

        // Check if email is not confirmed
        if (
          error.message.includes("Email not confirmed") ||
          error.message.includes("email_not_confirmed")
        ) {
          return {
            data: null,
            error: {
              message: "EMAIL_NOT_CONFIRMED",
              originalMessage:
                "Please confirm your email first to login. We sent a confirmation link to your email.",
              email: normalizedEmail,
            },
          };
        }

        // Provide more helpful error message
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_credentials")
        ) {
          return {
            data: null,
            error: {
              message:
                "Invalid email or password. Please check your credentials and try again.",
            },
          };
        }
      }

      return { data, error };
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
  };
};
