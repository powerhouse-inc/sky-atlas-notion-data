// #!/usr/bin/env node
import { handleEnv } from "./handleEnv.js";
import { parseArgs } from "util";
import { fetchDatabaseIdFromNotionDatabase } from "../src/fetching.js";
import { writeJsonToFile } from "./utils.js";
import { Client } from "@notionhq/client";

handleEnv();
main();

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      databaseId: {
        type: "string",
        description: "ID of the database to fetch",
      },
      outputPath: {
        type: "string",
        description: "Path to write output file (default: 'data')",
      },
      outputDir: {
        type: "string",
        description: "Path to write output file (default: 'notion-pages')",
      },
      fileName: {
        type: "string",
        description: "Name of the output file (default: 'databaseId')",
      },
      noFilter: {
        type: "boolean",
        description: "Do not filter the database",
      },
      help: {
        type: "boolean",
        description: "Show help",
      },
    },
    strict: true,
  });

  const {
    databaseId,
    noFilter = false,
    outputPath = "data",
    outputDir = "notion-pages",
    fileName = databaseId,
    help,
  } = values;

  if (help) {
    console.log(
      "Fetch a database from Notion and save it to a JSON file. Usage: fetch-database-from-notion --databaseId <databaseId> [--noFilter] [--outputPath <outputPath>] [--outputDir <outputDir>] [--fileName <fileName>]",
    );
    return;
  }

  if (!databaseId) {
    throw new Error("Database ID is required");
  }

  const notion = new Client({
    auth: process.env.API_KEY,
  });
  const notionPage = await fetchDatabaseIdFromNotionDatabase(
    notion,
    databaseId,
    noFilter,
  );

  // Save raw page data
  await writeJsonToFile(
    `${outputPath}/${outputDir}/${fileName}.json`,
    notionPage,
  );
}
