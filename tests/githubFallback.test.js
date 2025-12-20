import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import {
  parseGitHubSpec,
  isSingleFile,
  downloadSingleFile,
  downloadGitHubArchive
} from '../src/githubFallback.js';

const tmpDir = path.join('tests', 'tmp-github-fallback');

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('parseGitHubSpec', () => {
  it('parses basic user/repo spec', () => {
    const result = parseGitHubSpec('user/repo');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: ''
    });
  });

  it('parses user/repo with custom ref', () => {
    const result = parseGitHubSpec('user/repo#dev');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'dev',
      subpath: ''
    });
  });

  it('parses user/repo/subpath', () => {
    const result = parseGitHubSpec('user/repo/path/to/template');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'path/to/template'
    });
  });

  it('parses user/repo/subpath#ref', () => {
    const result = parseGitHubSpec('user/repo/examples/basic#v1.0');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'v1.0',
      subpath: 'examples/basic'
    });
  });

  it('handles single file path', () => {
    const result = parseGitHubSpec('user/repo/template.html#main');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'template.html'
    });
  });

  it('returns null for empty spec', () => {
    expect(parseGitHubSpec('')).toBeNull();
    expect(parseGitHubSpec(null)).toBeNull();
  });

  it('returns null for invalid spec (single part)', () => {
    expect(parseGitHubSpec('user')).toBeNull();
  });

  it('filters out empty path parts', () => {
    const result = parseGitHubSpec('user/repo//path//to/template');
    expect(result).toEqual({
      user: 'user',
      repo: 'repo',
      ref: 'main',
      subpath: 'path/to/template'
    });
  });
});

describe('isSingleFile', () => {
  it('returns true for known file extensions', () => {
    expect(isSingleFile('template.html')).toBe(true);
    expect(isSingleFile('script.js')).toBe(true);
    expect(isSingleFile('module.mjs')).toBe(true);
    expect(isSingleFile('config.json')).toBe(true);
    expect(isSingleFile('styles.css')).toBe(true);
    expect(isSingleFile('shader.glsl')).toBe(true);
    expect(isSingleFile('vertex.vert')).toBe(true);
    expect(isSingleFile('fragment.frag')).toBe(true);
    expect(isSingleFile('readme.md')).toBe(true);
    expect(isSingleFile('archive.tar.gz')).toBe(true);
  });

  it('returns true for files in nested paths', () => {
    expect(isSingleFile('path/to/file.js')).toBe(true);
    expect(isSingleFile('examples/basic/index.html')).toBe(true);
  });

  it('returns false for directories with dots (not file extensions)', () => {
    expect(isSingleFile('v1.0')).toBe(false);
    expect(isSingleFile('version.1.2')).toBe(false);
    expect(isSingleFile('my.folder')).toBe(false);
  });

  it('returns false for paths without extensions', () => {
    expect(isSingleFile('examples')).toBe(false);
    expect(isSingleFile('path/to/folder')).toBe(false);
  });

  it('returns false for empty or null paths', () => {
    expect(isSingleFile('')).toBe(false);
    expect(isSingleFile(null)).toBe(false);
  });

  it('handles case-insensitive extensions', () => {
    expect(isSingleFile('FILE.JS')).toBe(true);
    expect(isSingleFile('Template.HTML')).toBe(true);
  });

  it('returns false for unknown file extensions', () => {
    expect(isSingleFile('file.unknown')).toBe(false);
    expect(isSingleFile('document.pdf')).toBe(false);
  });
});

describe('downloadSingleFile', () => {
  function createMockResponse(statusCode, data = '', headers = {}) {
    const response = new Readable();
    response.statusCode = statusCode;
    response.headers = headers;
    response._read = () => {};

    // Simulate async data emission
    setImmediate(() => {
      response.push(data);
      response.push(null);
    });

    return response;
  }

  it('downloads a file successfully', async () => {
    const mockResponse = createMockResponse(200, '// file content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadSingleFile('user', 'repo', 'main', 'test.js', tmpDir);

    const content = await fs.readFile(path.join(tmpDir, 'test.js'), 'utf-8');
    expect(content).toBe('// file content');
  });

  it('creates target directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'dir');
    const mockResponse = createMockResponse(200, 'content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadSingleFile('user', 'repo', 'main', 'file.js', nestedDir);

    const exists = await fs.access(nestedDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('extracts filename from path', async () => {
    const mockResponse = createMockResponse(200, 'content');

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await downloadSingleFile('user', 'repo', 'main', 'path/to/file.js', tmpDir);

    const exists = await fs.access(path.join(tmpDir, 'file.js')).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('throws error on 404 status', async () => {
    const mockResponse = createMockResponse(404);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadSingleFile('user', 'repo', 'main', 'missing.js', tmpDir)
    ).rejects.toThrow('File not found');
  });

  it('throws error on non-200/redirect status codes', async () => {
    const mockResponse = createMockResponse(500);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Failed to download file: HTTP 500');
  });

  it('follows redirects (301)', async () => {
    let callCount = 0;
    const redirectUrl = 'https://new-location.com/file.js';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callCount++;
      if (callCount === 1) {
        const redirectResponse = createMockResponse(301, '', {
          location: redirectUrl
        });
        callback(redirectResponse);
      } else {
        const finalResponse = createMockResponse(200, 'redirected content');
        callback(finalResponse);
      }
      return { on: () => ({}) };
    });

    await downloadSingleFile('user', 'repo', 'main', 'file.js', tmpDir);

    const content = await fs.readFile(path.join(tmpDir, 'file.js'), 'utf-8');
    expect(content).toBe('redirected content');
    expect(callCount).toBe(2);
  });

  it('follows multiple redirect types (302, 307, 308)', async () => {
    for (const statusCode of [302, 307, 308]) {
      let callCount = 0;
      const redirectUrl = 'https://new-location.com/file.js';

      vi.spyOn(https, 'get').mockImplementation((url, callback) => {
        callCount++;
        if (callCount === 1) {
          const redirectResponse = createMockResponse(statusCode, '', {
            location: redirectUrl
          });
          callback(redirectResponse);
        } else {
          const finalResponse = createMockResponse(200, `content-${statusCode}`);
          callback(finalResponse);
        }
        return { on: () => ({}) };
      });

      const testDir = path.join(tmpDir, `test-${statusCode}`);
      await fs.mkdir(testDir, { recursive: true });
      await downloadSingleFile('user', 'repo', 'main', 'file.js', testDir);

      const content = await fs.readFile(path.join(testDir, 'file.js'), 'utf-8');
      expect(content).toBe(`content-${statusCode}`);

      vi.restoreAllMocks();
    }
  });

  it('throws error when redirect has no location header', async () => {
    const mockResponse = createMockResponse(301, '', {});

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Redirect without Location header: HTTP 301');
  });

  it('throws error after too many redirects', async () => {
    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      const redirectResponse = createMockResponse(301, '', {
        location: 'https://redirect-loop.com/file.js'
      });
      callback(redirectResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Too many redirects');
  });

  it('throws error on network error', async () => {
    vi.spyOn(https, 'get').mockImplementation(() => {
      const request = {
        on: (event, handler) => {
          if (event === 'error') {
            setImmediate(() => handler(new Error('Network error')));
          }
          return request;
        }
      };
      return request;
    });

    await expect(
      downloadSingleFile('user', 'repo', 'main', 'file.js', tmpDir)
    ).rejects.toThrow('Network error');
  });
});

describe('downloadGitHubArchive', () => {
  function createMockResponse(statusCode, data = '', headers = {}) {
    const response = new Readable();
    response.statusCode = statusCode;
    response.headers = headers;
    response._read = () => {};

    // Simulate async data emission
    setImmediate(() => {
      response.push(data);
      response.push(null);
    });

    return response;
  }

  it('constructs correct archive URL', async () => {
    let capturedUrl = '';

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      capturedUrl = url;
      const mockResponse = createMockResponse(404); // Fail fast for test
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', 'examples', tmpDir)
    ).rejects.toThrow();

    expect(capturedUrl).toBe('https://codeload.github.com/user/repo/tar.gz/main');
  });

  it('throws error on non-200/redirect status codes', async () => {
    const mockResponse = createMockResponse(500);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Failed to download archive: HTTP 500');
  });

  it('follows redirects with correct status codes', async () => {
    let callCount = 0;

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callCount++;
      if (callCount === 1) {
        const redirectResponse = createMockResponse(302, '', {
          location: 'https://new-location.com/archive.tar.gz'
        });
        callback(redirectResponse);
      } else {
        // Return a mock response that will fail extraction but proves redirect worked
        const mockResponse = createMockResponse(404);
        callback(mockResponse);
      }
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow();

    expect(callCount).toBe(2);
  });

  it('throws error when redirect has no location header', async () => {
    const mockResponse = createMockResponse(301, '', {});

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Redirect without Location header: HTTP 301');
  });

  it('throws error after too many redirects', async () => {
    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      const redirectResponse = createMockResponse(301, '', {
        location: 'https://redirect-loop.com/archive.tar.gz'
      });
      callback(redirectResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Too many redirects');
  });

  it('throws error on network error', async () => {
    vi.spyOn(https, 'get').mockImplementation(() => {
      const request = {
        on: (event, handler) => {
          if (event === 'error') {
            setImmediate(() => handler(new Error('Network error')));
          }
          return request;
        }
      };
      return request;
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', tmpDir)
    ).rejects.toThrow('Network error');
  });

  it('creates target directory if it does not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'archive-dir');
    const mockResponse = createMockResponse(404);

    vi.spyOn(https, 'get').mockImplementation((url, callback) => {
      callback(mockResponse);
      return { on: () => ({}) };
    });

    await expect(
      downloadGitHubArchive('user', 'repo', 'main', '', nestedDir)
    ).rejects.toThrow();

    const exists = await fs.access(nestedDir).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});
