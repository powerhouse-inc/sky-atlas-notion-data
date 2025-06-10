import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { put, list, del } from '@vercel/blob';
import { FILES_TO_UPLOAD } from './upload-data/constants.js';
import { checkIfFilesExist, getCurrentTimestamp, getCurrentVersion } from './upload-data/utils.js';
import {
  deleteOldBuilds,
  getBuildRecords,
  getPreviousBuilds,
  uploadFile,
  uploadManifest,
} from './upload-data/blob-utils.js';
import type { Manifest, UploadedFile } from './upload-data/types.js';

dotenv.config();

// Function to delete all files in a timestamp build folder
async function deleteTimestampBuild(
  versionFolder: string,
  timestampBuild: string,
  token: string
): Promise<void> {
  try {
    const { blobs } = await list({ token });
    const filesToDelete = blobs.filter((blob) =>
      blob.pathname.startsWith(`${versionFolder}/${timestampBuild}/`)
    );

    for (const blob of filesToDelete) {
      await del(blob.url, { token });
      console.log(`🗑️ Deleted: ${blob.pathname}`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete timestamp build ${versionFolder}/${timestampBuild}:`, error);
  }
}

async function uploadData() {
  // Get version and timestamp at start of script
  const version = getCurrentVersion();
  const timestamp = getCurrentTimestamp();
  const uploadDate = new Date().toISOString();
  const versionFolder = `v${version}`;
  const timestampFolder = `data-${timestamp}`;
  const dataPath = `${versionFolder}/${timestampFolder}`;

  if (!checkIfFilesExist(FILES_TO_UPLOAD)) {
    console.error('❌ Some files do not exist, skipping upload');
    process.exit(1);
  }

  console.log(`📦 Uploading to folder: ${dataPath}`);
  console.log(`📅 Upload timestamp: ${uploadDate}`);

  // Ensure token is present
  const token = process.env.DATA_STORAGE_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Missing DATA_STORAGE_READ_WRITE_TOKEN in environment');
    process.exit(1);
  }

  // Get existing timestamp builds within the same version to track previous builds
  const previousBuilds = await getPreviousBuilds(versionFolder, token);

  console.log(`\n🔍 Debug info:`);
  console.log(`   - Current timestamp folder: ${timestampFolder}`);
  console.log(`   - Previous builds (all existing): [${previousBuilds.join(', ')}]`);
  console.log(`📋 Found ${previousBuilds.length} existing builds in ${versionFolder}`);
  if (previousBuilds.length > 0) {
    console.log(`📂 Previous builds: ${previousBuilds.join(', ')}\n`);
  } else {
    console.log(`📂 No previous builds found\n`);
  }

  const uploadedFiles: Array<UploadedFile> = [];

  // Upload all data files into the timestamped folder within the version folder
  for (const relativePath of FILES_TO_UPLOAD) {
    const uploadedFile = await uploadFile(dataPath, relativePath, token);
    if (uploadedFile) {
      uploadedFiles.push(uploadedFile);
    } else {
      console.error(`❌ Exiting due to upload failure`);
      process.exit(1);
    }
  }

  const { previousBuilds: previousBuildsForManifest, buildsToDelete } =
    getBuildRecords(previousBuilds);

  // Create and upload manifest.json at the version level
  const manifest: Manifest = {
    version,
    uploadDate,
    latestBuild: timestampFolder,
    totalFiles: uploadedFiles.length,
    files: uploadedFiles,
    previousBuilds: previousBuildsForManifest,
  };

  try {
    const manifestResult = await uploadManifest(versionFolder, manifest, token);

    console.log(`✅ Uploaded manifest → ${manifestResult.url}`);
    console.log(
      `📋 Manifest contains ${uploadedFiles.length} files and ${previousBuildsForManifest.length + 1} previous builds`
    );
  } catch (err) {
    console.error(`❌ Failed to upload manifest:`, err);
    process.exit(1);
  }

  if (buildsToDelete.length > 0) {
    console.log(`\n🧹 Cleaning up ${buildsToDelete.length} old builds in ${versionFolder}...`);
    console.log(`\tRemoving: ${buildsToDelete.join(', ')}`);
    await deleteOldBuilds(versionFolder, buildsToDelete, token);
    console.log(
      `✅ Cleanup completed. Kept ${previousBuildsForManifest.length} most recent builds and the new one in ${versionFolder}.`
    );
  }
}

uploadData();
