import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role } from '../types';
import { getUser } from '../api/usersApi';

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
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      const tokenStr = token.split('.')[1];
      const payload = JSON.parse(atob(tokenStr));
      const roleMapped = payload.role === 'ADMIN' ? 'Admin' : payload.role === 'DEVELOPER' ? 'Developer' : 'Viewer';
      return { id: payload.sub, name: payload.login || 'Сотрудник', role: roleMapped, email: '' };
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      getUser(user.id).then(u => {
        if (u) {
          setUser(prev => prev ? { ...prev, name: u.name, avatarUrl: u.avatarUrl || prev.avatarUrl } : prev);
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  const login = (id: number, name: string, role: Role, email?: string, avatarUrl?: string) =>
    setUser({ id, name, role, email, avatarUrl });
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };
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
