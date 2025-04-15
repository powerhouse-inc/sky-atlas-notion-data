// #!/usr/bin/env node
import { parseArgs } from "util";
import { DEFAULT_ATLAS_DATA_URL, DEFAULT_OUTPUT_PATH } from "../src/constants.js";
import { writeFileSync } from "fs";
import { handleEnv } from "./handleEnv.js";

handleEnv();
main();

function printHelp() {
  console.log(`
Usage: fetch-latest-atlas-data [options]

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
  try {
    const viewNodeTreeResponse = await fetch(`${atlasDataUrl}/api/atlas-data-json`);
    const viewNodeTreeData = await viewNodeTreeResponse.text();
    console.log(`Successfully fetched view node tree data from ${atlasDataUrl}`);
    console.log(`Writing to ${outputPath}/atlas-data.json`);
    writeFileSync(`${outputPath}/atlas-data.json`, viewNodeTreeData);
    
    // for legacy reasons
    console.log(`Writing to ${outputPath}/view-node-tree.json`);
    writeFileSync(`${outputPath}/view-node-tree.json`, viewNodeTreeData);

    const viewNodeMapResponse = await fetch(`${atlasDataUrl}/api/view-node-map`);
    const viewNodeMapData = await viewNodeMapResponse.text();
    console.log(`Successfully fetched view node map data from ${atlasDataUrl}`);
    console.log(`Writing to ${outputPath}/view-node-map.json`);
    writeFileSync(`${outputPath}/view-node-map.json`, viewNodeMapData);
  } catch (error) {
    console.error(`Error fetching latest atlas data: `, error);
  }
}

