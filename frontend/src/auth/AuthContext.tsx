import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Role } from '../types';

interface CurrentUser {
  id: number;
  name: string;
  role: Role;
  email?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  login: (id: number, name: string, role: Role, email?: string, avatarUrl?: string) => void;
  logout: () => void;
  updateAvatar: (avatarUrl: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const login = (id: number, name: string, role: Role, email?: string, avatarUrl?: string) =>
    setUser({ id, name, role, email, avatarUrl });
  const logout = () => setUser(null);
  const updateAvatar = (avatarUrl: string) => setUser(prev => (prev ? { ...prev, avatarUrl } : prev));

  return (
    <AuthContext.Provider value={{ user, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
