import { describe, it, expect } from 'vitest';
import { getVersions, createVersion, updateVersion, deleteVersion } from './versionsApi';

describe('versionsApi', () => {
  it('creates a version with changes under a project', async () => {
    const created = await createVersion(1, {
      version: '2.0.0-test',
      description: 'test version',
      changeDescriptions: ['change A', 'change B'],
    });

    expect(created.version).toBe('2.0.0-test');
    expect(created.projectId).toBe(1);
    expect(created.changes.map(c => c.description)).toEqual(['change A', 'change B']);
    expect(created.authorName).toBeTruthy();

    const list = await getVersions(1);
    expect(list.find(v => v.id === created.id)).toBeTruthy();
  });

  it('updates a version and replaces its changes', async () => {
    const created = await createVersion(1, {
      version: '2.0.1-test',
      description: 'before',
      changeDescriptions: ['old change'],
    });

    const updated = await updateVersion(created.id, {
      version: '2.0.2-test',
      description: 'after',
      changeDescriptions: ['new change 1', 'new change 2'],
    });

    expect(updated.version).toBe('2.0.2-test');
    expect(updated.changes.map(c => c.description)).toEqual(['new change 1', 'new change 2']);
  });

  it('deletes a version', async () => {
    const created = await createVersion(1, {
      version: '2.0.3-test',
      description: 'to delete',
      changeDescriptions: [],
    });
    await deleteVersion(created.id);

    const list = await getVersions(1);
    expect(list.find(v => v.id === created.id)).toBeUndefined();
  });
});
