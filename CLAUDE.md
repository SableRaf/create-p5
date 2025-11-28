# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

create-p5 is an npm scaffolding tool that enables users to quickly create and manage p5.js projects using the `npm create` convention. It provides both interactive and non-interactive modes for project creation, along with utilities to update existing projects safely.

**Package name**: `create-p5`
**Type**: npm create package (used via `npm create p5@latest`)
**Target audience**: Creative coders, educators, students, artists using p5.js

## Project Structure (Target Architecture)

```
create-p5/
├── index.js                 # Entry point (#!/usr/bin/env node)
├── package.json
├── src/
│   ├── cli.js              # Main CLI logic and routing
│   ├── scaffold.js         # New project creation
│   ├── update.js           # Update existing projects
│   ├── prompts.js          # Interactive prompts
│   ├── config.js           # p5-config.json management
│   ├── version.js          # Version fetching from jsdelivr
│   ├── template.js         # Template operations
│   ├── git.js              # Git operations
│   └── utils.js            # Utilities (logging, validation, etc.)
├── templates/
│   ├── basic/              # Standard p5.js with global mode
│   ├── instance/           # Instance mode for multiple sketches
│   ├── typescript/         # TypeScript setup with type definitions
│   └── empty/              # Minimal HTML only
└── tests/
```

## Key Dependencies

**Production:**
- `@clack/prompts` - Interactive prompts with spinners
- `kolorist` - Terminal colors
- `minimist` - Argument parsing
- `degit` - GitHub template cloning (community templates)

**Development:**
- `vitest` - Testing framework
- `prettier` - Code formatting
- `eslint` - Linting

## Core Functionality

### 1. Scaffolding New Projects
Entry point in `cli.js` detects if running in existing project (checks for `p5-config.json`) or creating new project. The `scaffold.js` module handles:
1. Parse arguments or run interactive prompts
2. Copy selected template
3. Inject p5.js script tag with chosen version/mode (CDN or local)
4. Download TypeScript definitions to `types/` directory
5. Create `p5-config.json` metadata file
6. Optionally run `git init`

### 2. Updating Existing Projects
The `update.js` module handles:
- Version updates (updates script tag or downloads new files)
- Mode switching (CDN ↔ local)
- TypeScript definitions updates
- Preserves user code, only modifies infrastructure

### 3. Template System
Templates use placeholder `<!-- INJECT_P5_SCRIPT -->` in HTML which gets replaced with either:
- CDN: `<script src="https://cdn.jsdelivr.net/npm/p5@{version}/lib/p5.js"></script>`
- Local: `<script src="lib/p5.js"></script>` (plus downloads to `lib/` directory)

### 4. Version Management
The `version.js` module:
- Fetches available p5.js versions from `https://data.jsdelivr.com/v1/packages/npm/p5`
- Shows latest 15 versions in interactive mode
- Supports version matching for TypeScript definitions from `@types/p5`
- Downloads p5.js files from jsdelivr CDN when using local mode

## Development Workflow

### Philosophy
Follow incremental development in 6-10 stages with 2-4 atomic commits per stage:
1. **Proof of Concept** - Hardcoded, single feature, validates approach
2. **Dynamic Input** - Real data, user choices
3. **Persistence** - Save/load state
4. **Alternative Modes** - Different paths through the system
5. **Extended Features** - Non-core functionality
6. **Refactoring** - DRY, modularity (only after features work)
7. **Error Handling** - Validation, edge cases
8. **Documentation** - README, examples

### Commit Guidelines
- **1-5 files changed** per commit
- **15-60 minutes** to implement
- **One purpose**: add feature OR refactor OR fix (not multiple)
- **Leaves code working** - must be testable after commit

Format: `type: short description` where type is `feat`, `fix`, `refactor`, `docs`, `test`, or `style`

### Checkpoints
After each stage, ensure something is demo-able and working before proceeding. STOP at checkpoints for approval.

## Code Documentation Standards

**All functions and methods MUST have JSDoc comments** with:
- Description of what the function does
- `@param` tags for each parameter with type and description
- `@returns` tag with return type and description

Example:
```javascript
/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Falls back to the latest version if the specified version's types are not found.
 *
 * @param {string} version - The p5.js version to download type definitions for
 * @param {boolean} [verbose=false] - Whether to log verbose output
 * @returns {Promise<string>} The actual version of the type definitions downloaded
 */
async function downloadTypes(version, verbose = false) {
  // Implementation...
}
```

## Key Technical Details

### p5-config.json Schema
Created during scaffolding, used by update commands:
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "template": "basic",
  "typeDefsVersion": "1.7.7",
  "createdAt": "2025-11-28T10:30:00Z",
  "lastUpdated": "2025-11-28T10:30:00Z"
}
```

### Node.js Requirements
- **Minimum**: Node.js 18.0.0+ (for native fetch API and modern ESM support)
- **Package Managers**: npm 7+, yarn 1.22+, pnpm 8+, bun 1.0+

### Usage Patterns
```bash
# Interactive mode
npm create p5@latest

# Non-interactive with flags
npm create p5@latest my-sketch -- --template typescript --mode cdn --yes

# Update existing project
npx create-p5 update --version 1.10.0

# Switch delivery mode
npx create-p5 mode local
```

## Important Architectural Principles

1. **Code against APIs, not implementations** - Expose stable contracts and keep internal details hidden
2. **Mock dependencies early** - Keep components decoupled
3. **Make it work → make it right → make it fast** - Don't optimize prematurely
4. **Modularity and DRY** - But only after features work (Stage 6+)
5. **Automated tests** - For all new features and bug fixes
6. **No feature creep during refactoring** - One thing at a time

## Red Flags to Avoid

- "While I'm here..." syndrome → Save it for later
- Commits touching 10+ files → Break it down
- Refactoring before features work → Too early, focus on correctness first
- Skipping tests "temporarily" → Technical debt accumulates
- No demo after 5 commits → Increments too small or code is broken
