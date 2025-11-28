import * as p from '@clack/prompts';

/**
 * Displays a version selection prompt to the user
 * @param {string[]} versions - Array of available version strings in descending order
 * @param {string} latest - The latest stable version string
 * @returns {Promise<string>} The selected version string
 */
export async function selectVersion(versions, latest) {
  return await p.select({
    message: 'Select p5.js version:',
    options: versions.map(v => ({
      value: v,
      label: v === latest ? `${v} (latest)` : v
    }))
  });
}
