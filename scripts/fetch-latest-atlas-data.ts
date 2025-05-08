// #!/usr/bin/env node
import { parseArgs } from "util";
import { DEFAULT_ATLAS_DATA_URL, DEFAULT_OUTPUT_PATH } from "../src/constants.js";
import { existsSync } from "fs";
import { handleEnv } from "./handleEnv.js";
import { mkdir } from "fs/promises";
import { writeFile } from "fs/promises";

handleEnv();
main();

function printHelp() {
  console.log(`
Usage: fetch-latest-atlas-data [options]

Fetches the processed Atlas data from the server. This allows you to reuse already processed data
instead of fetching and processing raw Notion data directly. While processing is quick, fetching
raw data from Notion can take up to 15 minutes.

The script fetches two files:
- atlas-data.json (also written as view-node-tree.json for legacy compatibility)
  Contains the processed view node tree structure
- view-node-map.json
  A flat map of every node's ID and its corresponding slug suffix for quick lookup

Options:
  --atlasDataUrl <url>    URL to fetch atlas data from (default: ${DEFAULT_ATLAS_DATA_URL})
  --outputPath <path>     Path to write output files (default: ${DEFAULT_OUTPUT_PATH})
  --help                  Show this help message

Environment variables:
  ATLAS_DATA_URL          Alternative way to specify the atlas data URL
  OUTPUT_PATH             Alternative way to specify the output path
`);
  process.exit(0);
}

/**
 * Main script to fetch the processed Atlas data from the server
 * 
 * This script fetches the processed data from the server instead of fetching and processing
 * raw Notion data directly. While the processing step is quick, fetching raw data from Notion
 * can take up to 15 minutes, so this script allows you to reuse the already processed data.
 * 
 * The script fetches two main data files:
 * 1. atlas-data.json (also written as view-node-tree.json for legacy compatibility)
 *    - Contains the processed view node tree structure
 * 2. view-node-map.json
 *    - A flat map of every node's ID and its corresponding slug suffix
 *    - Used for quick lookup of nodes by ID
 * 
 * These files contain the processed data that can be used directly by the Atlas Explorer.
 * 
 * @async
 * @function
 */
async function main() {
  const args = parseArgs({
    args: process.argv.slice(2),
    options: {
      atlasDataUrl: {
        type: "string",
      },
      outputPath: {
        type: "string",
      },
      help: {
        type: "boolean",
        short: "h",
      },
    },
    strict: true,
  });
  
  if (args.values.help) {
    printHelp();
  }
  
  const atlasDataUrl = args.values.atlasDataUrl ?? process.env.ATLAS_DATA_URL ?? DEFAULT_ATLAS_DATA_URL;
  const outputPath = args.values.outputPath ?? process.env.OUTPUT_PATH ?? DEFAULT_OUTPUT_PATH;

  if (!existsSync(outputPath)) {
    await mkdir(outputPath);
  }

  try {
    const viewNodeTreeResponse = await fetch(`${atlasDataUrl}/api/atlas-data-json`);
    const viewNodeTreeData = await viewNodeTreeResponse.text();
    console.log(`Successfully fetched view node tree data from ${atlasDataUrl}`);
    console.log(`Writing to ${outputPath}/atlas-data.json`);
    await writeFile(`${outputPath}/atlas-data.json`, viewNodeTreeData);
    
    // for legacy reasons
    console.log(`Writing to ${outputPath}/view-node-tree.json`);
    await writeFile(`${outputPath}/view-node-tree.json`, viewNodeTreeData);

    const viewNodeMapResponse = await fetch(`${atlasDataUrl}/api/view-node-map`);
    const viewNodeMapData = await viewNodeMapResponse.text();
    console.log(`Successfully fetched view node map data from ${atlasDataUrl}`);
    console.log(`Writing to ${outputPath}/view-node-map.json`);
    await writeFile(`${outputPath}/view-node-map.json`, viewNodeMapData);

    const atlasDataExtendedResponse = await fetch(`${atlasDataUrl}/api/atlas-data-extended`);
    const atlasDataExtendedData = await atlasDataExtendedResponse.text();
    console.log(`Successfully fetched atlas data extended from ${atlasDataUrl}`);
    console.log(`Writing to ${outputPath}/atlas-data-extended.json`);
    await writeFile(`${outputPath}/atlas-data-extended.json`, atlasDataExtendedData);
  } catch (error) {
    console.error(`Error fetching latest atlas data: `, error);
  }
}

