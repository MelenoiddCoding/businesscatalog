"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  ApiRequestError,
  type AuthSessionResponse,
  type AuthUser,
  getMyProfile,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser
} from "@/lib/api";

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number;
  user: AuthUser | null;
};

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  runWithSession: <T>(fn: (accessToken: string) => Promise<T>) => Promise<T>;
  refreshProfile: () => Promise<AuthUser>;
};

const SESSION_STORAGE_KEY = "tepic_catalog_session_v1";
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 30_000;

const AuthContext = createContext<AuthContextValue | null>(null);

function parseStoredSession(value: string | null): StoredSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredSession>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.tokenType !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      tokenType: parsed.tokenType,
      expiresAt: parsed.expiresAt,
      user: parsed.user ?? null
    };
  } catch {
    return null;
  }
}

function buildStoredSessionFromAuth(payload: AuthSessionResponse): StoredSession {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type,
    expiresAt: Date.now() + payload.expires_in * 1000,
    user: payload.user
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const sessionRef = useRef<StoredSession | null>(null);

  const persistSession = useCallback((next: StoredSession | null) => {
    setSession(next);
    sessionRef.current = next;

    if (typeof window === "undefined") {
      return;
    }

    if (next) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const fromStorage = parseStoredSession(window.localStorage.getItem(SESSION_STORAGE_KEY));
    if (fromStorage) {
      setSession(fromStorage);
      sessionRef.current = fromStorage;
    }

    setIsReady(true);
  }, []);

  const clearSession = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const refreshCurrentSession = useCallback(
    async (current: StoredSession): Promise<StoredSession> => {
      const refreshed = await refreshSession(apiUrl, current.refreshToken);
      const next: StoredSession = {
        ...current,
        accessToken: refreshed.access_token,
        tokenType: refreshed.token_type,
        expiresAt: Date.now() + refreshed.expires_in * 1000
      };
      persistSession(next);
      return next;
    },
    [apiUrl, persistSession]
  );

  const ensureFreshAccessToken = useCallback(
    async (current: StoredSession): Promise<StoredSession> => {
      const now = Date.now();
      if (current.expiresAt > now + ACCESS_TOKEN_REFRESH_WINDOW_MS) {
        return current;
      }

      return refreshCurrentSession(current);
    },
    [refreshCurrentSession]
  );

  const runWithSession = useCallback(
    async <T,>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
      const current = sessionRef.current;
      if (!current) {
        throw new ApiRequestError("Debes iniciar sesion para continuar.", 401);
      }

      let activeSession = current;

      try {
        activeSession = await ensureFreshAccessToken(activeSession);
        return await fn(activeSession.accessToken);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          try {
            activeSession = await refreshCurrentSession(current);
            return await fn(activeSession.accessToken);
          } catch {
            clearSession();
            throw new ApiRequestError("Tu sesion expiro. Inicia sesion nuevamente.", 401);
          }
        }

        throw error;
      }
    },
    [clearSession, ensureFreshAccessToken, refreshCurrentSession]
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const payload = await loginUser(apiUrl, input);
      persistSession(buildStoredSessionFromAuth(payload));
    },
    [apiUrl, persistSession]
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const payload = await registerUser(apiUrl, input);
      persistSession(buildStoredSessionFromAuth(payload));
    },
    [apiUrl, persistSession]
  );

  const refreshProfile = useCallback(async (): Promise<AuthUser> => {
    const profile = await runWithSession((accessToken) => getMyProfile(apiUrl, accessToken));

    const current = sessionRef.current;
    if (current) {
      const next: StoredSession = {
        ...current,
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url
        }
      };
      persistSession(next);
      return next.user as AuthUser;
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url
    };
  }, [apiUrl, persistSession, runWithSession]);

  const logout = useCallback(async () => {
    const current = sessionRef.current;

    if (current) {
      try {
        await logoutUser(apiUrl, current.accessToken);
      } catch (error) {
        if (!(error instanceof ApiRequestError && error.status === 401)) {
          throw error;
        }
      }
    }

    clearSession();
  }, [apiUrl, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(session),
      user: session?.user ?? null,
      login,
      register,
      logout,
      runWithSession,
      refreshProfile
    }),
    [isReady, session, login, register, logout, runWithSession, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
