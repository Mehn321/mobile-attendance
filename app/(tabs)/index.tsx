import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Route based on auth status
      if (user) {
        router.replace('/(app)/scanner');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, user, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
