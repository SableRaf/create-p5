/**
 * Utility functions for file operations
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
