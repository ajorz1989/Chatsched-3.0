import { useAuthStore } from '../stores/auth-store';
import { useMemo } from 'react';

export function useAuth() {
  const { user, session, isLoading, signOut } = useAuthStore();

  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signOut,
  };
}
