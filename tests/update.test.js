import { describe, it, expect, vi } from 'vitest';

// Mock config functions to simulate non-create-p5 project
vi.mock('../src/config.js', () => ({
  readConfig: vi.fn(async () => null),
  migrateConfigIfNeeded: vi.fn(async () => ({ migrated: false, error: null }))
}));

import { update } from '../src/operations/update.js';

describe('update workflow', () => {
  it('exits when no .p5-config.json found', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    await update();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
