import type { User, Project, Version, Change } from '../types';

export const users: User[] = [
  { id: 1, name: 'Алексей Иванов', email: 'alexey.ivanov@example.com', role: 'Admin', createdAt: '2026-07-10' },
  { id: 2, name: 'Мария Петрова', email: 'maria.petrova@example.com', role: 'Developer', createdAt: '2026-07-09' },
  { id: 3, name: 'Иван Смирнов', email: 'ivan.smirnov@example.com', role: 'Developer', createdAt: '2026-07-08' },
  { id: 4, name: 'Анна Новикова', email: 'anna.novikova@example.com', role: 'Viewer', createdAt: '2026-07-07' },
  { id: 5, name: 'Дмитрий Соколов', email: 'dmitry.sokolov@example.com', role: 'Developer', createdAt: '2026-07-06' },
  { id: 6, name: 'Екатерина Кузнецова', email: 'ekaterina.kuznetsova@example.com', role: 'Viewer', createdAt: '2026-07-05' },
];

export const projects: Project[] = [
  { id: 1, name: 'CRM', description: 'Система управления клиентами', status: 'in_progress', createdAt: '2026-06-01' },
  { id: 2, name: 'ERP', description: 'Система управления ресурсами предприятия', status: 'on_hold', createdAt: '2026-06-10' },
  { id: 3, name: 'Маркетплейс', description: 'Платформа для онлайн-продаж', status: 'completed', createdAt: '2026-06-18' },
  { id: 4, name: 'Мобильное приложение', description: 'Приложение для iOS и Android', status: 'locked', createdAt: '2026-07-05' },
  { id: 5, name: 'Аналитика', description: 'Система аналитики и отчётности', status: 'in_progress', createdAt: '2026-07-14' },
];

export const versions: Version[] = [
  { id: 1, projectId: 1, version: '1.2.0', description: 'Добавлена интеграция с платёжным шлюзом Stripe. Оптимизированы запросы к базе данных, улучшена производительность системы.', createdAt: '2026-07-10', authorId: 1, fileName: 'release-1.2.0.zip', fileSizeMb: 24.5 },
  { id: 2, projectId: 1, version: '1.1.0', description: 'Исправлены ошибки в модуле отчётов, обновлён интерфейс.', createdAt: '2026-06-25', authorId: 2, fileName: 'release-1.1.0.zip', fileSizeMb: 21.2 },
  { id: 3, projectId: 1, version: '1.0.0', description: 'Первый стабильный релиз системы.', createdAt: '2026-06-15', authorId: 3, fileName: 'release-1.0.0.zip', fileSizeMb: 19.8 },
  { id: 4, projectId: 1, version: '0.9.0', description: 'Бета-версия для тестирования.', createdAt: '2026-06-05', authorId: 1, fileName: 'release-0.9.0.zip', fileSizeMb: 18.0 },
  { id: 5, projectId: 1, version: '0.8.0', description: 'Добавлен модуль управления задачами.', createdAt: '2026-05-28', authorId: 2, fileName: 'release-0.8.0.zip', fileSizeMb: 16.4 },
  { id: 6, projectId: 2, version: '1.0.0', description: 'Первый релиз ERP-системы.', createdAt: '2026-06-20', authorId: 3, fileName: 'release-1.0.0.zip', fileSizeMb: 30.1 },
  { id: 7, projectId: 3, version: '1.0.0', description: 'Запуск маркетплейса.', createdAt: '2026-06-18', authorId: 1, fileName: 'release-1.0.0.zip', fileSizeMb: 28.7 },
  { id: 8, projectId: 4, version: '1.0.0', description: 'Первая версия мобильного приложения.', createdAt: '2026-06-10', authorId: 5, fileName: 'release-1.0.0.zip', fileSizeMb: 12.3 },
  { id: 9, projectId: 5, version: '1.0.0', description: 'Первая версия системы аналитики.', createdAt: '2026-05-30', authorId: 1, fileName: 'release-1.0.0.zip', fileSizeMb: 9.6 },
];

export const changes: Change[] = [
  { id: 1, versionId: 1, description: 'Добавлена регистрация пользователей' },
  { id: 2, versionId: 1, description: 'Исправлена работа поиска' },
  { id: 3, versionId: 1, description: 'Добавлен экспорт PDF' },
  { id: 4, versionId: 2, description: 'Исправлена сортировка в таблице отчётов' },
  { id: 5, versionId: 2, description: 'Обновлён дизайн боковой панели' },
  { id: 6, versionId: 3, description: 'Реализован базовый функционал CRM' },
];

// Дополнительная связь "проект — участники", не входит в сущности ТЗ.
// Нужна только для того, чтобы Admin мог явно закрепить пользователей за проектом в UI;
// на реальный доступ (он определяется глобальной ролью) не влияет.
export const projectMembers: { projectId: number; userId: number; addedAt: string }[] = [
  { projectId: 1, userId: 1, addedAt: '2026-05-20' },
  { projectId: 1, userId: 2, addedAt: '2026-05-22' },
  { projectId: 1, userId: 3, addedAt: '2026-05-25' },
  { projectId: 2, userId: 1, addedAt: '2026-06-01' },
  { projectId: 2, userId: 3, addedAt: '2026-06-02' },
  { projectId: 3, userId: 1, addedAt: '2026-06-05' },
  { projectId: 4, userId: 5, addedAt: '2026-05-25' },
  { projectId: 5, userId: 1, addedAt: '2026-05-15' },
];

export let nextUserId = 7;
export let nextProjectId = 6;
export let nextVersionId = 10;
export let nextChangeId = 7;

export function takeNextUserId() { return nextUserId++; }
export function takeNextProjectId() { return nextProjectId++; }
export function takeNextVersionId() { return nextVersionId++; }
export function takeNextChangeId() { return nextChangeId++; }
