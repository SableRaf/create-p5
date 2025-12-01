# TypeScript Definitions Version Strategy

This document describes how create-p5 handles TypeScript type definitions for different p5.js versions.

## The Problem

The @types/p5 package uses its own versioning scheme (latest: 1.7.7) that doesn't directly match p5.js versions (latest: 2.1.1). Additionally, p5.js started bundling its own TypeScript definitions starting from version 2.0.2.

## The Solution

We use a two-tier strategy based on the p5.js version:

### For p5.js 1.x (versions 1.0.0 - 1.11.x)

**Use @types/p5 package from DefinitelyTyped**

- Source: `https://cdn.jsdelivr.net/npm/@types/p5@<version>/`
- Latest available: `@types/p5@1.7.7`
- Files needed:
  - `index.d.ts` - For instance mode
  - `global.d.ts` - For global mode (references index.d.ts)

**Version matching logic:**
1. Try to match major.minor version (e.g., p5@1.7.0 → @types/p5@1.7.x)
2. If exact minor match not available, use latest 1.x version (1.7.7)
3. For p5.js versions beyond 1.7.x (e.g., 1.9.0, 1.11.0), fall back to @types/p5@1.7.7

**Example mappings:**
- p5.js 1.4.0 → @types/p5@1.4.2 (if available) or @types/p5@1.7.7
- p5.js 1.7.0 → @types/p5@1.7.7
- p5.js 1.9.0 → @types/p5@1.7.7 (latest available)
- p5.js 1.11.0 → @types/p5@1.7.7 (latest available)

### For p5.js 2.x (versions 2.0.2+)

**Use bundled types from p5 package itself**

- Source: `https://cdn.jsdelivr.net/npm/p5@<version>/types/`
- Available starting from: `p5@2.0.2`
- Files needed:
  - `p5.d.ts` - For instance mode
  - `global.d.ts` - For global mode (references p5.d.ts)

**Version matching logic:**
1. For p5@2.0.2+: Use exact version match (e.g., p5@2.1.1 → p5@2.1.1/types/)
2. For p5@2.0.0 or 2.0.1: Fall back to @types/p5@1.7.7 (bundled types not yet available)

**Example mappings:**
- p5.js 2.0.0 → @types/p5@1.7.7 (bundled types not available yet)
- p5.js 2.0.1 → @types/p5@1.7.7 (bundled types not available yet)
- p5.js 2.0.2 → p5@2.0.2/types/ (first version with bundled types)
- p5.js 2.1.1 → p5@2.1.1/types/ (exact match)

## File Structure Differences

### @types/p5 (for 1.x)
```
@types/p5@1.7.7/
├── index.d.ts       # Main definitions (instance mode)
├── global.d.ts      # Global mode augmentation
├── constants.d.ts   # Constants
├── literals.d.ts    # Literal types
└── ...
```

### p5 bundled types (for 2.x)
```
p5@2.1.1/types/
├── p5.d.ts          # Main definitions (instance mode)
└── global.d.ts      # Global mode augmentation
```

## Implementation Details

The `downloadTypeDefinitions()` function in `src/version.js`:

1. Parses the p5.js version to determine major version
2. Routes to appropriate download strategy:
   - Major version 1: Downloads from @types/p5 package
   - Major version 2 (≥2.0.2): Downloads from p5 package bundled types
   - Major version 2 (<2.0.2): Falls back to @types/p5@1.7.7
3. Downloads appropriate files based on template:
   - Instance mode: Only p5.d.ts (or index.d.ts for @types)
   - Global mode: Both global.d.ts and p5.d.ts (or index.d.ts for @types)
4. Returns actual types version downloaded for storage in p5-config.json

## Edge Cases

- **Very old versions (0.x)**: Fall back to @types/p5@1.7.7 (best effort)
- **Pre-release versions (e.g., 2.1.0-rc.1)**: Use base version (2.1.0) and follow normal logic
- **Future versions (3.x+)**: Assume bundled types and follow 2.x strategy
- **Network failures**: Graceful degradation - allow project creation without types

## References

- [@types/p5 on npm](https://www.npmjs.com/package/@types/p5)
- [p5-types/p5.ts on GitHub](https://github.com/p5-types/p5.ts)
- [DefinitelyTyped versioning](https://stackoverflow.com/questions/43071705/how-to-relate-a-version-of-types-package-to-the-versions-of-the-associated-js-p)
