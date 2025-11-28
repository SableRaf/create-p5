/**
 * Utility functions for file operations and validation
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Copies all files from a template directory to a target directory.
 * Creates the target directory if it doesn't exist.
 *
 * @param {string} templatePath - Path to the template directory
 * @param {string} targetPath - Path to the target directory
 * @returns {Promise<void>}
 */
export async function copyTemplateFiles(templatePath, targetPath) {
  // Create target directory
  await fs.mkdir(targetPath, { recursive: true });

  // Read all files in template directory
  const files = await fs.readdir(templatePath);

  // Copy each file
  for (const file of files) {
    const sourcePath = path.join(templatePath, file);
    const destPath = path.join(targetPath, file);

    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      // Recursively copy subdirectories
      await copyTemplateFiles(sourcePath, destPath);
    } else {
      // Copy file
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

/**
 * Validates a project name according to npm naming conventions.
 * Returns an error message if invalid, or null if valid.
 *
 * @param {string} name - The project name to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'Project name cannot be empty';
  }

  // Check for spaces
  if (name.includes(' ')) {
    return 'Project name cannot contain spaces. Use hyphens or underscores instead (e.g., "my-sketch")';
  }

  // Check for invalid characters (only allow alphanumeric, hyphen, underscore, dot)
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, underscores, and dots';
  }

  // Check if starts with dot or hyphen
  if (name.startsWith('.') || name.startsWith('-')) {
    return 'Project name cannot start with a dot or hyphen';
  }

  // Check for reserved names
  const reservedNames = ['node_modules', 'package.json', 'package-lock.json'];
  if (reservedNames.includes(name.toLowerCase())) {
    return `"${name}" is a reserved name and cannot be used`;
  }

  return null; // Valid
}

/**
 * Checks if a directory already exists at the given path
 *
 * @param {string} dirPath - The directory path to check
 * @returns {Promise<boolean>} True if directory exists, false otherwise
 */
export async function directoryExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Validates that a template name is one of the supported templates
 *
 * @param {string} template - The template name to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateTemplate(template) {
  const validTemplates = ['basic', 'instance', 'typescript', 'empty'];
  if (!validTemplates.includes(template)) {
    return `Invalid template "${template}". Valid templates: ${validTemplates.join(', ')}`;
  }
  return null;
}

/**
 * Validates that a delivery mode is either 'cdn' or 'local'
 *
 * @param {string} mode - The delivery mode to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateMode(mode) {
  const validModes = ['cdn', 'local'];
  if (!validModes.includes(mode)) {
    return `Invalid mode "${mode}". Valid modes: ${validModes.join(', ')}`;
  }
  return null;
}

/**
 * Validates that a version exists in the available versions list
 *
 * @param {string} version - The version to validate
 * @param {string[]} availableVersions - Array of available version strings
 * @param {string} latest - The latest version string
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateVersion(version, availableVersions, latest) {
  if (version === 'latest') {
    return null; // Valid, will be resolved to actual version
  }

  if (!availableVersions.includes(version)) {
    return `Version "${version}" not found. Use "latest" or a specific version like "${latest}"`;
  }

  return null;
}
