import { users, projects, projectMembers, takeNextUserId } from './mockData';
import type { User, Role, MemberProject } from '../types';

const DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), DELAY_MS));
}

export function getUsers(): Promise<User[]> {
  return delay([...users]);
}

export function createUser(data: { name: string; email: string; role: Role }): Promise<User> {
  const user: User = { id: takeNextUserId(), ...data, createdAt: new Date().toISOString().slice(0, 10) };
  users.push(user);
  return delay(user);
}

export function updateUserRole(id: number, role: Role): Promise<User> {
  const user = users.find(u => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  user.role = role;
  return delay(user);
}

export function updateUser(id: number, data: { name: string; email: string }): Promise<User> {
  const user = users.find(u => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  user.name = data.name;
  user.email = data.email;
  return delay(user);
}

export function updateUserAvatar(id: number, avatarUrl: string): Promise<User> {
  const user = users.find(u => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  user.avatarUrl = avatarUrl;
  return delay(user);
}

// Resolves the demo login to a real mock user so profile edits (like avatar)
// are visible in the users/members tables instead of being a disconnected identity.
export function findLoginUser(email?: string, role?: Role): User {
  const normalizedEmail = email?.trim().toLowerCase();
  const byEmail = normalizedEmail ? users.find(u => u.email.toLowerCase() === normalizedEmail) : undefined;
  return byEmail ?? users.find(u => u.role === role) ?? users[0];
}

export function deleteUser(id: number): Promise<void> {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) users.splice(index, 1);
  for (let i = projectMembers.length - 1; i >= 0; i--) {
    if (projectMembers[i].userId === id) projectMembers.splice(i, 1);
  }
  return delay(undefined);
}

export function getUser(id: number): Promise<User | undefined> {
  return delay(users.find(u => u.id === id));
}

export function getUserProjects(userId: number): Promise<MemberProject[]> {
  const memberProjects = projectMembers
    .filter(m => m.userId === userId)
    .map(m => {
      const project = projects.find(p => p.id === m.projectId);
      return project ? { ...project, addedAt: m.addedAt } : undefined;
    })
    .filter((p): p is MemberProject => p !== undefined);
  return delay(memberProjects);
}

export function getActiveProjectCounts(): Promise<Record<number, number>> {
  const counts: Record<number, number> = {};
  for (const m of projectMembers) {
    const project = projects.find(p => p.id === m.projectId);
    if (project?.status === 'in_progress') counts[m.userId] = (counts[m.userId] ?? 0) + 1;
  }
  return delay(counts);
}
