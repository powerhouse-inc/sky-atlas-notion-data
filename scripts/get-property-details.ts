// #!/usr/bin/env node
import {
  apiKey, pageIds
} from "../src/constants.js";
import { Client } from "@notionhq/client";
import { parseArgs } from "util";
import { handleEnv } from "./handleEnv.js";

handleEnv();
main();

async function main() {
  const args = parseArgs({
    options: {
      propertyName: { type: "string" },
      pageName: { type: "string" },
    },
  });

  const { propertyName, pageName } = args.values;

  if (!propertyName || !pageName) {
    console.error("Missing required arguments");
    process.exit(1);
  }

  const propertyDetails = await getPropertyDetailsForPageByPropertyName(propertyName, pageName);
  const json = JSON.stringify(propertyDetails, null, 2);
  console.log(json);
}

async function getPropertyDetailsForPageByPropertyName(
  propertyName: string,
  pageName: string,
) {
  const notion = new Client({ auth: apiKey });

  const pageId = pageIds[pageName as keyof typeof pageIds];
  const response = await notion.databases.query({
    database_id: pageId,
    page_size: 1,
  });
  const firstNotionPage = response.results[0];
  if (!("properties" in firstNotionPage)) {
    throw new Error("No properties found for page");
  }
  const properties = firstNotionPage.properties;
  const property = properties[propertyName];
  if (!property) {
    throw new Error(`Property ${propertyName} not found for page ${pageName}`);
  }
  return {
    name: propertyName,
    id: property.id,
    type: property.type,
  }
}
