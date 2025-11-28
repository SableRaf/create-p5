#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import minimist from 'minimist';
import { copyTemplateFiles } from './src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2));
  const projectName = args._[0] || 'my-sketch';

  const templatePath = path.join(__dirname, 'templates', 'basic');
  const targetPath = path.join(process.cwd(), projectName);

  console.log('Welcome to create-p5!');
  console.log(`Creating project: ${projectName}`);

  // Check if directory already exists
  try {
    await fs.access(targetPath);
    console.error(`Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  } catch {
    // Directory doesn't exist, continue
  }

  try {
    await copyTemplateFiles(templatePath, targetPath);
    console.log(`✓ Project created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  Open index.html in your browser`);
  } catch (error) {
    console.error('Error creating project:', error.message);
    process.exit(1);
  }
}

main();
