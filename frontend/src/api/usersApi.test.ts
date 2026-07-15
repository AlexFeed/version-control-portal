import { describe, it, expect } from 'vitest';
import { getUsers, createUser, updateUser, updateUserRole, deleteUser, getUser, getUserProjects } from './usersApi';

describe('usersApi', () => {
  it('creates a user', async () => {
    const created = await createUser({ name: 'Test User', email: 'test@example.com', role: 'Viewer' });
    const list = await getUsers();

    expect(created.role).toBe('Viewer');
    expect(list.find(u => u.id === created.id)).toEqual(created);
  });

  it('updates a user role', async () => {
    const created = await createUser({ name: 'Role Test', email: 'role@example.com', role: 'Viewer' });
    const updated = await updateUserRole(created.id, 'Admin');

    expect(updated.role).toBe('Admin');
  });

  it('updates a user name and email', async () => {
    const created = await createUser({ name: 'Before Name', email: 'before@example.com', role: 'Viewer' });
    const updated = await updateUser(created.id, { name: 'After Name', email: 'after@example.com' });

    expect(updated.name).toBe('After Name');
    expect(updated.email).toBe('after@example.com');
  });

  it('deletes a user', async () => {
    const created = await createUser({ name: 'Delete Me', email: 'delete@example.com', role: 'Viewer' });
    await deleteUser(created.id);
    const list = await getUsers();

    expect(list.find(u => u.id === created.id)).toBeUndefined();
  });

  it('gets a user by id', async () => {
    const user = await getUser(1);
    expect(user?.name).toBe('Алексей Иванов');
  });

  it('returns undefined for an unknown user id', async () => {
    const user = await getUser(9999);
    expect(user).toBeUndefined();
  });

  it('gets the projects a user participates in', async () => {
    const userProjects = await getUserProjects(1);
    expect(userProjects.map(p => p.id).sort((a, b) => a - b)).toEqual([1, 2, 3, 5]);
  });

  it('returns an empty list for a user with no projects', async () => {
    const created = await createUser({ name: 'No Projects', email: 'noprojects@example.com', role: 'Viewer' });
    const userProjects = await getUserProjects(created.id);
    expect(userProjects).toEqual([]);
  });
});
