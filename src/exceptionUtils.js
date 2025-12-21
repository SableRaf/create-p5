
/**
 * Type guard to check if an unknown value is an Error object.
 * @param {unknown} error
 * @returns {error is Error}
 */
export function isError(error) {
  // Check if it's an instance of Error and also check for common object-ness 
  // in case the error came from a different environment/iframe.
  return error instanceof Error && typeof error.message === 'string';
}

/**
 * @typedef {object} FetchErrorCandidate
 * @property {string} message - The error message string.
 * @property {string} [code] - An optional error code string (e.g., 'ENOTFOUND').
 */

/**
 * Type guard to check if an unknown value is an object that is likely a Node.js-style error 
 * with at least a 'message' property.  Allows us to safely check if the object has a .code property later without checking again if it IS an object.
 * * @param {unknown} error - The value caught by the catch block.
 * @returns {error is FetchErrorCandidate} True if the error has the expected structure.
 */
export function isFetchErrorCandidate(error) {
  if (typeof error !== 'object' || error === null) {
      return false;
  }  
  /** @type {any} */
  const e = error; 

  // Check if 'message' property exists and is a string.
  return typeof e.message === 'string';
}


/**
 * Type guard to check if an unknown value is an object with a string "message" property.
 * * @param {unknown} error - an error (likely from a catch block)
 * @returns {error is Record<"message", string>} True if the error has the expected structure.
 */
export function hasMessageStringProperty(error) {  
  /**@type {any} */
  const e = error;
  return typeof e.message === "string";
}

/**
 * @typedef {object} LoggingError
 * @property {string} message
 * @property {string | undefined} stack - The stack trace, which may be present but is sometimes undefined.
 */
/**
 * Type guard to check if an unknown value is an object with a message and stack property.
 * @param {unknown} error - The value caught by the catch block.
 * @returns {error is LoggingError} True if the error has the required structure.
 */
export function isLoggingError(error) {
    // 1. Basic checks for object type and null
    if (typeof error !== 'object' || error === null) {
        return false;
    }
    /** @type {any} */
    const e = error; 
    const hasMessage = typeof e.message === 'string';
    const hasStackProperty = (typeof e.stack === 'string' || typeof e.stack === 'undefined');
    return hasMessage && hasStackProperty;
}

/**
 * @param {unknown} error - likely from a "catch"
 */
export function messageFromErrorOrUndefined(error) {
  if (hasMessageStringProperty(error)){
    return error.message;
  }
  return undefined;
}