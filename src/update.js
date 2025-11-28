/**
 * Update module - Handles version updates and mode switching for existing p5.js projects
 */

import path from 'path';
import fs from 'fs/promises';
import { readConfig, createConfig } from './config.js';
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
    console.log('Version update not yet implemented.');
  } else if (action === 'mode') {
    console.log('Mode switching not yet implemented.');
  }
}
