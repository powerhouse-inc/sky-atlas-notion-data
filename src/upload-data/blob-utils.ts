import fs from 'fs';
import path from 'path';
import { list, put, del, type PutBlobResult, type ListBlobResult } from '@vercel/blob';
import type { Manifest, UploadedFile } from './types.js';
import { buildComparator } from './utils.js';

/**
 * Returns the current manifest for a version folder
 *
 * @param versionFolder - The version folder
 * @param token - The token to use to list the blobs
 *
 * @returns The current manifest for a version folder or null if the manifest could not be found
 */
export async function getCurrentManifest(
  versionFolder: string,
  token: string
): Promise<Manifest | null> {
  const { blobs } = await list({ token, mode: 'folded', prefix: `${versionFolder}/` });

  const manifest = blobs.find((blob) => blob.pathname === `${versionFolder}/manifest.json`);

  if (!manifest) {
    return null;
  }

  // get the manifest json using fetch
  const manifestJson = (await fetch(manifest.url).then((res) => res.json())) as Manifest;

  return manifestJson;
}

/**
 * Returns the previous builds in a version folder
 *
 * @param versionFolder - The version folder
 * @param token - The token to use to list the blobs
 * @returns The previous builds in a version folder
 */
export async function getPreviousBuilds(versionFolder: string, token: string): Promise<string[]> {
  const { folders } = await list({ token, mode: 'folded', prefix: `${versionFolder}/` });

  const builds: string[] = [];

  for (const folder of folders) {
    builds.push(folder.split('/')[1]);
  }

  return builds;
}

/**
 * Uploads a file to a folder
 *
 * @param folderPath - The folder path to upload the file to
 * @param file - The file to upload
 * @param token - The token to use to upload the file
 *
 * @returns The uploaded file or null if the file could not be uploaded
 */
export async function uploadFile(
  folderPath: string,
  file: string,
  token: string
): Promise<UploadedFile | null> {
  const absolutePath = path.resolve(process.cwd(), file);
  const filename = path.basename(file);
  const blobPath = `${folderPath}/${filename}`;

  try {
    // Read entire file into memory (for very large files, consider streaming in chunks)
    const fileBuffer = fs.readFileSync(absolutePath);

    // Upload to Vercel Blob
    const result = await put(blobPath, fileBuffer, {
      // make blobs publicly readable
      access: 'public',
      token,
    });

    console.log(`✅ Uploaded "${file}" → ${result.url}`);

    return {
      name: filename,
      url: result.url,
      size: fileBuffer.length,
    };
  } catch (err) {
    console.error(`❌ Failed to upload "${file}":`, err);
    return null;
  }
}

/**
 * Uploads a manifest to a version folder
 *
 * @param versionFolder - The version folder to upload the manifest to
 * @param manifest - The manifest to upload
 * @param token - The token to use to upload the manifest
 *
 * @returns The uploaded manifest
 */
export async function uploadManifest(
  versionFolder: string,
  manifest: Manifest,
  token: string
): Promise<PutBlobResult> {
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  const result = await put(`${versionFolder}/manifest.json`, manifestBuffer, {
    access: 'public',
    token,
    allowOverwrite: true,
  });

  return result;
}

/**
 * Returns the previous builds and the builds to delete
 *
 * @param existingBuilds - The existing builds
 *
 * @returns The previous builds and the builds to delete
 */
export function getBuildRecords(existingBuilds: string[]): {
  previousBuilds: string[];
  buildsToDelete: string[];
} {
  // Sort existing builds by date (newest first)
  const sortedBuilds = [...existingBuilds].sort(buildComparator);

  // Keep the 2 most recent builds as previous builds
  const previousBuilds = sortedBuilds.slice(0, 2);

  // All other existing builds should be deleted
  const buildsToDelete = sortedBuilds.slice(2);

  return { previousBuilds, buildsToDelete };
}

/**
 * Deletes a folder and all its contents
 *
 * @param folderPath - The folder path to delete
 * @param token - The token to use to delete the folder
 */
async function deleteFolder(folderPath: string, token: string): Promise<void> {
  let cursor: string | undefined = undefined;

  do {
    // List up to 1000 blobs at a time under the prefix
    const response: ListBlobResult = await list({
      prefix: folderPath,
      cursor,
      limit: 1000,
      token,
    });
    // Delete all the blobs returned in this page
    const paths = response.blobs.map((blob) => blob.pathname);
    if (paths.length > 0) {
      await del(paths, { token });
    }
    cursor = response.cursor;
  } while (cursor);
}

/**
 * Deletes old builds
 *
 * @param versionFolder - The version folder to delete the builds from
 * @param buildsToDelete - The builds to delete
 * @param token - The token to use to delete the builds
 */
export async function deleteOldBuilds(
  versionFolder: string,
  buildsToDelete: string[],
  token: string
): Promise<void> {
  for (const build of buildsToDelete) {
    await deleteFolder(`${versionFolder}/${build}/`, token);
  }
}
