import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';

interface User {
  id?: number;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, role?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  signUp: async (email, password, role) => {
    try {
      const result = await api.signup(email, password, role || 'user');
      if (result.error) {
        return { error: result.error };
      }

      const user: User = { email, role: role || 'user' };
      set({ user });
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Signup failed' };
    }
  },

  signIn: async (email, password) => {
    try {
      const result = await api.signin(email, password);
      if (result.error) {
        return { error: result.error };
      }

      const user: User = { email };
      set({ user });
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  },

  signOut: async () => {
    try {
      await api.signout();
      set({ user: null });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        // Token exists, user is authenticated
        const email = await AsyncStorage.getItem('user_email');
        if (email) {
          set({ user: { email } });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
