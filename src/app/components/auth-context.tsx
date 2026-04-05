import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; token?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; token?: string }>;
  signOut: () => Promise<void>;
}

// Create context with default value to prevent multiple instance issues
const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  loading: true,
  signIn: async () => ({ error: "Not initialized" }),
  signUp: async () => ({ error: "Not initialized" }),
  signOut: async () => {},
});

const STORAGE_KEY = "mock_auth_user";
const USERS_DB_KEY = "mock_users_db";

interface UserRecord {
  email: string;
  password: string;
  name: string;
  id: string;
}

function getUsersDB(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsersDB(users: UserRecord[]) {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        setUser(stored.user);
        setAccessToken(stored.token);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string; token?: string }> => {
    const users = getUsersDB();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (exists) {
      return { error: "Bu e-posta adresi zaten kayıtlı" };
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      email,
      password, // In production this should be hashed
      name
    };

    users.push(newUser);
    saveUsersDB(users);

    const mockUser: AuthUser = { id: newUser.id, email: newUser.email, name: newUser.name };
    const mockToken = "mock-token-" + Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser, token: mockToken }));
    setUser(mockUser);
    setAccessToken(mockToken);
    return { token: mockToken };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string; token?: string }> => {
    const users = getUsersDB();
    const userRecord = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userRecord) {
      return { error: "E-posta veya şifre hatalı" };
    }

    if (userRecord.password !== password) {
      return { error: "E-posta veya şifre hatalı" };
    }

    const mockUser: AuthUser = { id: userRecord.id, email: userRecord.email, name: userRecord.name };
    const mockToken = "mock-token-" + Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser, token: mockToken }));
    setUser(mockUser);
    setAccessToken(mockToken);
    return { token: mockToken };
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  // No longer need null check since we have default value
  return ctx;
}
