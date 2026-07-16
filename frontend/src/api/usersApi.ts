import { fetchApi } from './apiClient';
import type { User, Role, MemberProject } from '../types';

const mapRole = (role: string): Role => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'DEVELOPER') return 'Developer';
  return 'Viewer';
};

const mapRoleToBackend = (role: Role): string => {
  return role.toUpperCase();
};

const mapUser = (backendUser: any): User => ({
  id: backendUser.id,
  name: backendUser.login,
  email: backendUser.login,
  role: mapRole(backendUser.role),
  createdAt: new Date().toISOString(), // Mock createdAt
  avatarUrl: backendUser.avatarUrl || undefined,
});

export const getUsers = async (): Promise<User[]> => {
  const users = await fetchApi('/users');
  return users.map(mapUser);
};

export const getUser = async (id: number): Promise<User | undefined> => {
  try {
    const user = await fetchApi(`/users/${id}`);
    return mapUser(user);
  } catch (e) {
    return undefined;
  }
};

export const createUser = async (data: { login: string; password?: string; role: Role }): Promise<User> => {
  const user = await fetchApi('/users', {
    method: 'POST',
    body: JSON.stringify({
      login: data.login,
      password: data.password || 'password123',
      role: mapRoleToBackend(data.role),
    }),
  });
  return mapUser(user);
};

export const updateUser = async (id: number, data: { login?: string; password?: string }): Promise<User> => {
  const user = await fetchApi(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ 
      ...(data.login && { login: data.login }),
      ...(data.password && { password: data.password }),
    }),
  });
  return mapUser(user);
};

export const updateUserRole = async (id: number, role: Role): Promise<User> => {
  const user = await fetchApi(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: mapRoleToBackend(role) }),
  });
  return mapUser(user);
};

export const deleteUser = async (id: number): Promise<void> => {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE',
  });
};

export const updateUserAvatar = async (id: number, file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('auth_token');
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`http://localhost:3000/users/${id}/avatar`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error('Ошибка загрузки аватара');
  }

  const user = await response.json();
  return mapUser(user);
};

export const findLoginUser = (_email?: string, _role?: any): User => {
  return { id: 1, name: 'Admin', email: 'admin@example.com', role: 'Admin', createdAt: new Date().toISOString() };
};

export const getUserProjects = async (userId: number): Promise<MemberProject[]> => {
  const projects = await fetchApi(`/users/${userId}/projects`);
  return projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status || 'in_progress',
    createdAt: new Date().toISOString(),
    addedAt: p.addedAt || new Date().toISOString(),
  }));
};

export const getActiveProjectCounts = async (): Promise<Record<number, number>> => {
  return {};
};
