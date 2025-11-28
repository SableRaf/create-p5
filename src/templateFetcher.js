import degit from 'degit';

/**
 * Detect whether the provided template spec refers to a remote template
 * (GitHub shorthand or a full URL).
 *
 * @param {string} t
 * @returns {boolean}
 */
export function isRemoteTemplateSpec(t) {
  if (!t || typeof t !== 'string') return false;
  if (/^https?:\/\//.test(t)) return true;
  if (/^[^\s]+\/[^^\s]+/.test(t)) return true;
  return false;
}


/**
 * Normalize common GitHub URL forms into a degit-friendly spec.
 * Examples:
 * - https://github.com/user/repo -> user/repo
 * - https://github.com/user/repo.git -> user/repo
 * - https://github.com/user/repo/tree/branch/path -> user/repo/path#branch
 * Otherwise returns the original string.
 *
 * @param {string} t
 * @returns {string}
 */
export function normalizeTemplateSpec(t) {
  if (!t || typeof t !== 'string') return t;

  if (/^https?:\/\//.test(t)) {
    try {
      const u = new URL(t);
      if (u.hostname.includes('github.com')) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const user = parts[0];
          let repo = parts[1].replace(/\.git$/, '');

          if (parts[2] === 'tree' && parts[3]) {
            const branch = parts[3];
            const subpath = parts.slice(4).join('/');
            let spec = `${user}/${repo}`;
            if (subpath) spec += `/${subpath}`;
            spec += `#${branch}`;
            return spec;
          }

          return `${user}/${repo}`;
        }
      }
    } catch (e) {
      // ignore and fall through
    }
  }

  return t;
}


/**
 * Clone a remote template into `targetPath` using `degit`.
 * Accepts full URLs, GitHub shorthand, and branch/subpath specifiers.
 *
 * @param {string} templateSpec
 * @param {string} targetPath
 * @param {{verbose?:boolean}} [options]
 */
export async function fetchTemplate(templateSpec, targetPath, options = {}) {
  const spec = normalizeTemplateSpec(templateSpec);
  const emitter = degit(spec, { cache: false, force: true, verbose: !!options.verbose });
  await emitter.clone(targetPath);
}
