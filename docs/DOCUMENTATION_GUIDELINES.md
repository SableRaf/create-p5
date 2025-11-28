## Code Documentation Standards

### JSDoc Requirements

**All functions and methods MUST be documented using JSDoc comments.** This ensures:
- Type-checking support in IDEs
- Better IntelliSense/autocomplete
- Improved code readability
- Self-documenting codebase

#### JSDoc Format

Every function should include:

1. **Description** - Clear explanation of what the function does
2. **@param** tags - For each parameter with type and description
3. **@returns** tag - Return type and description
4. **Additional context** - When helpful (examples, edge cases, etc.)

#### Example

```javascript
/**
 * Downloads TypeScript type definitions for p5.js from jsdelivr CDN.
 * Falls back to the latest version if the specified version's types are not found.
 *
 * @param {string} version - The p5.js version to download type definitions for
 * @param {boolean} [verbose=false] - Whether to log verbose output
 * @returns {Promise<string>} The actual version of the type definitions that were downloaded
 */
async function downloadTypes(version, verbose = false) {
  // Implementation...
}
```

#### Class Methods

Class constructors and methods should follow the same pattern:

```javascript
export class ConfigManager {
  /**
   * Creates a new ConfigManager instance
   * @param {FileManager} fileManager - The file manager instance for file operations
   * @param {string} [configPath='sketch/p5-config.json'] - Path to the configuration file
   */
  constructor(fileManager, configPath = `${basePath}p5-config.json`) {
    this.fileManager = fileManager;
    this.configPath = configPath;
  }

  /**
   * Loads configuration from file
   * @returns {Promise<Object|null>} The configuration object or null if config doesn't exist
   */
  async load() {
    // Implementation...
  }
}
```