import { projects, users, projectMembers, takeNextProjectId } from './mockData';
import type { Project, ProjectMember, ProjectStatus } from '../types';

const DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), DELAY_MS));
}

export function getProjects(): Promise<Project[]> {
  return delay([...projects]);
}

export function getProject(id: number): Promise<Project | undefined> {
  return delay(projects.find(p => p.id === id));
}

export function createProject(data: { name: string; description: string }): Promise<Project> {
  const project: Project = { id: takeNextProjectId(), ...data, status: 'in_progress', createdAt: new Date().toISOString().slice(0, 10) };
  projects.push(project);
  return delay(project);
}

export function updateProject(id: number, data: { name: string; description: string }): Promise<Project> {
  const project = projects.find(p => p.id === id);
  if (!project) throw new Error(`Project ${id} not found`);
  project.name = data.name;
  project.description = data.description;
  return delay(project);
}

export function updateProjectStatus(id: number, status: ProjectStatus): Promise<Project> {
  const project = projects.find(p => p.id === id);
  if (!project) throw new Error(`Project ${id} not found`);
  project.status = status;
  return delay(project);
}

export function deleteProject(id: number): Promise<void> {
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) projects.splice(index, 1);
  for (let i = projectMembers.length - 1; i >= 0; i--) {
    if (projectMembers[i].projectId === id) projectMembers.splice(i, 1);
  }
  return delay(undefined);
}

export function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  const entries = projectMembers.filter(m => m.projectId === projectId);
  const members = entries
    .map(entry => {
      const user = users.find(u => u.id === entry.userId);
      return user ? { ...user, addedAt: entry.addedAt } : undefined;
    })
    .filter((m): m is ProjectMember => m !== undefined);
  return delay(members);
}

export function addProjectMember(projectId: number, userId: number): Promise<void> {
  const exists = projectMembers.some(m => m.projectId === projectId && m.userId === userId);
  if (!exists) projectMembers.push({ projectId, userId, addedAt: new Date().toISOString().slice(0, 10) });
  return delay(undefined);
}

export function removeProjectMember(projectId: number, userId: number): Promise<void> {
  const index = projectMembers.findIndex(m => m.projectId === projectId && m.userId === userId);
  if (index !== -1) projectMembers.splice(index, 1);
  return delay(undefined);
}
