import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Checks if git is installed on the system
 * @returns {Promise<boolean>} True if git is installed, false otherwise
 */
export async function isGitInstalled() {
  return new Promise((resolve) => {
    const git = spawn('git', ['--version']);

    git.on('error', () => {
      resolve(false);
    });

    git.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Initializes a git repository in the specified directory
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {Promise<void>}
 */
export async function initGit(projectDir) {
  // Check if git is installed
  const gitInstalled = await isGitInstalled();
  if (!gitInstalled) {
    console.log('⚠️  Git not found on system, skipping git initialization');
    return;
  }

  // Run git init
  await new Promise((resolve, reject) => {
    const git = spawn('git', ['init'], { cwd: projectDir });

    git.on('error', (error) => {
      reject(new Error(`Failed to run git init: ${error.message}`));
    });

    git.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git init exited with code ${code}`));
      }
    });
  });

  // Create .gitignore file
  await createGitignore(projectDir);

  console.log('✓ Initialized git repository');
}

/**
 * Creates a .gitignore file with standard entries for p5.js projects
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {Promise<void>}
 */
async function createGitignore(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');

  // Check if .gitignore already exists
  let existingContent = '';
  try {
    existingContent = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // .gitignore doesn't exist, start with empty content
  }

  // Standard entries for p5.js projects
  const gitignoreEntries = [
    '# Dependencies',
    'node_modules/',
    '',
    '# System files',
    '.DS_Store',
    'Thumbs.db',
    '',
    '# Logs',
    '*.log',
    'npm-debug.log*',
    '',
    '# Environment',
    '.env',
    '.env.local'
  ];

  // Only add entries if .gitignore doesn't already have substantial content
  if (existingContent.trim().length === 0) {
    await fs.writeFile(gitignorePath, gitignoreEntries.join('\n') + '\n', 'utf-8');
  }
}

/**
 * Adds lib/ directory to .gitignore (for local mode)
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {Promise<void>}
 */
export async function addLibToGitignore(projectDir) {
  const gitignorePath = path.join(projectDir, '.gitignore');

  let gitignoreContent = '';
  try {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // .gitignore doesn't exist, start with empty content
  }

  // Check if lib/ is already in .gitignore
  if (!gitignoreContent.includes('lib/')) {
    const libEntry = '\n# Local p5.js files\nlib/\n';
    await fs.writeFile(gitignorePath, gitignoreContent + libEntry, 'utf-8');
  }
}
