import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { downloadTypeDefinitions, parseVersion, getTypesStrategy } from '../src/version.js';

let originalFetch;
const tmpDir = path.join('tests', 'tmp-types');

beforeEach(async () => {
  originalFetch = globalThis.fetch;
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('parseVersion', () => {
  it('parses stable versions correctly', () => {
    const result = parseVersion('1.9.0');
    expect(result).toEqual({ major: 1, minor: 9, patch: 0, prerelease: null });
  });

  it('parses prerelease versions correctly', () => {
    const result = parseVersion('2.1.0-rc.1');
    expect(result).toEqual({ major: 2, minor: 1, patch: 0, prerelease: 'rc.1' });
  });

  it('throws on invalid version strings', () => {
    expect(() => parseVersion('invalid')).toThrow('Invalid semver version');
  });
});

describe('getTypesStrategy', () => {
  it('uses @types/p5 for version 1.x', () => {
    const strategy = getTypesStrategy('1.9.0');
    expect(strategy.useTypesPackage).toBe(true);
    expect(strategy.reason).toContain('1.x uses @types/p5');
  });

  it('uses @types/p5 for version 2.0.0 and 2.0.1', () => {
    expect(getTypesStrategy('2.0.0').useTypesPackage).toBe(true);
    expect(getTypesStrategy('2.0.1').useTypesPackage).toBe(true);
  });

  it('uses bundled types for version 2.0.2+', () => {
    const strategy = getTypesStrategy('2.0.2');
    expect(strategy.useTypesPackage).toBe(false);
    expect(strategy.reason).toContain('bundled types');
  });

  it('uses bundled types for version 2.1.1', () => {
    const strategy = getTypesStrategy('2.1.1');
    expect(strategy.useTypesPackage).toBe(false);
  });

  it('uses bundled types for future versions (3.x+)', () => {
    const strategy = getTypesStrategy('3.0.0');
    expect(strategy.useTypesPackage).toBe(false);
  });
});

describe('downloadTypeDefinitions for p5.js 1.x', () => {
  it('downloads from @types/p5@1.7.7 for version 1.9.0', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('1.9.0', tmpDir);
    expect(actual).toBe('1.7.7'); // Should return types version, not p5 version

    // Verify both files downloaded from @types/p5
    const globalFileExists = await fs.stat(path.join(tmpDir, 'global.d.ts'))
      .then(() => true)
      .catch(() => false);

    const indexFileExists = await fs.stat(path.join(tmpDir, 'index.d.ts'))
      .then(() => true)
      .catch(() => false);

    expect(globalFileExists).toBe(true);
    expect(indexFileExists).toBe(true);

    // Verify correct URLs were used
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/index.d.ts');
  });

  it('downloads only index.d.ts for instance mode with p5.js 1.x', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('1.9.0', tmpDir, null, 'instance');
    expect(actual).toBe('1.7.7');

    // Verify only index.d.ts downloaded for instance mode
    const globalFileExists = await fs.stat(path.join(tmpDir, 'global.d.ts'))
      .then(() => true)
      .catch(() => false);

    const indexFileExists = await fs.stat(path.join(tmpDir, 'index.d.ts'))
      .then(() => true)
      .catch(() => false);

    expect(globalFileExists).toBe(false);
    expect(indexFileExists).toBe(true);
    expect(fetchedUrls).toHaveLength(1);
  });
});

describe('downloadTypeDefinitions for p5.js 2.x', () => {
  it('downloads bundled types for version 2.1.1', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.1.1', tmpDir);
    expect(actual).toBe('2.1.1'); // Should return p5 version for bundled types

    // Verify both files downloaded from p5 package
    const globalFileExists = await fs.stat(path.join(tmpDir, 'global.d.ts'))
      .then(() => true)
      .catch(() => false);

    const p5FileExists = await fs.stat(path.join(tmpDir, 'p5.d.ts'))
      .then(() => true)
      .catch(() => false);

    expect(globalFileExists).toBe(true);
    expect(p5FileExists).toBe(true);

    // Verify correct URLs were used
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/p5@2.1.1/types/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/p5@2.1.1/types/p5.d.ts');
  });

  it('downloads only p5.d.ts for instance mode with p5.js 2.x', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.1.1', tmpDir, null, 'instance');
    expect(actual).toBe('2.1.1');

    // Verify only p5.d.ts downloaded for instance mode
    const globalFileExists = await fs.stat(path.join(tmpDir, 'global.d.ts'))
      .then(() => true)
      .catch(() => false);

    const p5FileExists = await fs.stat(path.join(tmpDir, 'p5.d.ts'))
      .then(() => true)
      .catch(() => false);

    expect(globalFileExists).toBe(false);
    expect(p5FileExists).toBe(true);
    expect(fetchedUrls).toHaveLength(1);
  });

  it('falls back to @types/p5 for version 2.0.0', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.0.0', tmpDir);
    expect(actual).toBe('1.7.7'); // Should use @types/p5 version

    // Verify files from @types/p5, not p5 package
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/index.d.ts');
  });

  it('falls back to @types/p5 for version 2.0.1', async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      return {
        ok: true,
        text: async () => '// dummy types'
      };
    };

    const actual = await downloadTypeDefinitions('2.0.1', tmpDir);
    expect(actual).toBe('1.7.7');

    // Verify files from @types/p5
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/global.d.ts');
    expect(fetchedUrls).toContain('https://cdn.jsdelivr.net/npm/@types/p5@1.7.7/index.d.ts');
  });
});

describe('downloadTypeDefinitions error handling', () => {
  it('throws error on network failure', async () => {
    globalThis.fetch = async () => {
      throw new Error('fetch failed');
    };

    await expect(downloadTypeDefinitions('1.9.0', tmpDir)).rejects.toThrow(
      'Unable to download TypeScript definitions'
    );
  });

  it('throws error on HTTP error status', async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 404,
        text: async () => 'Not Found'
      };
    };

    await expect(downloadTypeDefinitions('1.9.0', tmpDir)).rejects.toThrow(
      'Failed to download'
    );
  });
});
