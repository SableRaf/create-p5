/**
 * ConfigManager - Handles p5-config.json read/write operations
 */

import { readJSON, writeJSON, fileExists } from './utils.js';

/**
 * Creates a new p5-config.json file with project metadata
 *
 * @param {string} configPath - The path where the config file should be created
 * @param {Object} options - Configuration options
 * @param {string} options.version - The p5.js version used
 * @param {string} [options.mode='cdn'] - Delivery mode: "cdn" or "local"
 * @param {string} [options.template='basic'] - Template name used
 * @param {string|null} [options.typeDefsVersion=null] - Version of TypeScript definitions installed
 * @returns {Promise<void>}
 */
export async function createConfig(configPath, options) {
  const config = {
    version: options.version,
    mode: options.mode || 'cdn',
    template: options.template || 'basic',
    typeDefsVersion: options.typeDefsVersion || null,
    lastUpdated: new Date().toISOString()
  };

  await writeJSON(configPath, config);
}

/**
 * Reads an existing p5-config.json file
 *
 * @param {string} configPath - The path to the config file
 * @returns {Promise<Object|null>} The configuration object with {version, mode, template, typeDefsVersion, lastUpdated} or null if file doesn't exist
 */
export async function readConfig(configPath) {
  return await readJSON(configPath);
}

/**
 * Checks if a p5-config.json file exists at the given path
 *
 * @param {string} configPath - The path to check for the config file
 * @returns {Promise<boolean>} True if the config file exists, false otherwise
 */
export async function configExists(configPath) {
  return await fileExists(configPath);
}
