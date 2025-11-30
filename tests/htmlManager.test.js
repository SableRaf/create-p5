import { describe, it, expect } from 'vitest';
import { injectP5Script } from '../src/htmlManager.js';
import { HTMLManager } from '../src/htmlManager.js';

const baseHtml = `<!doctype html>
<html>
<head>
  <!-- P5JS_SCRIPT_TAG -->
  <meta charset="utf-8">
</head>
<body>
  <script src="sketch.js"></script>
</body>
</html>`;

const htmlWithCdn = `<!doctype html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.8.0/lib/p5.min.js"></script>
</head>
<body></body>
</html>`;

const htmlWithLocal = `<!doctype html>
<html>
<head>
  <script src="./lib/p5.js"></script>
</head>
<body></body>
</html>`;

describe('injectP5Script', () => {
  it('replaces marker with CDN script tag', () => {
    const out = injectP5Script(baseHtml, '1.9.0', 'cdn');
    expect(out).toMatch(/cdn\.jsdelivr\.net/);
    expect(out).toMatch(/p5@1.9.0/);
  });

  it('inserts local script when mode is local', () => {
    const out = injectP5Script(baseHtml, '1.9.0', 'local');
    expect(out).toMatch(/\.\/lib\/p5\.js/);
  });
});

describe('HTMLManager advanced detection and updates', () => {
  it('detects jsdelivr CDN and minified flag', () => {
    const mgr = new HTMLManager(htmlWithCdn);
    const info = mgr.findP5Script();
    expect(info).not.toBeNull();
    expect(info.version).toBe('1.8.0');
    expect(info.isMinified).toBe(true);
    expect(info.cdnProvider).toBe('jsdelivr');
  });

  it('detects local lib script', () => {
    const mgr = new HTMLManager(htmlWithLocal);
    const info = mgr.findP5Script();
    expect(info).not.toBeNull();
    expect(info.version).toBe('local');
  });

  it('updates existing script preserving minified and provider', () => {
    const mgr = new HTMLManager(htmlWithCdn);
    const changed = mgr.updateP5Script('1.9.0', 'cdn');
    expect(changed).toBe(true);
    const out = mgr.serialize();
    expect(out).toMatch(/p5@1.9.0/);
    expect(out).toMatch(/p5.min.js/);
  });
});
