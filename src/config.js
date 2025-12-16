/**
 * ConfigManager - Handles .p5-config.json read/write operations
 */

import fs from 'fs/promises';
import path from 'path';
import { readJSON, writeJSON, fileExists } from './utils.js';
import { messageFromErrorOrUndefined } from './exceptionUtils.js';

/**
 * @typedef {import('./types.js').Language} Language
*/
/**
 * @typedef {import('./types.js').P5Mode} P5Mode
*/
/**
 * @typedef {import('./types.js').DeliveryMode} DeliveryMode
*/
/**
 * @typedef {import('./types.js').SetupType} SetupType
*/



/** 
 * @param {any} candidate
 * @returns {candidate is DeliveryMode}
 */
export function isValidDeliveryMode(candidate){
  return (candidate==="cdn" || candidate==="local");
}

/** 
 * @param {any} candidate
 * @returns {candidate is P5Mode}
 */
export function isValidP5Mode(candidate){
  return (candidate==="global" || candidate==="instance");
}

/** 
 * @param {any} candidate
 * @returns {candidate is Language}
 */
export function isValidLanguage(candidate){
  return (candidate==="javascript" || candidate==="typescript");
}

/**
 * @typedef {Object} ProjectConfig
 * @property {string} version
 * @property {DeliveryMode} mode
 * @property {Language?} language
 * @property {P5Mode?} p5Mode
 * @property {string|null} typeDefsVersion
 * @property {string=} template
 * @property {string} lastUpdated

 * 
 */
/**
 * Creates a new .p5-config.json file with project metadata
 *
 * @param {string} configPath - The path where the config file should be created
 * @param {Object} options - Configuration options
 * @param {string} options.version - The p5.js version used
 * @param {DeliveryMode} [options.mode='cdn'] - Delivery mode: "cdn" or "local"
 * @param {Language} [options.language] - Programming language: "javascript" or "typescript"
 * @param {P5Mode} [options.p5Mode] - p5.js mode: "global" or "instance"
 * @param {string} [options.template] - template
 * @param {string|null} [options.typeDefsVersion=null] - Version of TypeScript definitions installed
 * @returns {Promise<void>}
 */
export async function createConfig(configPath, options) {
  /**
   * @type {ProjectConfig}
   */
  const config = {
    version: options.version,
    mode: options.mode || 'cdn',
    language: options.language || null,
    p5Mode: options.p5Mode || null,
    typeDefsVersion: options.typeDefsVersion || null,    
    lastUpdated: new Date().toISOString(),
    template: options.template
  };

  await writeJSON(configPath, config);
}

/**
 * Reads an existing .p5-config.json file
 *
 * @param {string} configPath - The path to the config file
 * @returns {Promise<ProjectConfig|null>} The configuration object with {version, mode, language, p5Mode, typeDefsVersion, lastUpdated} or null if file doesn't exist
 */
export async function readConfig(configPath) {
  return await readJSON(configPath);
}

/**
 * Checks if a .p5-config.json file exists at the given path
 *
 * @param {string} configPath - The path to check for the config file
 * @returns {Promise<boolean>} True if the config file exists, false otherwise
 */
export async function configExists(configPath) {
  return await fileExists(configPath);
}

/**
 * Migrates old 'p5-config.json' to new '.p5-config.json' format if needed.
 * Handles edge cases: both files exist, permission errors, etc.
 *
 * @param {string} projectDir - The directory containing the config file(s)
 * @returns {Promise<{migrated: boolean, error: string|null}>} Migration result with status and any error message
 */
export async function migrateConfigIfNeeded(projectDir) {
  const oldConfigPath = path.join(projectDir, 'p5-config.json');
  const newConfigPath = path.join(projectDir, '.p5-config.json');

  // Check if old config exists
  if (!(await fileExists(oldConfigPath))) {
    return { migrated: false, error: null };
  }

  // Check if new config already exists
  if (await fileExists(newConfigPath)) {
    return {
      migrated: false,
      error: 'error.migration.configExists'
    };
  }

  // Attempt migration
  try {
    await fs.rename(oldConfigPath, newConfigPath);
    return { migrated: true, error: null };
  } catch (err) {

    return {
      migrated: false,      
      error: `error.migration.renameFailed: ${messageFromErrorOrUndefined(err)}`
    };
  }
}
