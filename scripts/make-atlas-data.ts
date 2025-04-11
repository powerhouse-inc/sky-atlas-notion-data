// #!/usr/bin/env node
import {
  atlasPageNames,
  fetchAtlasNotionPages,
  getNotionPage,
  HUB,
  makeNotionDataById,
  MASTER_STATUS,
  processAtlasNotionPages,
  processNotionPage,
  buildAtlasDataFromNotionData,
  type TProcessedSectionsById,
  type ViewNodeMap,
  type ViewNodeTree,
  handleAgents,
  type TProcessedMasterStatusById,
  type TProcessedHubById,
  DEFAULT_OUTPUT_PATH,
} from "../src/index.js";
import { parseArgs } from "util";
import fs from "fs";
import { mkdir } from "node:fs/promises";
import { Octokit } from "octokit";
import { handleEnv } from "./handleEnv.js";
import { writeJsonToFile, writeTxtToFile } from "./utils.js";

handleEnv();
main();

/**
 * Main function that orchestrates the entire process of fetching Notion data,
 * processing it, and optionally committing it to GitHub or posting to an import API.
 * 
 * Command line arguments:
 * - outputPath: Specify the output directory for generated files (default: from env or DEFAULT_OUTPUT_PATH)
 * - useLocalData: Use locally cached data instead of fetching from Notion
 * - skipImportApi: Skip posting the generated tree to the import API
 * - skipGithubSnapshot: Skip committing the generated tree to GitHub
 * - help: Display help message
 * 
 * Environment variables:
 * - API_KEY: Notion API key
 * - IMPORT_API_URL: URL for the import API
 * - IMPORT_API_KEY: API key for the import API
 * - GITHUB_TOKEN: GitHub token for committing snapshots
 * - OUTPUT_PATH: Output directory for generated files
 * - USE_LOCAL_DATA: Set to "true" to use data from local files
 * - SKIP_IMPORT_API: Set to "true" to skip posting to import API
 * - SKIP_GITHUB_SNAPSHOT: Set to "true" to skip committing snapshots to GitHub
 */
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      outputPath: {
        type: "string",
      },
      useLocalData: {
        type: "boolean",
      },
      skipImportApi: {
        type: "boolean",
      },
      skipGithubSnapshot: {
        type: "boolean",
      },
      help: {
        type: "boolean",
      },
    },
    strict: true,
  });

  if (values.help) {
    displayHelp();
  }

  const notionApiKey = process.env.API_KEY;
  const importApiUrl = process.env.IMPORT_API_URL;
  const importApiKey = process.env.IMPORT_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const outputPath =
    values.outputPath ?? process.env.OUTPUT_PATH ?? DEFAULT_OUTPUT_PATH;
  const useLocalData =
    values.useLocalData ?? process.env.USE_LOCAL_DATA === "true";
  const skipImportApi =
    values.skipImportApi ?? process.env.SKIP_IMPORT_API === "true";
  const skipGithubSnapshot =
    values.skipGithubSnapshot ?? process.env.SKIP_GITHUB_SNAPSHOT === "true";

  const { viewNodeTree, viewNodeMap, simplifiedViewNodeTreeTxt } =
    await makeAtlasData({
      outputPath,
      notionApiKey,
      useLocalData,
    });

  if (!skipGithubSnapshot) {
    if (!githubToken) {
      console.warn(
        "GITHUB_TOKEN is not set, skipping snapshot commit to Github"
      );
    } else {
      await commitSnapshotToGithub({
        githubToken,
        viewNodeTree,
        simplifiedViewNodeTreeTxt,
      });
    }
  }

  if (!skipImportApi) {
    if (!importApiKey) {
      console.warn(
        "WARNING: IMPORT_API_KEY is not set, skipping import API post"
      );
    }
    if (!importApiUrl) {
      console.warn(
        "WARNING: IMPORT_API_URL is not set, skipping import API post"
      );
    }
    if (importApiKey && importApiUrl) {
      await postToImportApi({ importApiKey, importApiUrl, viewNodeMap });
    }
  }
}

/**
 * Fetches and processes Notion data to create a structured tree representation.
 * 
 * @param outputPath - Directory where output files will be stored
 * @param notionApiKey - Notion API key for fetching data (optional if useLocalData is true)
 * @param useLocalData - Whether to use locally cached data instead of fetching from Notion
 * @returns Object containing the generated tree structure and related data
 */
async function makeAtlasData(args: {
  outputPath: string;
  notionApiKey?: string;
  useLocalData?: boolean;
}) {
  const { notionApiKey, outputPath, useLocalData = false } = args;

  if (!notionApiKey && !useLocalData) {
    console.warn(
      "  WARNING: Notion API_KEY env variable is not set, attempting to use data from local files."
    );
  }

  const notionPagesOutputPath = `${outputPath}/notion-pages`;
  const processedOutputPath = `${outputPath}/processed`;
  const parsedOutputPath = `${outputPath}/parsed`;
  const directories = [
    outputPath,
    notionPagesOutputPath,
    processedOutputPath,
    parsedOutputPath,
  ];

  // Check if local data exists when useLocalData is true
  if (useLocalData || !notionApiKey) {
    if (!fs.existsSync(notionPagesOutputPath)) {
      console.error(
        "Error: --useLocalData option requires existing local data, but the notion-pages directory is missing"
      );
      process.exit(1);
    }

    const missingFiles: string[] = [];

    // Check if required Notion page files exist
    const requiredNotionFiles = [
      `${notionPagesOutputPath}/${MASTER_STATUS}.json`,
      `${notionPagesOutputPath}/${HUB}.json`,
    ];

    // Add Atlas page files to required files
    for (const pageName of atlasPageNames) {
      requiredNotionFiles.push(`${notionPagesOutputPath}/${pageName}.json`);
    }

    for (const file of requiredNotionFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(`File: ${file}`);
      }
    }

    if (missingFiles.length > 0) {
      console.error(
        "Error: --useLocalData option requires existing local data, but the following files/directories are missing:"
      );
      missingFiles.forEach((item) => console.error(`  - ${item}`));
      console.error(
        "\nPlease run the script without --useLocalData first to fetch data from Notion."
      );
      process.exit(1);
    }
  }

  for (const dir of directories) {
    await mkdir(dir, { recursive: true });
  }

  const masterStatusNotionPage = await getNotionPage({
    notionApiKey,
    outputPath,
    pageName: MASTER_STATUS,
    useLocalData,
    noFilter: true,
  });
  const hubNotionPage = await getNotionPage({
    notionApiKey,
    outputPath,
    pageName: HUB,
    useLocalData,
    noFilter: true,
  });

  const fetchAtlasNotionPagesResult = await fetchAtlasNotionPages({
    notionApiKey,
    outputPath,
    useLocalData,
  });

  if (!useLocalData) {
    await writeJsonToFile(
      `${notionPagesOutputPath}/${MASTER_STATUS}.json`,
      masterStatusNotionPage
    );

    await writeJsonToFile(
      `${notionPagesOutputPath}/${HUB}.json`,
      hubNotionPage
    );

    for (const pageName of atlasPageNames) {
      await writeJsonToFile(
        `${notionPagesOutputPath}/${pageName}.json`,
        fetchAtlasNotionPagesResult[pageName]
      );
    }
  }

  const processedMasterStatusById =
    await processNotionPage<TProcessedMasterStatusById>({
      page: masterStatusNotionPage,
      pageName: MASTER_STATUS,
    });

  await writeJsonToFile(
    `${processedOutputPath}/${MASTER_STATUS}.json`,
    processedMasterStatusById
  );

  const processedHubById = await processNotionPage<TProcessedHubById>({
    page: hubNotionPage,
    pageName: HUB,
  });

  await writeJsonToFile(`${processedOutputPath}/${HUB}.json`, processedHubById);

  const processedAtlasPagesByIdByPageName = await processAtlasNotionPages(
    fetchAtlasNotionPagesResult
  );

  for (const pageName of atlasPageNames) {
    await writeJsonToFile(
      `${processedOutputPath}/${pageName}.json`,
      processedAtlasPagesByIdByPageName[pageName]
    );
  }

  const masterStatusNameStrings: Record<string, string> = {};
  for (const status of Object.values(processedMasterStatusById)) {
    if (status.nameString) {
      masterStatusNameStrings[status.id] = status.nameString;
    }
  }

  await writeJsonToFile(
    `${parsedOutputPath}/${MASTER_STATUS}.json`,
    masterStatusNameStrings
  );

  const { section, agent } = processedAtlasPagesByIdByPageName;
  const sectionWithAgents = handleAgents(
    section as TProcessedSectionsById,
    agent as TProcessedSectionsById
  );
  processedAtlasPagesByIdByPageName.section = sectionWithAgents;

  const notionDataById = await makeNotionDataById({
    processedAtlasPagesByIdByPageName,
    processedHubById,
    masterStatusNameStrings,
  });

  console.log("created notion data by id");

  await writeJsonToFile(
    `${parsedOutputPath}/notion-data-by-id.json`,
    notionDataById
  );

  const {
    viewNodeTree,
    viewNodeMap,
    slugLookup,
    nodeCountsText,
    simplifiedViewNodeTreeTxt,
  } = buildAtlasDataFromNotionData(notionDataById);

  console.log("built atlas data from notion data");
  console.log(nodeCountsText);

  await writeJsonToFile(`${outputPath}/atlas-data.json`, viewNodeTree);
  await writeJsonToFile(`${outputPath}/view-node-map.json`, viewNodeMap);
  await writeJsonToFile(`${outputPath}/slug-lookup.json`, slugLookup);
  await writeTxtToFile(`${outputPath}/view-node-counts.txt`, nodeCountsText);
  await writeTxtToFile(
    `${outputPath}/simplified-atlas-tree.txt`,
    simplifiedViewNodeTreeTxt
  );
  // for legacy use
  await writeJsonToFile(`${outputPath}/view-node-tree.json`, viewNodeTree);

  return {
    viewNodeTree,
    viewNodeMap,
    slugLookup,
    nodeCountsText,
    simplifiedViewNodeTreeTxt,
  };
}

/**
 * Commits the generated tree structure to GitHub as a snapshot.
 * 
 * @param githubToken - GitHub token for authentication
 * @param viewNodeTree - The generated tree structure to commit
 * @param simplifiedViewNodeTreeTxt - Text representation of the simplified tree
 */
async function commitSnapshotToGithub(args: {
  githubToken: string;
  viewNodeTree: ViewNodeTree;
  simplifiedViewNodeTreeTxt: string;
}) {
  const { githubToken, viewNodeTree, simplifiedViewNodeTreeTxt } = args;

  const octokit = new Octokit({ auth: githubToken });
  const owner = "powerhouse-inc";
  const repo = "sky-atlas-archive";

  try {
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/main`,
    });
    const latestCommitSha = refData.object.sha;

    // Get tree SHA
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const treeSha = commitData.tree.sha;

    const timestamp = new Date().toISOString().replace(/[:]/g, "-");

    // Prepare new files to commit
    const files = [
      {
        path: "atlas-tree.json",
        content: JSON.stringify(viewNodeTree, null, 2),
      },
      { path: "simplified-atlas-tree.txt", content: simplifiedViewNodeTreeTxt },
      {
        path: `snapshots/${timestamp}.json`,
        content: JSON.stringify(viewNodeTree, null, 2),
      },
      {
        path: `snapshots/${timestamp}-simplified-atlas-tree.txt`,
        content: simplifiedViewNodeTreeTxt,
      },
    ];

    // Create a new tree from files
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: files.map(({ path, content }) => ({
        path,
        mode: "100644",
        type: "blob",
        content,
      })),
    });

    // Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `Automated commit from Vercel build (${timestamp})`,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // Update branch reference to point to new commit
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/main`,
      sha: newCommit.sha,
    });

    console.log("Successfully committed snapshot to Github");
  } catch (error) {
    console.error("Error committing snapshot to Github");
    console.error(error);
  }
}

/**
 * Posts the generated tree structure to an import API.
 * 
 * @param importApiKey - API key for authentication with the import API
 * @param importApiUrl - URL of the import API endpoint
 * @param viewNodeMap - Map of nodes in the tree to post to the API
 */
async function postToImportApi(args: {
  importApiKey: string;
  importApiUrl: string;
  viewNodeMap: ViewNodeMap;
}) {
  const { importApiKey, importApiUrl, viewNodeMap } = args;
  try {
    const request = new Request(importApiUrl, {
      method: "POST",
      body: JSON.stringify(viewNodeMap, null, 2),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${importApiKey}`,
      },
    });

    const response = await fetch(request);

    console.log("Successfully posted to import API");
    console.log(response);
  } catch (error) {
    console.error("Error posting to import API");
    console.error(error);
  }
}

/**
 * Displays help information about the script's usage, options, and environment variables.
 * Exits the process after displaying the help message.
 */
function displayHelp() {
  console.log(`
MIPS Parser - Notion to Tree Structure Converter

This tool fetches data from Notion pages, processes it, and creates a structured tree representation.
It can also commit the generated tree to GitHub and post it to an import API.

Usage:
  make-tree [options]

Options:
  --outputPath <path>       Specify the output directory for generated files (default: "data")
  --useLocalData            Use locally cached data instead of fetching from Notion
                            Note: This option only works if you have already run the script at least once
                            to fetch and cache the Notion data. For development to avoid repeated fetches.
  --skipImportApi           Skip posting the generated tree to the import API
  --skipGithubSnapshot      Skip committing the generated tree to GitHub
  --help                    Display this help message

Environment Variables:
  API_KEY                   Notion API key
  GITHUB_TOKEN              GitHub token for committing snapshots
  IMPORT_API_URL            URL for the import API
  IMPORT_API_KEY            API key for the import API
  USE_LOCAL_DATA            Set to "true" to use locally cached data (requires previous fetch)
  SKIP_IMPORT_API           Set to "true" to skip posting to import API
  SKIP_GITHUB_SNAPSHOT      Set to "true" to skip committing to GitHub

Output Files:
  - data/notion-pages/      Raw Notion page data
  - data/processed/         Processed Notion page data
  - data/parsed/            Parsed data ready for tree generation
  - data/view-node-tree.json       Generated tree structure
  - data/view-node-map.json        Map of nodes in the tree
  - data/slug-lookup.json          Mapping of IDs to slugs
`);
  process.exit(0);
}
