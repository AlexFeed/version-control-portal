export type Role = 'Viewer' | 'Developer' | 'Admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string; // ISO date string
  avatarUrl?: string;
}

// in_progress: полный доступ (просмотр и редактирование).
// on_hold / completed: доступ только на просмотр, редактирование запрещено всем.
// locked: проект полностью недоступен для просмотра ("банкрот").
export type ProjectStatus = 'in_progress' | 'on_hold' | 'completed' | 'locked';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string; // ISO date string
}

// Project member joined with the join-record's own addedAt, so the UI can
// show it without a separate lookup.
export interface ProjectMember extends User {
  addedAt: string; // ISO date string
}

// Project joined with the join-record's own addedAt, for a user's project list.
export interface MemberProject extends Project {
  addedAt: string; // ISO date string
}

export interface Change {
  id: number;
  versionId: number;
  description: string;
}

export interface Version {
  id: number;
  projectId: number;
  version: string;
  description: string;
  createdAt: string; // ISO date string
  authorId: number;
  fileName: string; // decorative only, e.g. "release-1.2.0.zip"
  fileSizeMb: number; // decorative only, e.g. 24.5
}

// Version joined with its author's name and its list of changes,
// used by the UI so components don't have to look up the author separately.
export interface VersionWithDetails extends Version {
  authorName: string;
  changes: Change[];
}
