import { format, parse } from 'date-fns';
import fs from 'fs';
import packageJson from '../../package.json' with { type: 'json' };

/**
 * Returns the current version by reading package.json from current working directory
 * @returns The current version
 */
export function getCurrentVersion(): string {
  return packageJson.version;
}

/**
 * Returns the current timestamp in YYYYMMDDHHMMSS format
 * @returns The current timestamp in YYYYMMDDHHMMSS format
 */
export function getCurrentTimestamp(): string {
  const currentDate = new Date();
  return format(currentDate, 'yyyyMMddHHmmss');
}

/**
 * Checks if the files exist
 * @param files - The files to check
 * @returns True if all files exist, false otherwise
 */
export function checkIfFilesExist(files: string[]): boolean {
  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      return false;
    }
  }
  return true;
}

/**
 * Returns the date of a build
 * @param build - The build to get the date of
 *
 * @returns The date of the build
 *
 * @example
 * // the format is data-YYYYMMDDHHMMSS
 * getBuildDate('data-20250609120000') // 2025-06-09T12:00:00.000Z
 */
export function getBuildDate(build: string): Date {
  const dateString = build.split('-')[1];
  return parse(dateString, 'yyyyMMddHHmmss', new Date());
}

/**
 * Compares two builds by their date
 *
 * @param a - The first build
 * @param b - The second build
 * @returns The difference in milliseconds between the two builds
 */
export function buildComparator(a: string, b: string): number {
  return getBuildDate(b).getTime() - getBuildDate(a).getTime();
}
