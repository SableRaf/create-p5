/**
 * Display primitives - UI output functions
 * Philosophy: Mechanisms only, content from i18n
 * Applies formatting (colors) but no hardcoded text
 */

import * as p from '@clack/prompts';
import { blue, red, green, cyan, bgMagenta, white } from 'kolorist';
import { t } from '../i18n/index.js';

let silentModeEnabled = false;

/**
 * Enable or disable silent mode for all display output.
 *
 * @param {boolean} enabled - Whether to silence all display output
 */
export function setSilentMode(enabled) {
  silentModeEnabled = Boolean(enabled);
}

/**
 * Show intro banner with branding
 */
export function intro() {
  if (silentModeEnabled) {
    return;
  }
  p.intro(bgMagenta(white(t('cli.intro'))));
}

/**
 * Show outro message and exit
 * @param {string} message - The outro message (already translated)
 */
export function outro(message) {
  if (silentModeEnabled) {
    process.exit(0);
  }
  p.outro(message);
  process.exit(0);
}

/**
 * Show cancellation message and exit
 * @param {string} key - Translation key for cancellation message
 */
export function cancel(key) {
  if (silentModeEnabled) {
    process.exit(0);
  }
  p.cancel(t(key));
  process.exit(0);
}

/**
 * Log a plain message (no formatting)
 * @param {string} text - Pre-formatted text (can include colors)
 */
export function message(text) {
  if (silentModeEnabled) {
    return;
  }
  p.log.message(text);
}

/**
 * Log an info message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function info(key, vars) {
  if (silentModeEnabled) {
    return;
  }
  p.log.info(t(key, vars));
}

/**
 * Log a success message with green color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function success(key, vars) {
  if (silentModeEnabled) {
    return;
  }
  p.log.success(t(key, vars));
}

/**
 * Log an error message with red color
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function error(key, vars) {
  if (silentModeEnabled) {
    return;
  }
  p.log.error(t(key, vars));
}

/**
 * Log a warning message
 * @param {string} key - Translation key
 * @param {Record<string, any>} [vars] - Variables for interpolation
 */
export function warn(key, vars) {
  if (silentModeEnabled) {
    return;
  }
  p.log.warn(t(key, vars));
}

/**
 * Display a note box with title and lines
 * @param {string[]} lineKeys - Array of translation keys for content lines
 * @param {string} titleKey - Translation key for title
 * @param {Record<string, any>} [vars] - Variables for interpolation (applied to all)
 */
export function note(lineKeys, titleKey, vars = {}) {
  if (silentModeEnabled) {
    return;
  }
  const content = lineKeys.map(key => t(key, vars)).join('\n');
  const title = t(titleKey);
  p.note(content, title);
}

/**
 * Create and manage a spinner
 * @param {string} key - Translation key for initial message
 * @param {Record<string, any>} [vars] - Variables for interpolation
 * @returns {Object} Spinner object with message(key, vars) and stop(key, vars) methods
 */
export function spinner(key, vars) {
  if (silentModeEnabled) {
    return {
      message: () => {},
      stop: () => {}
    };
  }
  const s = p.spinner();
  s.start(t(key, vars));

  // Wrap methods to use translation keys
  const originalMessage = s.message.bind(s);
  const originalStop = s.stop.bind(s);

  s.message = (key, vars) => originalMessage(t(key, vars));
  s.stop = (key, vars) => originalStop(t(key, vars));

  return s;
}

/**
 * Apply blue color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleBlue(text) {
  return blue(text);
}

/**
 * Apply green color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleGreen(text) {
  return green(text);
}

/**
 * Apply red color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleRed(text) {
  return red(text);
}

/**
 * Apply cyan color to text
 * @param {string} text - Text to color
 * @returns {string} Colored text
 */
export function styleCyan(text) {
  return cyan(text);
}
