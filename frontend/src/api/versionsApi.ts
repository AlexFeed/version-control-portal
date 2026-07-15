import { versions, changes, users, takeNextVersionId, takeNextChangeId } from './mockData';
import type { VersionWithDetails } from '../types';

const DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), DELAY_MS));
}

function toVersionWithDetails(versionId: number): VersionWithDetails {
  const version = versions.find(v => v.id === versionId);
  if (!version) throw new Error(`Version ${versionId} not found`);
  const author = users.find(u => u.id === version.authorId);
  const versionChanges = changes.filter(c => c.versionId === versionId);
  return { ...version, authorName: author?.name ?? 'Неизвестно', changes: versionChanges };
}

export function getVersions(projectId: number): Promise<VersionWithDetails[]> {
  const list = versions
    .filter(v => v.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(v => toVersionWithDetails(v.id));
  return delay(list);
}

export function getVersion(id: number): Promise<VersionWithDetails | undefined> {
  const exists = versions.some(v => v.id === id);
  return delay(exists ? toVersionWithDetails(id) : undefined);
}

interface VersionInput {
  version: string;
  description: string;
  changeDescriptions: string[];
}

export function createVersion(projectId: number, data: VersionInput, authorId = 1): Promise<VersionWithDetails> {
  const id = takeNextVersionId();
  versions.push({
    id,
    projectId,
    version: data.version,
    description: data.description,
    createdAt: new Date().toISOString().slice(0, 10),
    authorId,
    fileName: `release-${data.version}.zip`,
    fileSizeMb: 0,
  });
  data.changeDescriptions.forEach(description => {
    changes.push({ id: takeNextChangeId(), versionId: id, description });
  });
  return delay(toVersionWithDetails(id));
}

export function updateVersion(id: number, data: VersionInput): Promise<VersionWithDetails> {
  const version = versions.find(v => v.id === id);
  if (!version) throw new Error(`Version ${id} not found`);
  version.version = data.version;
  version.description = data.description;

  for (let i = changes.length - 1; i >= 0; i--) {
    if (changes[i].versionId === id) changes.splice(i, 1);
  }
  data.changeDescriptions.forEach(description => {
    changes.push({ id: takeNextChangeId(), versionId: id, description });
  });

  return delay(toVersionWithDetails(id));
}

export function deleteVersion(id: number): Promise<void> {
  const index = versions.findIndex(v => v.id === id);
  if (index !== -1) versions.splice(index, 1);
  for (let i = changes.length - 1; i >= 0; i--) {
    if (changes[i].versionId === id) changes.splice(i, 1);
  }
  return delay(undefined);
}
