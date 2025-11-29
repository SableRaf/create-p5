# Plan: Replace console.log with @clack/prompts Logging

## Goal
Replace all `console.log`, `console.error`, `console.warn`, and `console.info` statements with `@clack/prompts` logging functions (`p.log.*`) for consistent, beautiful CLI output throughout the codebase.

## Available @clack/prompts Logging Functions

From the TypeScript definitions:

```javascript
import * as p from '@clack/prompts';

p.log.message(message, { symbol })  // Generic message with optional symbol
p.log.info(message)                 // Info message (blue 'ℹ' symbol)
p.log.success(message)              // Success message (green '✔' symbol)
p.log.step(message)                 // Step message (cyan '◆' symbol)
p.log.warn(message)                 // Warning message (yellow '⚠' symbol)
p.log.warning(message)              // Alias for warn()
p.log.error(message)                // Error message (red '✖' symbol)
```

## Mapping Strategy

### Standard Output (console.log) → p.log.info() or p.log.message()
- Use `p.log.info()` for informational messages
- Use `p.log.message()` for plain messages without semantic meaning
- Use `p.log.step()` for step-by-step progress indicators

### Success Messages (console.log with ✓) → p.log.success()
- Already using symbols like `green('✓')` in output
- These should become `p.log.success()`

### Warnings (console.log/warn with ⚠) → p.log.warn()
- Messages about non-critical issues
- Examples: git not installed, TypeScript defs unavailable

### Errors (console.error) → p.log.error()
- Critical errors that prevent operation
- Examples: config not found, validation failures

### Help Text (console.log --help) → p.log.message()
- Multi-line help output should use `p.log.message()` with no symbol

## Files to Update

### Summary
1. **index.js** (~55 console.* calls)
2. **src/cli.js** (5 console.log calls)
3. **src/update.js** (~32 console.log/error calls)
4. **src/git.js** (2 console.log calls)

## Implementation Approach

### Stage 1: Update index.js
**File:** `/Users/raphael/Documents/GitHub/create-p5/index.js`
**Complexity:** High (many different types of messages)
**Time:** 45-60 minutes

**Changes:**
1. Help text (lines 45-68) → `p.log.message()` for each line
2. Informational messages → `p.log.info()`
3. Success messages with `green('✓')` → `p.log.success()` and remove color wrapper
4. Warning messages with `blue('⚠')` → `p.log.warn()` and remove color wrapper
5. Error messages with `red('Error:')` → `p.log.error()` and remove color wrapper
6. Keep inline colors (blue, cyan, green) for text emphasis within messages

**Examples:**
```javascript
// BEFORE
console.log(`Creating project: ${blue(projectName)}`);

// AFTER
p.log.info(`Creating project: ${blue(projectName)}`);
```

```javascript
// BEFORE
console.log(`${green('✓')} Using template: ${blue(selectedTemplate)}`);

// AFTER
p.log.success(`Using template: ${blue(selectedTemplate)}`);
```

```javascript
// BEFORE
console.error(`\n${red('Error:')} ${error.message}`);

// AFTER
p.log.error(error.message);
```

### Stage 2: Update src/cli.js
**File:** `/Users/raphael/Documents/GitHub/create-p5/src/cli.js`
**Complexity:** Low (5 calls, all informational)
**Time:** 10-15 minutes

**Changes:**
1. Import `* as p from '@clack/prompts'`
2. Lines 31-34: Replace with `p.log.info()`
3. Line 40: Replace with `p.log.step()` (since it's a workflow step)

**Example:**
```javascript
// BEFORE
console.log('Existing p5.js project detected (p5-config.json found).');
console.log('This directory is already a create-p5 project.');

// AFTER
p.log.info('Existing p5.js project detected (p5-config.json found).');
p.log.info('This directory is already a create-p5 project.');
```

### Stage 3: Update src/update.js
**File:** `/Users/raphael/Documents/GitHub/create-p5/src/update.js`
**Complexity:** Medium (32 calls, mix of types)
**Time:** 30-40 minutes

**Changes:**
1. Import already exists (`import * as p from '@clack/prompts'`)
2. Line 26: Error → `p.log.error()`
3. Lines 33-38: Configuration display → `p.log.info()`
4. Line 64: Info → `p.log.info()`
5. Lines 85-132: Update version workflow
   - Line 85: Info → `p.log.info()`
   - Lines 92, 96: Info → `p.log.info()`
   - Lines 104, 112, 118, 129-132: Success → `p.log.success()`
6. Lines 145-204: Switch mode workflow
   - Line 145: Info → `p.log.info()`
   - Lines 152, 164, 177, 179, 182, 191: Success/Info → `p.log.success()` or `p.log.info()`
   - Lines 202-204: Success → `p.log.success()`

**Example:**
```javascript
// BEFORE
console.error('Error: No p5-config.json found. This does not appear to be a create-p5 project.');

// AFTER
p.log.error('No p5-config.json found. This does not appear to be a create-p5 project.');
```

```javascript
// BEFORE
console.log('✓ Downloaded new p5.js files to lib/');

// AFTER
p.log.success('Downloaded new p5.js files to lib/');
```

### Stage 4: Update src/git.js
**File:** `/Users/raphael/Documents/GitHub/create-p5/src/git.js`
**Complexity:** Low (2 calls)
**Time:** 5-10 minutes

**Changes:**
1. Import `* as p from '@clack/prompts'`
2. Line 32: Warning → `p.log.warn()`
3. Line 56: Success → `p.log.success()`

**Example:**
```javascript
// BEFORE
console.log('⚠️  Git not found on system, skipping git initialization');

// AFTER
p.log.warn('Git not found on system, skipping git initialization');
```

```javascript
// BEFORE
console.log('✓ Initialized git repository');

// AFTER
p.log.success('Initialized git repository');
```

## Special Considerations

### Multi-line Output Blocks
For multi-line informational blocks (like project summary), keep using multiple calls:

```javascript
// BEFORE
console.log('\n' + cyan('Project Summary:'));
console.log(`  ${blue('Name:')}        ${projectName}`);
console.log(`  ${blue('Template:')}    ${selectedTemplate}`);

// AFTER
p.log.message(''); // blank line
p.log.info(cyan('Project Summary:'));
p.log.info(`  ${blue('Name:')}        ${projectName}`);
p.log.info(`  ${blue('Template:')}    ${selectedTemplate}`);
```

### Colored Output
- Remove symbols and "Error:"/"Warning:" prefixes since clack provides them
- Keep inline colors (blue, cyan, green, red) for text emphasis
- Remove color wrappers around entire messages when using semantic log functions

**Before:**
```javascript
console.error(`${red('Error:')} ${error.message}`);
console.log(`${green('✓')} Updated script tag`);
```

**After:**
```javascript
p.log.error(error.message);
p.log.success('Updated script tag');
```

### Empty Lines
Replace `console.log('')` or `console.log('\n...')` with `p.log.message('')`:

```javascript
// BEFORE
console.log('');

// AFTER
p.log.message('');
```

### Verbose Mode
```javascript
// BEFORE
if (args.verbose) {
  console.log(`${blue('Verbose mode enabled')}`);
}

// AFTER
if (args.verbose) {
  p.log.info('Verbose mode enabled');
}
```

## Testing Strategy

After each stage:

1. **Run help command:** `node index.js --help`
2. **Run scaffold workflow:** `node index.js test-project --yes`
3. **Run update workflow:** `cd test-project && node ../../index.js update` (simulate npx)
4. **Test error cases:** Invalid template, invalid version, directory exists
5. **Test verbose mode:** `node index.js --verbose`
6. **Run test suite:** `npm test`

## Expected Outcomes

- ✅ No more `console.log/error/warn/info` in index.js or src/ files (except test files)
- ✅ Consistent, beautiful output with semantic symbols
- ✅ Better UX with proper message categorization
- ✅ All existing tests pass
- ✅ CLI output looks professional and polished

## Commit Plan

**4 atomic commits:**

1. `feat: replace console with clack logging in index.js`
   - Update all ~55 console.* calls
   - Remove redundant color wrappers
   - Test help, scaffold, errors

2. `feat: replace console with clack logging in src/cli.js`
   - Add clack import
   - Update 5 console.log calls
   - Test existing project detection

3. `feat: replace console with clack logging in src/update.js`
   - Update all 32 console.* calls
   - Replace success/error/info appropriately
   - Test update and mode switching workflows

4. `feat: replace console with clack logging in src/git.js`
   - Add clack import
   - Update 2 console.log calls
   - Test git initialization

## Notes

- Template files (sketch.js) should keep console.log (they're user code)
- Test files can keep console for debugging
- Only production code (index.js, src/) should use clack logging
- Each commit should be testable and leave code in working state
