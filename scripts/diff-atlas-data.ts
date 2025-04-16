// #!/usr/bin/env node
import { readFile } from "fs/promises";
import { handleEnv } from "./handleEnv.js";
import { parseArgs } from 'util';
import { existsSync } from "fs";
import { type ViewNodeTree } from "../src/index.js";
import { makeSimplifiedAtlasData } from "./make-simplified-atlas-data.js";
import { createTwoFilesPatch } from "diff";
import { writeFile } from "fs/promises";

handleEnv();
main();

function printHelp() {
  console.log(`
Usage: diff-atlas-data [options]

Options:
  --baseDataPath <path>  Path to the base data file (required)
  --newDataPath <path>   Path to the new data file (required)
  --outputPath <path>    Path to save the diff files (required)
  --help                 Display this help message

This script compares two atlas data files and generates three types of diffs:
1. Raw diff of the original JSON files
2. Simplified diff of the processed data
3. Simplified and sorted diff of the processed data

Example:
  diff-atlas-data --baseDataPath data/old.json --newDataPath data/new.json --outputPath diffs/
`);
  process.exit(0);
}

async function main() {
  const args = parseArgs({
    args: process.argv.slice(2),
    options: {
      baseDataPath: {
        type: "string",
        description: "The path to the base data",
      },
      newDataPath: {
        type: "string",
        description: "The path to the new data",
      },
      outputPath: {
        type: "string",
        description: "The path to the output diff files",
      },
      help: {
        type: "boolean",
        description: "Display help information",
      },
    },
  });

  const { baseDataPath, newDataPath, outputPath, help } = args.values;

  if (help) {
    printHelp();
  }

  if (!baseDataPath) {
    console.error("Base data path is required");
    process.exit(1);
  }

  if (!existsSync(baseDataPath)) {
    console.error("Base data path does not exist");
    process.exit(1);
  }

  if (!newDataPath) {
    console.error("New data path is required");
    process.exit(1);
  }

  if (!existsSync(newDataPath)) {
    console.error("New data path does not exist");
    process.exit(1);
  }

  if (!outputPath) {
    console.error("Output path is required");
    process.exit(1);
  }

  if (!existsSync(outputPath)) {
    console.error("Output path does not exist");
    process.exit(1);
  }

  // base data to compare
  const baseDataText = await readFile(baseDataPath, "utf8");
  const baseDataJson = JSON.parse(baseDataText) as ViewNodeTree;
  const baseDataSimplified = makeSimplifiedAtlasData(baseDataJson);
  const baseDataSimplifiedText = baseDataSimplified.join("\n");
  const baseDataSimplifiedSorted = baseDataSimplified.toSorted();
  const baseDataSimplifiedSortedText = baseDataSimplifiedSorted.join("\n");

  // new data to compare
  const newDataText = await readFile(newDataPath, "utf8");
  const newDataJson = JSON.parse(newDataText) as ViewNodeTree;
  const newDataSimplified = makeSimplifiedAtlasData(newDataJson);
  const newDataSimplifiedText = newDataSimplified.join("\n");
  const newDataSimplifiedSorted = newDataSimplified.toSorted();
  const newDataSimplifiedSortedText = newDataSimplifiedSorted.join("\n");

  const rawDiff = createTwoFilesPatch(
    baseDataPath,
    newDataPath,
    baseDataText,
    newDataText,
  );
  
  const simplifiedDiff = createTwoFilesPatch(
    `simplified-${baseDataPath}`,
    `simplified-${newDataPath}`,
    baseDataSimplifiedText,
    newDataSimplifiedText,
  );
  
  const simplifiedSortedDiff = createTwoFilesPatch(
    `simplified-sorted-${baseDataPath}`,
    `simplified-sorted-${newDataPath}`,
    baseDataSimplifiedSortedText,
    newDataSimplifiedSortedText,
  );

  await writeFile(`${outputPath}/${Date.now()}-raw.diff`, rawDiff);
  await writeFile(`${outputPath}/${Date.now()}-simplified.diff`, simplifiedDiff);
  await writeFile(`${outputPath}/${Date.now()}-simplified-sorted.diff`, simplifiedSortedDiff);
}
