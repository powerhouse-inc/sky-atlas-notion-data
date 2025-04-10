import { Client } from "@notionhq/client";
import { handleEnv } from "./handleEnv.js";
import { parseArgs } from "util";
import { getNotionPage, processNotionPage } from "../src/fetching.js";
import { type PageName } from "../src/index.js";
import { writeJsonToFile } from "./utils.js";

handleEnv();
main();
async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      pageName: {
        type: "string",
      },
      outputPath: {
        type: "string",
      },
      useLocalData: {
        type: "boolean",
      },
      noFilter: {
        type: "boolean",
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

  const notion = new Client({
    auth: process.env.API_KEY,
  });

  const notionPage = await getNotionPage({
    notion,
    pageName: pageName as PageName,
    outputPath,
    useLocalData,
    noFilter,
  });

  await writeJsonToFile(
    `${outputPath}/notion-pages/${pageName}.json`,
    notionPage,
  );

  const processedPage = await processNotionPage({
    page: notionPage,
    pageName: pageName as PageName,
    outputPath,
  });

  await writeJsonToFile(
    `${outputPath}/processed/${pageName}.json`,
    processedPage,
  );
}
