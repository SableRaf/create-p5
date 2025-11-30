import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchVersions, isStableVersion, filterStableVersions } from '../src/version.js';

let originalFetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('isStableVersion', () => {
  it('returns true for stable versions (X.Y.Z format)', () => {
    expect(isStableVersion('1.9.0')).toBe(true);
    expect(isStableVersion('2.1.1')).toBe(true);
    expect(isStableVersion('0.0.1')).toBe(true);
    expect(isStableVersion('10.20.30')).toBe(true);
  });

  it('returns false for pre-release versions', () => {
    expect(isStableVersion('2.1.0-rc.1')).toBe(false);
    expect(isStableVersion('1.9.0-beta.2')).toBe(false);
    expect(isStableVersion('1.8.0-alpha.1')).toBe(false);
    expect(isStableVersion('2.0.0-rc.4')).toBe(false);
  });

  it('returns false for invalid version formats', () => {
    expect(isStableVersion('1.9')).toBe(false);
    expect(isStableVersion('v1.9.0')).toBe(false);
    expect(isStableVersion('1.9.0.0')).toBe(false);
    expect(isStableVersion('')).toBe(false);
  });
});

describe('filterStableVersions', () => {
  it('filters out pre-release versions and keeps stable versions', () => {
    const versions = ['2.1.1', '2.1.0', '2.1.0-rc.4', '2.1.0-rc.3', '2.0.0', '1.9.0-beta.1'];
    const result = filterStableVersions(versions);
    expect(result).toEqual(['2.1.1', '2.1.0', '2.0.0']);
  });

  it('returns empty array if no stable versions exist', () => {
    const versions = ['2.1.0-rc.1', '2.0.0-beta.1', '1.9.0-alpha.1'];
    const result = filterStableVersions(versions);
    expect(result).toEqual([]);
  });

  it('returns all versions if all are stable', () => {
    const versions = ['2.1.1', '2.1.0', '2.0.0', '1.9.0'];
    const result = filterStableVersions(versions);
    expect(result).toEqual(versions);
  });

  it('handles empty array', () => {
    const result = filterStableVersions([]);
    expect(result).toEqual([]);
  });
});

describe('fetchVersions', () => {
  it('returns latest and versions array from mocked API', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ tags: { latest: '1.9.0' }, versions: ['1.9.0', '1.8.1', '1.8.0'] })
    });

    const result = await fetchVersions();
    expect(result).toHaveProperty('latest', '1.9.0');
    expect(Array.isArray(result.versions)).toBe(true);
    expect(result.versions.length).toBeGreaterThan(0);
  });

  it('filters out pre-release versions by default', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '2.1.1' },
        versions: ['2.1.1', '2.1.0', '2.1.0-rc.4', '2.1.0-rc.3', '2.0.0', '1.9.0']
      })
    });

    const result = await fetchVersions();
    expect(result.latest).toBe('2.1.1');
    expect(result.versions).toEqual(['2.1.1', '2.1.0', '2.0.0', '1.9.0']);
    expect(result.versions).not.toContain('2.1.0-rc.4');
    expect(result.versions).not.toContain('2.1.0-rc.3');
  });

  it('includes pre-release versions when includePrerelease is true', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '2.1.1' },
        versions: ['2.1.1', '2.1.0', '2.1.0-rc.4', '2.1.0-rc.3', '2.0.0', '1.9.0']
      })
    });

    const result = await fetchVersions(true);
    expect(result.latest).toBe('2.1.1');
    expect(result.versions).toEqual(['2.1.1', '2.1.0', '2.1.0-rc.4', '2.1.0-rc.3', '2.0.0', '1.9.0']);
    expect(result.versions).toContain('2.1.0-rc.4');
    expect(result.versions).toContain('2.1.0-rc.3');
  });

  it('returns long list of versions without limits', async () => {
    // Create 999 stable versions
    const manyVersions = Array.from({ length: 999 }, (_, i) => `${999 - i}.0.0`);

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '999.0.0' },
        versions: manyVersions
      })
    });

    const result = await fetchVersions();
    expect(result.versions.length).toBe(999);
    expect(result.versions).toEqual(manyVersions);
  });

  it('returns all stable versions when includePrerelease is false', async () => {
    // Create 20 versions: 10 stable + 10 pre-release
    const manyVersions = [
      ...Array.from({ length: 10 }, (_, i) => `${20 - i}.0.0`),
      ...Array.from({ length: 10 }, (_, i) => `${10 - i}.0.0-rc.1`)
    ];

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '20.0.0' },
        versions: manyVersions
      })
    });

    const result = await fetchVersions(false);
    // Should only have 10 stable versions (all pre-release filtered out)
    expect(result.versions.length).toBe(10);
    // Verify none are pre-release
    expect(result.versions.every(v => isStableVersion(v))).toBe(true);
  });

  // Handle other pre-release labels as well (e.g. -beta, -alpha, -beta.1, etc.)
  it('excludes unusual prerelease tags when includePrerelease is false', async () => {
    const versionsWithVariousLabels = [
      '2.1.0',
      '2.1.0-beta',
      '2.1.0-beta.1',
      '2.1.0-alpha',
      '2.1.0-alpha.2',
      '2.0.0-rc.1',
      '2.0.0',
      '1.9.0-dev',
      '1.9.0-next.3',
      '1.8.0'
    ];

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '2.1.0' },
        versions: versionsWithVariousLabels
      })
    });

    const result = await fetchVersions(false);
    // Should only have stable versions (2.1.0, 2.0.0, 1.8.0)
    expect(result.versions).toEqual(['2.1.0', '2.0.0', '1.8.0']);
    expect(result.versions).not.toContain('2.1.0-beta');
    expect(result.versions).not.toContain('2.1.0-beta.1');
    expect(result.versions).not.toContain('2.1.0-alpha');
    expect(result.versions).not.toContain('2.1.0-alpha.2');
    expect(result.versions).not.toContain('2.0.0-rc.1');
    expect(result.versions).not.toContain('1.9.0-dev');
    expect(result.versions).not.toContain('1.9.0-next.3');
  });

  it('includes unusual prerelease tags when includePrerelease is true', async () => {
    const versionsWithVariousLabels = [
      '2.1.0',
      '2.1.0-beta',
      '2.1.0-beta.1',
      '2.1.0-alpha',
      '2.1.0-alpha.2',
      '2.0.0-rc.1',
      '2.0.0',
      '1.9.0-dev',
      '1.9.0-next.3',
      '1.8.0'
    ];

    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        tags: { latest: '2.1.0' },
        versions: versionsWithVariousLabels
      })
    });

    const result = await fetchVersions(true);
    // Should include all versions (stable and pre-release)
    expect(result.versions).toEqual(versionsWithVariousLabels);
    expect(result.versions).toContain('2.1.0-beta');
    expect(result.versions).toContain('2.1.0-beta.1');
    expect(result.versions).toContain('2.1.0-alpha');
    expect(result.versions).toContain('2.1.0-alpha.2');
    expect(result.versions).toContain('2.0.0-rc.1');
    expect(result.versions).toContain('1.9.0-dev');
    expect(result.versions).toContain('1.9.0-next.3');
  });
});
