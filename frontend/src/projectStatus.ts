import type { ProjectStatus } from './types';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: 'В разработке',
  on_hold: 'В ожидании',
  completed: 'Завершён',
  locked: 'Закрыт',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  in_progress: 'processing',
  on_hold: 'warning',
  completed: 'success',
  locked: 'error',
};

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = (
  Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map(value => ({ value, label: PROJECT_STATUS_LABELS[value] }));

// Любой статус кроме "в разработке" запрещает редактирование содержимого всем независимо от роли
// (для locked это дополнительно к полной блокировке просмотра для не-админов, см. isProjectLocked).
export function isProjectReadOnly(status: ProjectStatus): boolean {
  return status !== 'in_progress';
}

// locked: проект-"банкрот", содержимое недоступно для просмотра.
export function isProjectLocked(status: ProjectStatus): boolean {
  return status === 'locked';
}
