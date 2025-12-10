import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'fs';
import { readdir, readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { copyTemplateFiles } from '../src/utils.js';

/**
 * Integration tests for Basic setup
 *
 * These tests verify that the Basic setup creates the correct file structure
 * by simulating the template copying process.
 */

const TEST_DIR = join(process.cwd(), 'tests', 'temp', 'basic-integration-test');
const MINIMAL_TEMPLATE = join(process.cwd(), 'templates', 'minimal-global-js');

describe('Basic setup integration', () => {
  beforeAll(async () => {
    // Clean up any existing test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should copy minimal template files correctly', async () => {
    const testProjectDir = join(TEST_DIR, 'test-basic-project');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    // Verify project directory was created
    expect(existsSync(testProjectDir)).toBe(true);

    // Verify required files exist
    expect(existsSync(join(testProjectDir, 'index.html'))).toBe(true);
    expect(existsSync(join(testProjectDir, 'style.css'))).toBe(true);
    expect(existsSync(join(testProjectDir, 'sketch.js'))).toBe(true);
  });

  it('should not include jsconfig.json in Basic setup', async () => {
    const testProjectDir = join(TEST_DIR, 'test-no-jsconfig');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const files = await readdir(testProjectDir);

    // Verify jsconfig.json is NOT present
    expect(files).not.toContain('jsconfig.json');
  });

  it('should contain exactly 3 files (HTML, CSS, JS)', async () => {
    const testProjectDir = join(TEST_DIR, 'test-three-files');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const files = await readdir(testProjectDir);

    expect(files.length).toBe(3);
    expect(files).toContain('index.html');
    expect(files).toContain('style.css');
    expect(files).toContain('sketch.js');
  });

  it('should have valid HTML structure', async () => {
    const testProjectDir = join(TEST_DIR, 'test-html-structure');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const htmlContent = await readFile(join(testProjectDir, 'index.html'), 'utf-8');

    // Verify basic HTML structure
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('<html');
    expect(htmlContent).toContain('<head>');
    expect(htmlContent).toContain('</head>');
    expect(htmlContent).toContain('<body>');
    expect(htmlContent).toContain('</body>');
    expect(htmlContent).toContain('</html>');
  });

  it('should include p5.js script tag marker', async () => {
    const testProjectDir = join(TEST_DIR, 'test-script-marker');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const htmlContent = await readFile(join(testProjectDir, 'index.html'), 'utf-8');

    // Verify p5.js script marker comment exists
    expect(htmlContent).toContain('<!-- P5JS_SCRIPT_TAG -->');
  });

  it('should include sketch.js script reference', async () => {
    const testProjectDir = join(TEST_DIR, 'test-sketch-reference');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const htmlContent = await readFile(join(testProjectDir, 'index.html'), 'utf-8');

    // Verify sketch.js is referenced
    expect(htmlContent).toMatch(/<script.*sketch\.js.*<\/script>/);
  });

  it('should have valid CSS file', async () => {
    const testProjectDir = join(TEST_DIR, 'test-css');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const cssContent = await readFile(join(testProjectDir, 'style.css'), 'utf-8');

    // Verify CSS file is not empty
    expect(cssContent.length).toBeGreaterThan(0);

    // Should contain some basic styling
    expect(cssContent).toMatch(/body|html|main/i);
  });

  it('should have valid JavaScript structure', async () => {
    const testProjectDir = join(TEST_DIR, 'test-js-structure');
    await copyTemplateFiles(MINIMAL_TEMPLATE, testProjectDir);

    const jsContent = await readFile(join(testProjectDir, 'sketch.js'), 'utf-8');

    // Verify JS file contains p5.js lifecycle functions
    expect(jsContent).toContain('function setup()');
    expect(jsContent).toContain('function draw()');
  });
});

describe('Basic vs Standard template comparison', () => {
  const STANDARD_TEMPLATE = join(process.cwd(), 'templates', 'basic-global-js');

  it('minimal template should have fewer files than standard template', async () => {
    const minimalFiles = await readdir(MINIMAL_TEMPLATE);
    const standardFiles = await readdir(STANDARD_TEMPLATE);

    expect(minimalFiles.length).toBeLessThan(standardFiles.length);
  });

  it('standard template should include jsconfig.json', async () => {
    const standardFiles = await readdir(STANDARD_TEMPLATE);
    expect(standardFiles).toContain('jsconfig.json');
  });

  it('both templates should share core files', async () => {
    const minimalFiles = await readdir(MINIMAL_TEMPLATE);
    const standardFiles = await readdir(STANDARD_TEMPLATE);

    const coreFiles = ['index.html', 'style.css', 'sketch.js'];

    coreFiles.forEach(file => {
      expect(minimalFiles).toContain(file);
      expect(standardFiles).toContain(file);
    });
  });
});
