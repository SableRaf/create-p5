# Implementation Plan: Redesigned Dialog Flow

## Overview
Redesign the create-p5 dialog flow to be more organized and complete.

## Changes Summary

### Breaking Changes
- `--template` flag now ONLY accepts community templates (GitHub repo format like `user/repo`). No more built-in templates.
- No built-in template selection in interactive mode (basic/instance/typescript/empty removed from prompts)
- Interactive mode always uses "basic" template with language variants + global/instance mode (4 variants total)

### New Dialog Flow
1. **Where should we create your project?** → (unchanged)
2. **Which version of p5.js do you want to use?** → (unchanged)
3. **Select delivery mode** → (unchanged)
4. **Select language and mode** (groupMultiselect):
   - **Language:** JavaScript / TypeScript
   - **Mode:** Global mode (recommended) / Instance mode

### Template Architecture
Only **4 template variants** (2×2 matrix):
```
templates/
├── basic-global-js/       # JavaScript + Global mode
├── basic-global-ts/       # TypeScript + Global mode
├── basic-instance-js/     # JavaScript + Instance mode
└── basic-instance-ts/     # TypeScript + Instance mode
```

Each contains the same files as current templates, just organized by combination and revised content to match language & p5.js mode.

## Implementation Stages

### Stage 1: Create New Template Variants
**Goal:** Set up the 4 new template directories

**Tasks:**
1. Create `templates/basic-global-js/` (copy from current `basic/`)
2. Create `templates/basic-global-ts/` (copy from current `typescript/`)
3. Create `templates/basic-instance-js/` (copy from current `instance/`)
4. Create `templates/basic-instance-ts/` (new - TypeScript + instance mode)

**Validation:**
- All 4 directories exist
- Each contains: `index.html`, `sketch.[js|ts]`, `style.css`, `jsconfig.json` (or `tsconfig.json`)
- `basic-instance-ts` combines instance mode pattern with TypeScript typing

**Commits:**
1. `feat: create basic-global-js template from basic`
2. `feat: create basic-global-ts template from typescript`
3. `feat: create basic-instance-js template from instance`
4. `feat: create basic-instance-ts template (TypeScript + instance mode)`

---

### Stage 2: Update Locale Files for New Prompts
**Goal:** Add i18n strings for groupMultiselect prompts

**Tasks:**
1. Update `locales/en/prompts.json`:
   - Remove old template prompt strings
   - Add `groupMultiselect` strings for language/mode selection
   - Add labels, hints, and messages

**Example structure:**
```json
{
  "prompt.languageMode.message": "Select language and mode:",
  "prompt.languageMode.group.language.label": "Language",
  "prompt.languageMode.group.language.hint": "Choose your programming language",
  "prompt.languageMode.group.mode.label": "Mode",
  "prompt.languageMode.group.mode.hint": "Choose how p5.js runs",

  "prompt.languageMode.option.javascript.label": "JavaScript",
  "prompt.languageMode.option.javascript.hint": "Standard JavaScript",
  "prompt.languageMode.option.typescript.label": "TypeScript",
  "prompt.languageMode.option.typescript.hint": "Type-safe JavaScript superset",

  "prompt.languageMode.option.global.label": "Global mode",
  "prompt.languageMode.option.global.hint": "Standard p5.js style (recommended)",
  "prompt.languageMode.option.instance.label": "Instance mode",
  "prompt.languageMode.option.instance.hint": "Useful for multiple sketches on one page"
}
```

2. Update `locales/en/info.json` and `locales/en/notes.json`:
   - Update references from "template" to "language/mode"
   - Update success messages

**Validation:**
- All old template-related strings removed
- New groupMultiselect strings added
- Messages reference "language" and "mode" instead of "template"

**Commits:**
1. `refactor: update prompts locale for language/mode selection`
2. `refactor: update info and notes locale to remove template references`

---

### Stage 3: Create New Prompt Function
**Goal:** Add `promptLanguageAndMode()` using `groupMultiselect`

**Tasks:**
1. Add new function to `src/ui/prompts.js`:
```javascript
/**
 * Prompt for language and mode selection using groupMultiselect
 * @returns {Promise<string[]>} Array of selected values: ['javascript'|'typescript', 'global'|'instance']
 */
export async function promptLanguageAndMode() {
  const result = await p.groupMultiselect({
    message: t('prompt.languageMode.message'),
    required: true,
    options: {
      language: {
        label: t('prompt.languageMode.group.language.label'),
        hint: t('prompt.languageMode.group.language.hint'),
        options: [
          {
            value: 'javascript',
            label: t('prompt.languageMode.option.javascript.label'),
            hint: t('prompt.languageMode.option.javascript.hint')
          },
          {
            value: 'typescript',
            label: t('prompt.languageMode.option.typescript.label'),
            hint: t('prompt.languageMode.option.typescript.hint')
          }
        ]
      },
      mode: {
        label: t('prompt.languageMode.group.mode.label'),
        hint: t('prompt.languageMode.group.mode.hint'),
        options: [
          {
            value: 'global',
            label: t('prompt.languageMode.option.global.label'),
            hint: t('prompt.languageMode.option.global.hint')
          },
          {
            value: 'instance',
            label: t('prompt.languageMode.option.instance.label'),
            hint: t('prompt.languageMode.option.instance.hint')
          }
        ]
      }
    }
  });

  // groupMultiselect returns an object like { language: ['javascript'], mode: ['global'] }
  // Extract the first (and only) value from each group
  const language = result.language[0];
  const mode = result.mode[0];

  return [language, mode];
}
```

2. Remove old `promptTemplate()` function (breaking change)

**Validation:**
- `promptLanguageAndMode()` returns array of 2 values
- Handles cancellation properly
- Old `promptTemplate()` removed

**Commits:**
1. `feat: add promptLanguageAndMode using groupMultiselect`
2. `refactor: remove old promptTemplate function`

---

### Stage 4: Update Template Selection Logic
**Goal:** Derive template directory from language/mode selections

**Tasks:**
1. Add helper function to `src/utils.js`:
```javascript
/**
 * Determines template directory name from language and mode
 * @param {string} language - 'javascript' or 'typescript'
 * @param {string} mode - 'global' or 'instance'
 * @returns {string} Template directory name (e.g., 'basic-global-js')
 */
export function getTemplateName(language, mode) {
  const langSuffix = language === 'typescript' ? 'ts' : 'js';
  return `basic-${mode}-${langSuffix}`;
}

/**
 * Validates language choice
 * @param {string} language - Language to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateLanguage(language) {
  const valid = ['javascript', 'typescript'];
  if (!valid.includes(language)) {
    return `Invalid language: ${language}. Must be one of: ${valid.join(', ')}`;
  }
  return null;
}

/**
 * Validates p5.js mode choice
 * @param {string} mode - Mode to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateP5Mode(mode) {
  const valid = ['global', 'instance'];
  if (!valid.includes(mode)) {
    return `Invalid mode: ${mode}. Must be one of: ${valid.join(', ')}`;
  }
  return null;
}
```

2. Remove `validateTemplate()` function (no longer needed for built-in templates)

**Validation:**
- `getTemplateName('javascript', 'global')` returns `'basic-global-js'`
- `getTemplateName('typescript', 'instance')` returns `'basic-instance-ts'`
- Validation functions work correctly

**Commits:**
1. `feat: add getTemplateName and validation helpers`
2. `refactor: remove validateTemplate (breaking change)`

---

### Stage 5: Update Scaffold Operation
**Goal:** Integrate new prompt and template logic into scaffold workflow

**Tasks:**
1. Update `src/operations/scaffold.js`:
   - Replace `promptTemplate()` with `promptLanguageAndMode()`
   - Use `getTemplateName()` to determine template directory
   - Update validation logic
   - Update `--template` flag behavior (now ONLY for community templates)
   - Remove template from non-interactive defaults (`--yes` flag)

**Key changes:**
```javascript
// Replace template prompt section (around line 165-178)
let selectedLanguage, selectedMode;

if (args.template) {
  // --template flag now ONLY for community templates
  if (!isRemoteTemplateSpec(args.template)) {
    throw new Error(t('error.templateMustBeRemote', { template: args.template }));
  }
  selectedTemplate = args.template;
  display.success('info.usingCommunityTemplate', { template: selectedTemplate });
  // When using community template, skip language/mode prompts
  selectedLanguage = null;
  selectedMode = null;
} else if (args.yes) {
  // Default: JavaScript + Global mode
  selectedLanguage = 'javascript';
  selectedMode = 'global';
  selectedTemplate = null;
  display.success('info.defaultLanguageMode');
} else {
  // Interactive mode: prompt for language and mode
  const choices = await prompts.promptLanguageAndMode();
  if (prompts.isCancel(choices)) {
    display.cancel('prompt.cancel.sketchCreation');
  }
  [selectedLanguage, selectedMode] = choices;
  selectedTemplate = null;
}

// Determine template directory
const templateDir = selectedTemplate
  ? null // Community template, fetched later
  : getTemplateName(selectedLanguage, selectedMode);
```

2. Update file copying logic to use `templateDir`

3. Update config creation to store language/mode instead of template name:
```javascript
await createConfig(configPath, {
  version: selectedVersion,
  mode: selectedMode,
  language: selectedLanguage,
  p5Mode: selectedP5Mode, // 'global' or 'instance'
  typeDefsVersion
});
```

**Validation:**
- Interactive flow uses `groupMultiselect`
- `--yes` defaults to JavaScript + Global mode
- `--template user/repo` works for community templates
- `--template basic` throws error (breaking change)
- Config file stores language and p5Mode

**Commits:**
1. `refactor: update scaffold to use language/mode selection`
2. `feat: restrict --template to community templates only`
3. `refactor: update config schema for language and p5Mode`

---

### Stage 6: Update Config Schema
**Goal:** Store language and p5Mode in `p5-config.json`

**Tasks:**
1. Update `src/config.js`:
   - Add `language` field (javascript/typescript)
   - Add `p5Mode` field (global/instance)
   - Remove `template` field (breaking change)

**New schema:**
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "language": "javascript",
  "p5Mode": "global",
  "typeDefsVersion": "1.7.7",
  "lastUpdated": "2025-12-06T10:30:00Z"
}
```

2. Update `createConfig()` and `readConfig()` functions

**Validation:**
- New projects create config with language/p5Mode fields
- Old template field removed

**Commits:**
1. `refactor: update config schema with language and p5Mode`

---

### Stage 7: Update CLI Flags
**Goal:** Add CLI flags for language and mode

**Tasks:**
1. Add new flags to support non-interactive mode:
   - `--language <javascript|typescript>` or `-l`
   - `--p5-mode <global|instance>` or `-p`

2. Update `src/operations/scaffold.js` to handle these flags:
```javascript
// After version/mode validation
if (args.language) {
  const langError = validateLanguage(args.language);
  if (langError) {
    throw new Error(langError);
  }
}

if (args['p5-mode']) {
  const modeError = validateP5Mode(args['p5-mode']);
  if (modeError) {
    throw new Error(modeError);
  }
}

// In selection logic
if (args.template) {
  // Community template
  selectedTemplate = args.template;
  selectedLanguage = null;
  selectedMode = null;
} else if (args.language && args['p5-mode']) {
  // Non-interactive with flags
  selectedLanguage = args.language;
  selectedMode = args['p5-mode'];
  selectedTemplate = null;
  display.success('info.usingLanguageMode', { language: selectedLanguage, mode: selectedMode });
} else if (args.yes) {
  // Defaults
  selectedLanguage = 'javascript';
  selectedMode = 'global';
  selectedTemplate = null;
} else {
  // Interactive
  const choices = await prompts.promptLanguageAndMode();
  [selectedLanguage, selectedMode] = choices;
  selectedTemplate = null;
}
```

3. Update help text and locale files

**Validation:**
- `npm create p5@latest my-sketch -- --language typescript --p5-mode instance` works
- Invalid values show clear errors
- Flags work with `--yes`

**Commits:**
1. `feat: add --language and --p5-mode CLI flags`
2. `docs: update help text for new flags`

---

### Stage 8: Clean Up Old Templates
**Goal:** Remove old template directories

**Tasks:**
1. Delete old template directories:
   - `templates/basic/` → replaced by `basic-global-js`
   - `templates/instance/` → replaced by `basic-instance-js`
   - `templates/typescript/` → replaced by `basic-global-ts`
   - `templates/empty/` → removed entirely

2. Update any references in docs or tests

**Validation:**
- Only 4 new template directories remain
- No broken references to old templates

**Commits:**
1. `refactor: remove old template directories (breaking change)`

---

### Stage 9: Update Documentation
**Goal:** Update CLAUDE.md and README to reflect new structure

**Tasks:**
1. Update `CLAUDE.md`:
   - Update project structure section
   - Update dialog flow documentation
   - Update template architecture description
   - Add migration notes for breaking changes

2. Update README (if exists):
   - Update usage examples
   - Document new flags
   - Update template documentation

**Commits:**
1. `docs: update CLAUDE.md for new dialog flow`
2. `docs: update README with new usage examples`

---

### Stage 10: Testing and Validation
**Goal:** Ensure everything works end-to-end

**Tasks:**
1. Test interactive mode:
   - All 4 language/mode combinations
   - Cancellation handling
   - Error cases

2. Test non-interactive mode:
   - `--yes` flag (defaults to JS + global)
   - `--language` and `--p5-mode` flags
   - `--template user/repo` (community template)
   - Error cases (invalid language, invalid mode)

3. Test that old template flags fail gracefully:
   - `--template basic` → error
   - `--template typescript` → error

4. Remove, update, or create tests in `tests/` directory as needed

**Validation:**
- All combinations work
- Error messages are clear
- Breaking changes documented

**Commits:**
1. `test: add tests for language/mode selection`
2. `test: verify community template functionality`

---

## Key Implementation Details

### clack/prompts groupMultiselect API
Based on the [documentation](https://bomb.sh/docs/clack/packages/prompts/#group-multiselect):

```javascript
import { groupMultiselect } from '@clack/prompts';

const projectOptions = await groupMultiselect({
    message: 'Define your project',
    options: {
        'Testing': [
            { value: 'Jest', hint: 'JavaScript testing framework' },
            { value: 'Playwright', hint: 'End-to-end testing' },
            { value: 'Vitest', hint: 'Vite-native testing' },
        ],
        'Language': [{
            label: "Javascript",
            value: 'js',
            hint: 'Dynamic typing'
        }, {
            label: 'TypeScript',
            value: 'ts',
            hint: 'Static typing'
        }, {
            label: "CoffeeScript",
            value: 'coffee',
            hint: 'JavaScript with Ruby-like syntax'
        }],
        'Code quality': [
            { value: 'Prettier', hint: 'Code formatter' },
            { value: 'ESLint', hint: 'Linter' },
            { value: 'Biome.js', hint: 'Formatter and linter' },
        ],
    },
    groupSpacing: 1, // Add one new line between each group
    selectableGroups: false, // Disable selection of top-level groups
});
```

The `groupMultiselect` prompt supports two additional options:
- `groupSpacing`: An integer that specifies how many new lines to add between each group. This helps improve readability when you have many groups.
- `selectableGroups`: A boolean that determines whether top-level groups can be selected. When set to false, only individual items within groups can be selected.


### Template Matrix (2×2)

| Language   | Global Mode          | Instance Mode           |
|------------|----------------------|-------------------------|
| JavaScript | `basic-global-js`    | `basic-instance-js`     |
| TypeScript | `basic-global-ts`    | `basic-instance-ts`     |

### Config Schema Evolution

**Before:**
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "template": "basic",
  "typeDefsVersion": "1.7.7"
}
```

**After:**
```json
{
  "version": "1.9.0",
  "mode": "cdn",
  "language": "javascript",
  "p5Mode": "global",
  "typeDefsVersion": "1.7.7"
}
```

### Breaking Changes Summary
1. `--template` flag now ONLY accepts community templates (GitHub repos)
2. Built-in templates (`basic`, `instance`, `typescript`, `empty`) removed from interactive prompts
3. Config schema changed: `template` field replaced with `language` and `p5Mode`
4. `validateTemplate()` function removed
5. `promptTemplate()` function removed

### Migration Path for Existing Projects
- Old projects with `template` field in config will need manual migration
- Update workflow should handle gracefully (read old schema, convert to new)
- Document in CLAUDE.md

---

## Success Criteria
- ✅ Interactive mode shows 4-step dialog
- ✅ groupMultiselect allows selecting language + mode
- ✅ 4 template variants exist and work correctly
- ✅ Community templates still work via `--template`
- ✅ Built-in template names throw clear errors
- ✅ `--yes` defaults to JavaScript + Global mode
- ✅ Config schema updated
- ✅ All tests pass
- ✅ Documentation updated

---

## Questions for User
None - all clarifications received.

## Estimated Effort
- **Stage 1-2:** 30-45 minutes (template setup + locale files)
- **Stage 3-4:** 45-60 minutes (new prompt + helper functions)
- **Stage 5-6:** 60-90 minutes (scaffold refactoring + config schema)
- **Stage 7-8:** 30-45 minutes (CLI flags + cleanup)
- **Stage 9-10:** 45-60 minutes (documentation + testing)

**Total:** ~4-6 hours

## Risk Assessment
- **Low risk:** Template creation, locale updates, helper functions
- **Medium risk:** Scaffold refactoring (complex logic, many touch points)
- **High risk:** Breaking changes (users with `--template basic` will get errors)

## Next Steps
After approval:
1. Create new branch: `feat/redesign-dialog-flow`
2. Start with Stage 1 (template creation)
3. Commit atomically (2-4 commits per stage)
4. Test after each stage
5. Create PR when complete
