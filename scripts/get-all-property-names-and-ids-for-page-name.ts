import { Client } from "@notionhq/client";
import {
  type PageObjectResponse,
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
  type DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { apiKey, pageIds, SCENARIO_VARIATION } from "../src/constants.js";
import { type PageName } from "../src/index.js";

export async function getAllPropertyNamesAndIdsForPageName(pageName: PageName) {
  const notion = new Client({ auth: apiKey });
  const databaseId = pageIds[pageName];
  const pages: (
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse
  )[] = [];
  let cursor: string | undefined = undefined;
  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

    pages.push(...results);

    if (!next_cursor) break;

    cursor = next_cursor;
  }

  const propertyIdMap: Record<string, string> = {};

  for (const page of pages) {
    if ("properties" in page) {
      const properties = page.properties;
      for (const propertyName of Object.keys(properties)) {
        if (!propertyIdMap[propertyName]) {
          propertyIdMap[propertyName] = properties[propertyName].id;
        } else if (
          propertyIdMap[propertyName] !== properties[propertyName].id
        ) {
          console.log(
            `Property ${propertyName} has multiple ids: ${propertyIdMap[propertyName]} and ${properties[propertyName].id}`,
          );
        }
      }
    }
  }

  return propertyIdMap;
}

const properties =
  await getAllPropertyNamesAndIdsForPageName(SCENARIO_VARIATION);
console.log(properties);
