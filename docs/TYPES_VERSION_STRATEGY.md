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
1. Fetch available @types/p5 versions from jsdelivr API
2. Try to find exact major.minor match (highest patch in that minor)
3. **If exact match found**: Use it automatically (no user prompt)
4. **If no exact match** (interactive mode): Prompt user to select from available versions
5. **If no exact match** (non-interactive mode): Auto-select closest match with warning
6. Closest match prioritizes: exact minor, then closest minor within same major

**Example mappings:**
- p5.js 1.4.0 → @types/p5@1.4.3 (highest patch in 1.4.x)
- p5.js 1.7.0 → @types/p5@1.7.7 (highest patch in 1.7.x)
- p5.js 1.9.0 → @types/p5@1.7.7 (closest available, 1.9.x doesn't exist)
- p5.js 1.11.0 → @types/p5@1.7.7 (closest available, 1.11.x doesn't exist)

### For p5.js 2.x (versions 2.0.2+)

**Use bundled types from p5 package itself**

- Source: `https://cdn.jsdelivr.net/npm/p5@<version>/types/`
- Available starting from: `p5@2.0.2`
- Files needed:
  - `p5.d.ts` - For instance mode
  - `global.d.ts` - For global mode (references p5.d.ts)

**Version matching logic:**
1. Try exact version match first (e.g., p5@2.1.1 → p5@2.1.1/types/)
2. **If exact match found**: Use it automatically (no user prompt)
3. **If not available** (interactive mode): Prompt user to select from available 2.x versions
4. **If not available** (non-interactive mode): Auto-select closest 2.x match with warning
5. Closest match uses same algorithm as 1.x: prefer exact minor, then closest minor

**Example mappings:**
- p5.js 2.0.0 → p5@2.0.2/types/ (closest 2.x with bundled types)
- p5.js 2.0.1 → p5@2.0.2/types/ (closest 2.x with bundled types)
- p5.js 2.0.2 → p5@2.0.2/types/ (exact match)
- p5.js 2.1.1 → p5@2.1.1/types/ (exact match)

## Interactive vs Non-Interactive Mode

### Interactive Mode (default)

When running `npm create p5@latest` without `--yes` flag:

1. **Exact match exists**: Downloads silently, no prompt needed
2. **No exact match**: Shows a selection prompt with:
   - Clear explanation of why prompting is needed
   - List of all compatible versions
   - Recommended version pre-selected (closest match)
   - User can select any version or cancel
3. **User cancels**: Continues project creation without TypeScript definitions

**Example prompt:**
```
? No exact TypeScript definitions found for p5.js 1.9.0. Select a version to use:
  > 1.7.7 (recommended)
    1.7.6 from @types/p5
    1.5.0 from @types/p5
    1.4.3 from @types/p5
```

### Non-Interactive Mode (--yes flag)

When running with `--yes` flag (e.g., `npm create p5@latest my-sketch -- --yes`):

1. **Exact match exists**: Downloads silently
2. **No exact match**: Auto-selects closest match and displays info message:
   - "No exact TypeScript definitions found for p5.js X.Y.Z. Automatically selected A.B.C (closest match)."
3. **No cancellation**: Always attempts to download types (or fails with error)

This maintains backward compatibility for CI/automation workflows.

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

1. **Determine strategy** - `getTypesStrategy(version)` checks major version:
   - Major version 1: Use @types/p5 package
   - Major version 2+: Use bundled types from p5 package

2. **For p5.js 1.x (@types/p5)**:
   - Call `fetchTypesVersions()` to get available @types/p5 versions
   - Call `findExactMinorMatch(version, typesVersions)` to check for exact match
   - **If exact match**: Use it, skip to download
   - **If no exact match**:
     - Interactive: Call `promptTypesVersion()` with recommended version
     - Non-interactive: Use `findClosestVersion()` and show info message
   - Download from `@types/p5@{selectedVersion}/`

3. **For p5.js 2.x (bundled types)**:
   - Try to fetch from `p5@{version}/types/` to test if exact version exists
   - **If exact version exists**: Use it, skip to download
   - **If 404 (no exact match)**:
     - Call `fetchVersions()` to get all p5.js versions
     - Filter to only 2.x versions
     - Interactive: Call `promptTypesVersion()` with recommended version
     - Non-interactive: Use `findClosestVersion()` and show info message
   - Download from `p5@{selectedVersion}/types/`

4. **File selection based on template**:
   - Instance mode: Only main file (p5.d.ts or index.d.ts)
   - Global mode: Both global.d.ts and main file

5. **Return actual version** downloaded for storage in p5-config.json

### Helper Functions

- `parseVersion(version)` - Parses semver into components (major, minor, patch, prerelease)
- `fetchTypesVersions()` - Fetches available @types/p5 versions from jsdelivr API
- `findExactMinorMatch(target, available)` - Returns exact major.minor match or null
- `findClosestVersion(target, available)` - Matches by major.minor, prefers exact, then closest
- `getTypesStrategy(version)` - Determines bundled vs @types/p5 strategy
- `promptTypesVersion(versions, p5Version, recommended, strategy)` - Interactive version selection prompt

## Edge Cases

- **Very old versions (0.x)**: Uses @types/p5 strategy, finds closest 1.x types
- **Pre-release versions (e.g., 2.1.0-rc.1)**: Parsed correctly, uses base version for matching
- **Future versions (3.x+)**: Assumes bundled types, follows 2.x strategy
- **No matching version found**: Throws error with clear message
- **Network failures**: Graceful error handling with user-friendly messages

## References

- [@types/p5 on npm](https://www.npmjs.com/package/@types/p5)
- [p5-types/p5.ts on GitHub](https://github.com/p5-types/p5.ts)
- [DefinitelyTyped versioning](https://stackoverflow.com/questions/43071705/how-to-relate-a-version-of-types-package-to-the-versions-of-the-associated-js-p)
