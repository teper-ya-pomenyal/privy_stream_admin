import { useCallback, useSyncExternalStore } from 'react';
import { auth } from '../api/endpoints';
import { getSession, setSession, subscribeSession } from '../api/session';
import type { AuthResponse } from '../api/types';

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession);
}

function store(userName: string, res: AuthResponse) {
  setSession({
    userUuid: res.user_uuid,
    userName,
    birthDate: res.birth_date,
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
  });
}

export function useAuthActions() {
  const login = useCallback(async (user_name: string, password: string) => {
    store(user_name, await auth.login({ user_name, password }));
  }, []);

  const register = useCallback(async (user_name: string, password: string, birth_date: string) => {
    store(user_name, await auth.register({ user_name, password, birth_date }));
  }, []);

  const logout = useCallback(async () => {
    const s = getSession();
    try {
      if (s) await auth.logout(s.refreshToken);
    } finally {
      setSession(null);
    }
  }, []);

  return { login, register, logout };
}
