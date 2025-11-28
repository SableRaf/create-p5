/**
 * Update module - Handles version updates and mode switching for existing p5.js projects
 */

import path from 'path';
import fs from 'fs/promises';
import { readConfig, createConfig } from './config.js';
import { fetchVersions, downloadP5Files, downloadTypeDefinitions } from './version.js';
import { selectVersion } from './prompts.js';
import { injectP5Script } from './template.js';
import * as p from '@clack/prompts';

/**
 * Main update function - Entry point for updating existing projects
 * Detects existing project and shows current state
 * @param {string} [projectDir=process.cwd()] - The directory of the project to update
 * @returns {Promise<void>}
 */
export async function update(projectDir = process.cwd()) {
  const configPath = path.join(projectDir, 'p5-config.json');

  // Read existing configuration
  const config = await readConfig(configPath);

  if (!config) {
    console.error('Error: No p5-config.json found. This does not appear to be a create-p5 project.');
    process.exit(1);
  }

  // Display current project state
  console.log('Current project configuration:');
  console.log(`  p5.js version: ${config.version}`);
  console.log(`  Delivery mode: ${config.mode}`);
  console.log(`  Template: ${config.template}`);
  console.log(`  TypeScript definitions: ${config.typeDefsVersion || 'none'}`);
  console.log(`  Last updated: ${config.lastUpdated}`);

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
    console.log('Update cancelled.');
    return;
  }

  // Route to appropriate update function
  if (action === 'version') {
    await updateVersion(projectDir, config);
  } else if (action === 'mode') {
    console.log('Mode switching not yet implemented.');
  }
}

/**
 * Updates the p5.js version in an existing project
 * Handles both CDN and local delivery modes
 * @param {string} projectDir - The directory of the project to update
 * @param {Object} config - Current project configuration from p5-config.json
 * @returns {Promise<void>}
 */
async function updateVersion(projectDir, config) {
  // Fetch available versions
  console.log('Fetching p5.js versions...');
  const { latest, versions } = await fetchVersions();

  // Let user select new version
  const newVersion = await selectVersion(versions, latest);

  if (newVersion === config.version) {
    console.log('Selected version is the same as current version. No changes made.');
    return;
  }

  console.log(`Updating from version ${config.version} to ${newVersion}...`);

  // Update based on delivery mode
  if (config.mode === 'local') {
    // Re-download p5.js files for local mode
    const libPath = path.join(projectDir, 'lib');
    await fs.mkdir(libPath, { recursive: true });
    await downloadP5Files(newVersion, libPath);
    console.log('✓ Downloaded new p5.js files to lib/');
  }

  // Update script tag in index.html (works for both CDN and local)
  const indexPath = path.join(projectDir, 'index.html');
  const htmlContent = await fs.readFile(indexPath, 'utf-8');
  const updatedHtml = injectP5Script(htmlContent, newVersion, config.mode);
  await fs.writeFile(indexPath, updatedHtml, 'utf-8');
  console.log('✓ Updated script tag in index.html');

  // Update TypeScript definitions
  const typesPath = path.join(projectDir, 'types');
  await fs.mkdir(typesPath, { recursive: true });
  const typeDefsVersion = await downloadTypeDefinitions(newVersion, typesPath);
  console.log(`✓ Updated TypeScript definitions to version ${typeDefsVersion}`);

  // Update p5-config.json
  const configPath = path.join(projectDir, 'p5-config.json');
  await createConfig(configPath, {
    version: newVersion,
    mode: config.mode,
    template: config.template,
    typeDefsVersion
  });

  console.log(`✓ Version updated successfully!`);
  console.log(`  Old version: ${config.version}`);
  console.log(`  New version: ${newVersion}`);
  console.log(`  TypeScript definitions: ${typeDefsVersion}`);
}
