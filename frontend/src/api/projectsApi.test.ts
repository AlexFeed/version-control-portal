import { describe, it, expect } from 'vitest';
import { getProjects, createProject, updateProject, deleteProject, getProjectMembers, addProjectMember, removeProjectMember } from './projectsApi';

describe('projectsApi', () => {
  it('creates a project and returns it in getProjects', async () => {
    const before = await getProjects();
    const created = await createProject({ name: 'Test Project', description: 'desc' });
    const after = await getProjects();

    expect(after.length).toBe(before.length + 1);
    expect(created.name).toBe('Test Project');
    expect(after.find(p => p.id === created.id)).toEqual(created);
  });

  it('updates a project in place', async () => {
    const created = await createProject({ name: 'Before', description: 'before-desc' });
    const updated = await updateProject(created.id, { name: 'After', description: 'after-desc' });

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe('After');
  });

  it('deletes a project', async () => {
    const created = await createProject({ name: 'To Delete', description: 'x' });
    await deleteProject(created.id);
    const after = await getProjects();

    expect(after.find(p => p.id === created.id)).toBeUndefined();
  });

  it('adds and removes a project member', async () => {
    const project = await createProject({ name: 'Members Test', description: 'x' });

    await addProjectMember(project.id, 1);
    const withMember = await getProjectMembers(project.id);
    expect(withMember.some(u => u.id === 1)).toBe(true);
    expect(withMember.find(u => u.id === 1)?.addedAt).toEqual(expect.any(String));

    await removeProjectMember(project.id, 1);
    const withoutMember = await getProjectMembers(project.id);
    expect(withoutMember.some(u => u.id === 1)).toBe(false);
  });

  it('does not duplicate a member added twice', async () => {
    const project = await createProject({ name: 'Members Dedup', description: 'x' });

    await addProjectMember(project.id, 2);
    await addProjectMember(project.id, 2);
    const members = await getProjectMembers(project.id);

    expect(members.filter(u => u.id === 2).length).toBe(1);
  });
});
