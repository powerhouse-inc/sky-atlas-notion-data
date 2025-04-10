// #!/usr/bin/env node
import {
  atlasPageNames,
  fetchAtlasNotionPages,
  getNotionPage,
  HUB,
  makeViewNodeInputs,
  MASTER_STATUS,
  processAtlasNotionPages,
  processNotionPage,
  processViewNodeInputs,
  type TProcessedSectionsById,
  type TProcessedHubById,
  type TProcessedMasterStatusById,
  type ViewNodeMap,
  type ViewNodeTree,
  handleAgents,
} from "../src/index.js";
import { parseArgs } from "util";
import { Client } from "@notionhq/client";
import fs from "fs";
import { mkdir } from "node:fs/promises";
import { Octokit } from "octokit";
import { handleEnv } from "./handleEnv.js";
import { writeJsonToFile } from "./utils.js";

handleEnv();
makeTree();

export async function makeTree() {
  const defaultOutputPath = "data";

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

  const outputPath = values.outputPath ?? defaultOutputPath;
  const useLocalData =
    values.useLocalData ?? process.env.USE_LOCAL_DATA === "true";
  const skipImportApi =
    values.skipImportApi ?? process.env.SKIP_IMPORT_API === "true";
  const skipGithubSnapshot =
    values.skipGithubSnapshot ?? process.env.SKIP_GITHUB_SNAPSHOT === "true";

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
  if (useLocalData) {
    const missingFiles = [];

    // Check if directories exist
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        missingFiles.push(`Directory: ${dir}`);
      }
    }

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
        "Error: --useLocalData option requires existing local data, but the following files/directories are missing:",
      );
      missingFiles.forEach((item) => console.error(`  - ${item}`));
      console.error(
        "\nPlease run the script without --useLocalData first to fetch data from Notion.",
      );
      process.exit(1);
    }
  }

  for (const dir of directories) {
    await mkdir(dir, { recursive: true });
  }

  const notion = new Client({ auth: process.env.API_KEY });

  const masterStatusNotionPage = await getNotionPage({
    notion,
    outputPath,
    pageName: MASTER_STATUS,
    useLocalData,
    noFilter: true,
  });
  const hubNotionPage = await getNotionPage({
    notion,
    outputPath,
    pageName: HUB,
    useLocalData,
    noFilter: true,
  });

  const fetchAtlasNotionPagesResult = await fetchAtlasNotionPages({
    notion,
    outputPath,
    useLocalData,
  });

  if (!useLocalData) {
    await writeJsonToFile(
      `${notionPagesOutputPath}/${MASTER_STATUS}.json`,
      masterStatusNotionPage,
    );

    await writeJsonToFile(
      `${notionPagesOutputPath}/${HUB}.json`,
      hubNotionPage,
    );

    for (const pageName of atlasPageNames) {
      await writeJsonToFile(
        `${notionPagesOutputPath}/${pageName}.json`,
        fetchAtlasNotionPagesResult[pageName],
      );
    }
  }

  const processedMasterStatusById = (await processNotionPage({
    page: masterStatusNotionPage,
    pageName: MASTER_STATUS,
    outputPath,
  })) as TProcessedMasterStatusById;

  await writeJsonToFile(
    `${processedOutputPath}/${MASTER_STATUS}.json`,
    processedMasterStatusById,
  );

  const processedHubById = (await processNotionPage({
    page: hubNotionPage,
    pageName: HUB,
    outputPath,
  })) as TProcessedHubById;

  await writeJsonToFile(`${processedOutputPath}/${HUB}.json`, processedHubById);

  const processedAtlasPagesByIdByPageName = await processAtlasNotionPages({
    atlasNotionPages: fetchAtlasNotionPagesResult,
    outputPath,
  });

  for (const pageName of atlasPageNames) {
    await writeJsonToFile(
      `${processedOutputPath}/${pageName}.json`,
      processedAtlasPagesByIdByPageName[pageName],
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
    masterStatusNameStrings,
  );

  const { section, agent } = processedAtlasPagesByIdByPageName;
  const sectionWithAgents = handleAgents(
    section as TProcessedSectionsById,
    agent as TProcessedSectionsById,
  );
  processedAtlasPagesByIdByPageName.section = sectionWithAgents;

  const viewNodeInputs = await makeViewNodeInputs({
    processedAtlasPagesByIdByPageName,
    processedHubById,
    masterStatusNameStrings,
  });

  console.log("created view node inputs");

  await writeJsonToFile(
    `${parsedOutputPath}/view-node-inputs.json`,
    viewNodeInputs,
  );

  const {
    viewNodeTree,
    viewNodeMap,
    slugLookup,
    nodeCountsText,
    simplifiedViewNodeTreeTxt,
  } = processViewNodeInputs(viewNodeInputs);

  console.log("processed view node inputs");
  console.log(nodeCountsText);

  await writeJsonToFile(`${outputPath}/view-node-tree.json`, viewNodeTree);
  await writeJsonToFile(`${outputPath}/view-node-map.json`, viewNodeMap);
  await writeJsonToFile(`${outputPath}/slug-lookup.json`, slugLookup);

  if (!skipGithubSnapshot) {
    await commitSnapshotToGithub(viewNodeTree, simplifiedViewNodeTreeTxt);
  }

  if (!skipImportApi) {
    await postToImportApi(viewNodeMap);
  }
}

async function commitSnapshotToGithub(
  viewNodeTree: ViewNodeTree,
  simplifiedViewNodeTreeTxt: string,
) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN is not set");
  }

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

async function postToImportApi(viewNodeMap: ViewNodeMap) {
  const importApiUrl = process.env.IMPORT_API_URL;
  const importApiKey = process.env.IMPORT_API_KEY;

  if (!importApiUrl) {
    throw new Error("IMPORT_API_URL is not set");
  }
  if (!importApiKey) {
    throw new Error("IMPORT_API_KEY is not set");
  }
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
