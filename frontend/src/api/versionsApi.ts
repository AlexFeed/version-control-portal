import { fetchApi } from './apiClient';
import type { VersionWithDetails } from '../types';

interface VersionInput {
  version: string;
  description: string;
  changeDescriptions: string[];
}

const mapVersion = (backendVersion: any): VersionWithDetails => ({
  id: backendVersion.id,
  projectId: backendVersion.projectId,
  version: backendVersion.version,
  description: backendVersion.description,
  createdAt: backendVersion.createdAt || new Date().toISOString(),
  authorId: backendVersion.authorId,
  fileName: `release-${backendVersion.version}.zip`,
  fileSizeMb: 0,
  authorName: backendVersion.author?.login || 'Неизвестно',
  changes: backendVersion.changes || [],
});

export const getVersions = async (projectId: number): Promise<VersionWithDetails[]> => {
  const versions = await fetchApi('/versions');
  return versions
    .filter((v: any) => v.projectId === projectId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(mapVersion);
};

export const getVersion = async (id: number): Promise<VersionWithDetails | undefined> => {
  try {
    const version = await fetchApi(`/versions/${id}`);
    return mapVersion(version);
  } catch (e) {
    return undefined;
  }
};

export const createVersion = async (projectId: number, data: VersionInput, _authorId: number = 1): Promise<VersionWithDetails> => {
  const version = await fetchApi('/versions', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      version: data.version,
      description: data.description,
      changes: data.changeDescriptions,
    }),
  });
  return mapVersion(version);
};

export const updateVersion = async (id: number, data: VersionInput): Promise<VersionWithDetails> => {
  const version = await fetchApi(`/versions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      version: data.version,
      description: data.description,
      changes: data.changeDescriptions,
    }),
  });
  return mapVersion(version);
};

export const deleteVersion = async (id: number): Promise<void> => {
  return fetchApi(`/versions/${id}`, {
    method: 'DELETE',
  });
};
