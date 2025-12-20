import { describe, it, expect } from 'vitest';
import { normalizeTemplateSpec } from '../src/templateFetcher.js';

describe('normalizeTemplateSpec', () => {
  it('normalizes basic github URL to user/repo', () => {
    expect(normalizeTemplateSpec('https://github.com/user/repo')).toBe('user/repo');
    expect(normalizeTemplateSpec('https://github.com/user/repo.git')).toBe('user/repo');
  });

  it('normalizes tree URL with branch and path', () => {
    expect(normalizeTemplateSpec('https://github.com/user/repo/tree/main/path/to/template')).toBe('user/repo/path/to/template#main');
    expect(normalizeTemplateSpec('https://github.com/user/repo/tree/gh-pages')).toBe('user/repo#gh-pages');
  });

  it('normalizes blob URL to user/repo/path#ref (degit will clone as subdirectory)', () => {
    expect(normalizeTemplateSpec('https://github.com/user/repo/blob/main/template.html')).toBe('user/repo/template.html#main');
  });

  it('preserves and normalizes shorthand forms', () => {
    expect(normalizeTemplateSpec('user/repo')).toBe('user/repo');
    expect(normalizeTemplateSpec('user/repo/subdir')).toBe('user/repo/subdir');
    expect(normalizeTemplateSpec('user/repo.git')).toBe('user/repo');
  });

  it('converts user/repo#ref/path into user/repo/path#ref', () => {
    expect(normalizeTemplateSpec('user/repo#main/path/to/template')).toBe('user/repo/path/to/template#main');
  });

  it('keeps user/repo/path#ref unchanged', () => {
    expect(normalizeTemplateSpec('user/repo/path#main')).toBe('user/repo/path#main');
  });

  it('handles paths with file extensions as subdirectories', () => {
    expect(normalizeTemplateSpec('user/repo/examples.ts')).toBe('user/repo/examples.ts');
    expect(normalizeTemplateSpec('user/repo/config.json')).toBe('user/repo/config.json');
    expect(normalizeTemplateSpec('user/repo/src/main.js')).toBe('user/repo/src/main.js');
  });
});

