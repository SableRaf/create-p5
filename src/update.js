/**
 * Update module - Handles version updates and mode switching for existing p5.js projects
 */

import path from 'path';
import minimist from 'minimist';
import { readConfig, createConfig } from './config.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from './version.js';
import { selectVersion } from './prompts.js';
import { injectP5Script } from './template.js';
import * as p from '@clack/prompts';
import { createDirectory, readFile, writeFile, fileExists, removeDirectory } from './utils.js';

/**
 * Main update function - Entry point for updating existing projects
 * Detects existing project and shows current state
 * @param {string} [projectDir=process.cwd()] - The directory of the project to update
 * @returns {Promise<void>}
 */
export async function update(projectDir = process.cwd()) {
  // Parse CLI arguments for options
  const args = minimist(process.argv.slice(2), {
    boolean: ['include-prerelease'],
    alias: {
      p: 'include-prerelease'
    }
  });

  const configPath = path.join(projectDir, 'p5-config.json');

  // Read existing configuration
  const config = await readConfig(configPath);

  if (!config) {
    p.log.error('No p5-config.json found. This does not appear to be a create-p5 project.');
    process.exit(1);
    return; // defensive: ensure function doesn't continue if exit is mocked
  }

  // Display current project state
  if (config) {
    const configInfo =
      `p5.js version: ${config.version}\n` +
      `Delivery mode: ${config.mode}\n` +
      `Template: ${config.template}\n` +
      `TypeScript definitions: ${config.typeDefsVersion || 'none'}\n` +
      `Last updated: ${config.lastUpdated}`;
    p.note(configInfo, 'Current project configuration');
  }

  // Show update options
  const action = await p.select({
    message: 'What would you like to update?',
    options: [
      {
        value: 'version',
        label: 'Update p5.js version',
        hint: 'Change to a different version of p5.js'
      },
      {
        value: 'mode',
        label: 'Switch delivery mode',
        hint: 'Switch between CDN and local file delivery'
      },
      {
        value: 'cancel',
        label: 'Cancel',
        hint: 'Exit without making changes'
      }
    ]
  });

  if (action === 'cancel') {
    p.log.info('Update cancelled.');
    return;
  }

  // Route to appropriate update function
  if (action === 'version') {
    await updateVersion(projectDir, config, { includePrerelease: args['include-prerelease'] });
  } else if (action === 'mode') {
    await switchMode(projectDir, config);
  }
}

/**
 * Updates the p5.js version in an existing project
 * Handles both CDN and local delivery modes
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @param {Object} [options={}] - Update options
 * @param {boolean} [options.includePrerelease=false] - Whether to include pre-release versions
 * @returns {Promise<void>}
 */
async function updateVersion(projectDir, config, options = {}) {
  const { includePrerelease = false, verbose = false } = options;

  // Fetch available versions
  const { latest, versions } = await fetchVersions(includePrerelease);

  if (includePrerelease && verbose) {
    p.log.info('Including pre-release versions (RC, beta, alpha)');
  }

  // Let user select new version
  const newVersion = await selectVersion(versions, latest);

  if (newVersion === config.version) {
    p.log.info('Selected version is the same as current version. No changes made.');
    return;
  }

  if (verbose) {
    p.log.info(`Updating from version ${config.version} to ${newVersion}...`);
  }

  // Update based on delivery mode
  if (config.mode === 'local') {
    // Re-download p5.js files for local mode
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(newVersion, libPath);
    if (verbose) {
      p.log.success('Downloaded new p5.js files to lib/');
    }
  }

  // Update script tag in index.html (works for both CDN and local)
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, newVersion, config.mode);
  await writeFile(indexPath, updatedHtml);
  if (verbose) {
    p.log.success('Updated script tag in index.html');
  }

  // Update TypeScript definitions
  const typesPath = path.join(projectDir, 'types');
  await createDirectory(typesPath);
  const typeDefsVersion = await downloadTypeDefinitions(newVersion, typesPath, null, config.template);
  if (verbose) {
    p.log.success(`Updated TypeScript definitions to version ${typeDefsVersion}`);
  }

  // Update p5-config.json
  const configPath = path.join(projectDir, 'p5-config.json');
  await createConfig(configPath, {
    version: newVersion,
    mode: config.mode,
    template: config.template,
    typeDefsVersion
  });

  const updateSummary =
    `Old version: ${config.version}\n` +
    `New version: ${newVersion}\n` +
    `TypeScript definitions: ${typeDefsVersion}`;
  p.note(updateSummary, 'Version updated successfully!');
}

/**
 * Switches delivery mode between CDN and local
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @param {Object} [options={}] - Update options
 * @param {boolean} [options.verbose=false] - Whether to show verbose output
 * @returns {Promise<void>}
 */
async function switchMode(projectDir, config, options = {}) {
  const { verbose = false } = options;
  const currentMode = config.mode;
  const newMode = currentMode === 'cdn' ? 'local' : 'cdn';

  if (verbose) {
    p.log.info(`Switching from ${currentMode} to ${newMode} mode...`);
  }

  if (newMode === 'local') {
    // CDN → Local: Download files and update script tag
    const libPath = path.join(projectDir, 'lib');
    await createDirectory(libPath);
    await downloadP5Files(config.version, libPath);
    if (verbose) {
      p.log.success('Downloaded p5.js files to lib/');
    }

    // Update .gitignore to exclude lib/ directory
    const gitignorePath = path.join(projectDir, '.gitignore');
    let gitignoreContent = '';
    if (await fileExists(gitignorePath)) {
      gitignoreContent = await readFile(gitignorePath);
    }

    // Only add lib/ if not already present
    if (!gitignoreContent.includes('lib/')) {
      await writeFile(gitignorePath, gitignoreContent + '\n# Local p5.js files\nlib/\n');
      if (verbose) {
        p.log.success('Updated .gitignore to exclude lib/');
      }
    }
  } else {
    // Local → CDN: Prompt user about lib/ directory
    const shouldDelete = await p.confirm({
      message: 'Delete the local lib/ directory?',
      initialValue: false
    });

    if (shouldDelete) {
      const libPath = path.join(projectDir, 'lib');
      try {
        await removeDirectory(libPath);
        if (verbose) {
          p.log.success('Deleted lib/ directory');
        }
      } catch (error) {
        p.log.info('lib/ directory not found or already deleted');
      }
    } else {
      p.log.info('lib/ directory kept (you can delete it manually)');
    }
  }

  // Update script tag in index.html
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await readFile(indexPath);
  const updatedHtml = injectP5Script(htmlContent, config.version, newMode);
  await writeFile(indexPath, updatedHtml);
  if (verbose) {
    p.log.success('Updated script tag in index.html');
  }

  // Update p5-config.json
  const configPath = path.join(projectDir, 'p5-config.json');
  await createConfig(configPath, {
    version: config.version,
    mode: newMode,
    template: config.template,
    typeDefsVersion: config.typeDefsVersion
  });

  p.log.success(`Delivery mode updated from ${currentMode} to ${newMode}`);
}
