import { fetchApi } from './apiClient';
import type { Project, ProjectStatus } from '../types';
import { mapUser } from './usersApi';

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

export const updateProject = async (id: number, projectData: { name?: string; description?: string }) => {
  return fetchApi(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(projectData),
  });
};

export const deleteProject = async (id: number) => {
  return fetchApi(`/projects/${id}`, {
    method: 'DELETE',
  });
};

export const getProjectMembers = async (id: number) => {
  const members = await fetchApi(`/projects/${id}/members`);
  return members.map(mapUser);
};

export const updateProjectMembers = async (id: number, userIds: number[]) => {
  return fetchApi(`/projects/${id}/members`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
};

export const addProjectMember = async (projectId: number, userId: number): Promise<void> => {
  const members = await getProjectMembers(projectId);
  const userIds = members.map((m: any) => m.id);
  if (!userIds.includes(userId)) {
    userIds.push(userId);
    await updateProjectMembers(projectId, userIds);
  }
};

export const removeProjectMember = async (projectId: number, userId: number): Promise<void> => {
  const members = await getProjectMembers(projectId);
  const userIds = members.map((m: any) => m.id).filter((id: number) => id !== userId);
  await updateProjectMembers(projectId, userIds);
};

// --- Mocks for features not supported by backend ---
export const updateProjectStatus = async (id: number, status: ProjectStatus): Promise<Project> => {
  const p = await getProject(id);
  if (!p) throw new Error('Not found');
  return { ...p, status };
};


