import { fetchApi } from './apiClient';
import type { Project, ProjectMember, ProjectStatus } from '../types';

const mapProject = (backendProject: any): Project => ({
  id: backendProject.id,
  name: backendProject.name,
  description: backendProject.description,
  status: 'in_progress', // Mock status as backend doesn't have it
  createdAt: new Date().toISOString(), // Mock date as backend doesn't have it
});

export const getProjects = async (): Promise<Project[]> => {
  const projects = await fetchApi('/projects');
  return projects.map(mapProject);
};

export const getProject = async (id: number): Promise<Project | undefined> => {
  try {
    const project = await fetchApi(`/projects/${id}`);
    return mapProject(project);
  } catch (e) {
    return undefined;
  }
};

export const createProject = async (data: { name: string; description: string }): Promise<Project> => {
  const project = await fetchApi('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapProject(project);
};

export const updateProject = async (id: number, data: { name?: string; description?: string }): Promise<Project> => {
  const project = await fetchApi(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return mapProject(project);
};

export const deleteProject = async (id: number): Promise<void> => {
  return fetchApi(`/projects/${id}`, {
    method: 'DELETE',
  });
};

// --- Mocks for features not supported by backend ---
export const updateProjectStatus = async (id: number, status: ProjectStatus): Promise<Project> => {
  const p = await getProject(id);
  if (!p) throw new Error('Not found');
  return { ...p, status };
};

export const getProjectMembers = async (_projectId: number): Promise<ProjectMember[]> => {
  return [];
};

export const addProjectMember = async (_projectId: number, _userId: number): Promise<void> => {
  return Promise.resolve();
};

export const removeProjectMember = async (_projectId: number, _userId: number): Promise<void> => {
  return Promise.resolve();
};
