import { z } from "zod";
import type {
  AllowedPageFieldType,
  PagePropertiesList,
  PageName,
} from "../types/processed-data.js";
import {
  allowedPageFieldTypes,
  apiKey,
  MASTER_STATUS,
  pageIds,
} from "../constants.js";
import { Client } from "@notionhq/client";
import {
  type PageObjectResponse,
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
  type DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { readFile, writeFile } from "node:fs/promises";

export async function getNewPagePropertyIdsFromNotion(
  propertyNamesToUpdate: string[] | "all",
  pageNames?: PageName[],
) {
  const notion = new Client({ auth: apiKey });

  const pagesToUpdate = pageNames ?? (Object.keys(pageIds) as PageName[]);

  for (const pageName of pagesToUpdate) {
    if (pageName === MASTER_STATUS) continue;
    const pageId = pageIds[pageName];
    const response = await notion.databases.query({
      database_id: pageId,
      page_size: 1,
    });
    const firstNotionPage = response.results[0];

    await updatePageProperties(
      propertyNamesToUpdate,
      firstNotionPage,
      pageName,
    );
  }
}

export async function updatePageProperties(
  propertyNamesToUpdate: string[] | "all",
  firstNotionPage:
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse,
  pageName: PageName,
) {
  console.log("updating page properties...", pageName);
  const PageWithPropertyIds = z.object({
    properties: z.record(
      z.string(),
      z.object({
        id: z.string(),
        type: z.union([
          z.literal("title"),
          z.literal("rich_text"),
          z.literal("select"),
          z.literal("relation"),
          z.literal("number"),
          z.literal("url"),
          z.literal("files"),
          z.string(),
        ]),
      }),
    ),
  });
  const shouldGetAllProperties = propertyNamesToUpdate === "all";
  const withIds = PageWithPropertyIds.parse(firstNotionPage);
  const properties = withIds.properties;
  const propertyNames = Object.keys(properties);
  const existingPropertiesFromFile = JSON.parse(
    await readFile(`src/page-properties/pages/${pageName}.json`, "utf-8"),
  ) as {
    name: string;
    id: string;
    type: AllowedPageFieldType;
  }[];

  const propertiesList: PagePropertiesList = [...existingPropertiesFromFile];

  for (const name of propertyNames) {
    if (!shouldGetAllProperties && !propertyNamesToUpdate.includes(name)) {
      continue;
    }
    const propertyForName = properties[name];
    if (!propertyForName) {
      continue;
    }
    if (
      !shouldGetAllProperties &&
      !allowedPageFieldTypes.includes(
        propertyForName.type as AllowedPageFieldType,
      )
    ) {
      continue;
    }
    const existingProperty = propertiesList.find((prop) => prop.name === name);

    if (existingProperty) {
      existingProperty.id = propertyForName.id;
    } else {
      propertiesList.push({
        name,
        id: propertyForName.id,
        type: propertyForName.type as AllowedPageFieldType,
      });
    }
  }
  await writeFile(
    `src/page-properties/pages/${pageName}.json`,
    JSON.stringify(propertiesList, null, 2),
  );
}
