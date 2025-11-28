#!/usr/bin/env node

/**
 * create-p5 - Scaffolding tool for p5.js projects
 * Entry point for the CLI
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { copyTemplateFiles } from './src/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectName = 'my-sketch';
  const templatePath = path.join(__dirname, 'templates', 'basic');
  const targetPath = path.join(process.cwd(), projectName);

  console.log('Welcome to create-p5!');
  console.log(`Creating project: ${projectName}`);

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
