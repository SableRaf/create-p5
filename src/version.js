import { writeFile } from 'fs/promises';

/**
 * Fetches available p5.js versions from jsdelivr CDN API
 * @returns {Promise<{ latest: string, versions: string[] }>} Object containing latest version and array of up to 15 most recent versions
 */
export async function fetchVersions() {
  const apiUrl = 'https://data.jsdelivr.com/v1/package/npm/p5';

  const response = await fetch(apiUrl);
  const data = await response.json();

  const latest = data.tags.latest;
  const versions = data.versions.slice(0, 15); // Limit to 15 most recent

  return { latest, versions };
}

/**
 * Downloads p5.js files for local mode from jsdelivr CDN
 * @param {string} version - The p5.js version to download
 * @param {string} targetDir - The directory path where files should be saved
 * @returns {Promise<void>}
 */
export async function downloadP5Files(version, targetDir) {
  const cdnBase = 'https://cdn.jsdelivr.net/npm';

  // Download both regular and minified versions
  const files = [
    { url: `${cdnBase}/p5@${version}/lib/p5.js`, name: 'p5.js' },
    { url: `${cdnBase}/p5@${version}/lib/p5.min.js`, name: 'p5.min.js' }
  ];

  for (const file of files) {
    const response = await fetch(file.url);
    const content = await response.text();
    const targetPath = `${targetDir}/${file.name}`;
    await writeFile(targetPath, content, 'utf-8');
  }
}
