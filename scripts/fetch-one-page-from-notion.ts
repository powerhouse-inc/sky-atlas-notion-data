// #!/usr/bin/env node
import { handleEnv } from "./handleEnv.js";
import { parseArgs } from "util";
import { getNotionPage, processNotionPage } from "../src/fetching.js";
import { type PageName } from "../src/index.js";
import { writeJsonToFile } from "./utils.js";

handleEnv();
main();

/**
 * Fetch and process a single page from Notion
 * 
 * This script is used for development and testing purposes to fetch and process
 * a single page from Notion. It:
 * 1. Fetches the raw page data from Notion (or uses local data if specified)
 * 2. Saves the raw data to a JSON file
 * 3. Processes the page data
 * 4. Saves the processed data to a JSON file
 * 
 * The processed data includes:
 * - Corrected numbering for links and mentions
 * - Processed content structure
 * - Formatted titles and slugs
 */
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pageName: {
        type: "string",
        description: "Name of the page to fetch, must be of type PageName",
      },
      outputPath: {
        type: "string",
        description: "Path to write output files (default: 'data')",
      },
      useLocalData: {
        type: "boolean",
        description: "Use local data instead of fetching from Notion",
      },
      noFilter: {
        type: "boolean",
        description: "Skip filtering of page content",
      },
    },
    strict: true,
  });

  const {
    pageName,
    outputPath = "data",
    useLocalData = false,
    noFilter = false,
  } = values;

  // Fetch raw page data from Notion or use local data
  const notionPage = await getNotionPage({
    notionApiKey: process.env.API_KEY,
    pageName: pageName as PageName,
    outputPath,
    useLocalData,
    noFilter,
  });

  // Save raw page data
  await writeJsonToFile(
    `${outputPath}/notion-pages/${pageName}.json`,
    notionPage,
  );

  // Process the page data
  const processedPage = processNotionPage({
    page: notionPage,
    pageName: pageName as PageName,
  });

  // Save processed page data
  await writeJsonToFile(
    `${outputPath}/processed/${pageName}.json`,
    processedPage,
  );
}
