import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.100.92:3000/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem('auth_token', token);
}

async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem('auth_token');
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || 'Request failed' };
    }

    const data = await response.json();
    return { data };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}

export const api = {
  // Auth
  async signup(email: string, password: string, role: string = 'user') {
    const result = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (result.data?.token) {
      await setAuthToken(result.data.token);
    }

    return result;
  },

  async signin(email: string, password: string) {
    const result = await apiCall('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      await setAuthToken(result.data.token);
    }

    return result;
  },

  async signout() {
    await clearAuthToken();
  },

  // Students
  async getStudents() {
    return apiCall('/students');
  },

  async createStudent(name: string, student_id: string, image_url?: string) {
    return apiCall('/students', {
      method: 'POST',
      body: JSON.stringify({ name, student_id, image_url }),
    });
  },

  // Classes
  async getClasses() {
    return apiCall('/classes');
  },

  async createClass(name: string, description?: string) {
    return apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  // Attendance
  async markAttendance(student_id: number, class_id: number) {
    return apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify({ student_id, class_id }),
    });
  },

  async getAttendance(class_id: number) {
    return apiCall(`/attendance/${class_id}`);
  },
};
