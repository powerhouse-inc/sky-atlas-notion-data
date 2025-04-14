import { atlasPageNames, notionDatabaseFilters, pageIds } from "./constants.js";
import { processors } from "./processors.js";
import type {
  AtlasPageName,
  FetchAtlasNotionPagesResult,
  NotionDatabaseQueryResponse,
  PageName,
  ProcessedAtlasPagesById,
  ProcessedAtlasPagesByIdByPageName,
  ProcessedPagesById,
} from "./types/index.js";
import { mkdir } from "node:fs/promises";
import { propertyIds } from "./page-properties/index.js";
import { Client, isFullPage } from "@notionhq/client";
import {
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export async function getNotionPage(args: {
  notionApiKey: string | undefined;
  outputPath: string;
  pageName: PageName;
  useLocalData: boolean;
  noFilter: boolean;
}) {
  const { notionApiKey, pageName, outputPath, useLocalData, noFilter } = args;

  if (!notionApiKey && !useLocalData) {
    throw new Error("notionApiKey is required when useLocalData is false");
  }

  const notion =
    useLocalData && !!notionApiKey
      ? undefined
      : new Client({ auth: notionApiKey });

  const notionPagesDirPath = `${outputPath}/notion-pages`;
  const pagesDirPath = `${outputPath}/pages`;

  if (!existsSync(notionPagesDirPath)) {
    await mkdir(notionPagesDirPath);
  }

  if (!existsSync(pagesDirPath)) {
    await mkdir(pagesDirPath);
  }

  const notionPagePath = `${notionPagesDirPath}/${pageName}.json`;
  const fetchFromLocalFile = useLocalData || !notion;

  const page = fetchFromLocalFile
    ? await fetchPageFromLocalFile(notionPagePath)
    : await fetchPageFromNotionDatabase(notion, pageName, noFilter);

  if (fetchFromLocalFile) {
    console.log("fetched " + pageName + " from local file");
  } else {
    console.log("fetched " + pageName + " from Notion");
  }

  return page;
}

export async function processNotionPage<
  T extends ProcessedPagesById = ProcessedPagesById,
>({
  page,
  pageName,
}: {
  page: NotionDatabaseQueryResponse[];
  pageName: PageName;
}): Promise<T> {
  const processor = processors[pageName];
  const processed = processor(page);

  console.log("processed" + " " + pageName);

  return processed as T;
}

export async function fetchPageFromNotionDatabase(
  notion: Client,
  pageName: PageName,
  noFilter: boolean,
): Promise<NotionDatabaseQueryResponse[]> {
  const databaseId = pageIds[pageName];
  const pagePropertyIds = propertyIds[pageName];
  const pages: NotionDatabaseQueryResponse[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      filter_properties: pagePropertyIds,
      start_cursor: cursor,
      filter: noFilter ? undefined : notionDatabaseFilters,
    });

    pages.push(...results);

    if (!next_cursor) break;

    cursor = next_cursor;
  }

  for (const page of pages) {
    if (!isFullPage(page)) continue;
    if ("properties" in page) {
      const properties = page.properties;

      for (const property of Object.values(properties)) {
        if (
          property.type === "relation" &&
          "relation" in property &&
          "has_more" in property &&
          property.has_more === true
        ) {
          const fetchedPageProperties = await handlePaginatedRelations(
            notion,
            page.id,
            property.id,
          );

          property.relation = fetchedPageProperties;
        }
      }
    }
  }

  return pages;
}

async function fetchPageFromLocalFile(notionPagePath: string) {
  if (!existsSync(notionPagePath)) {
    throw new Error(`Notion page not found: ${notionPagePath}\n\n`);
  }

  const fileContent = await readFile(notionPagePath, "utf-8");
  const pages = JSON.parse(fileContent) as Promise<
    (PartialPageObjectResponse | PartialDatabaseObjectResponse)[]
  >;

  return pages;
}
export async function fetchAtlasNotionPages(args: {
  notionApiKey: string | undefined;
  outputPath: string;
  useLocalData: boolean;
}): Promise<FetchAtlasNotionPagesResult> {
  const { notionApiKey, outputPath, useLocalData } = args;

  if (!notionApiKey && !useLocalData) {
    throw new Error("notionApiKey is required when useLocalData is false");
  }

  const atlasNotionPages = {} as FetchAtlasNotionPagesResult;

  for (const pageName of atlasPageNames) {
    const pageFromNotionDatabase = await getNotionPage({
      notionApiKey,
      outputPath,
      pageName,
      useLocalData,
      noFilter: false,
    });
    atlasNotionPages[pageName] = pageFromNotionDatabase;
  }

  return atlasNotionPages;
}

export async function processAtlasNotionPages(
  atlasNotionPages: FetchAtlasNotionPagesResult,
): Promise<ProcessedAtlasPagesByIdByPageName> {
  const atlasPages = {} as ProcessedAtlasPagesByIdByPageName;

  for (const key of Object.keys(atlasNotionPages)) {
    const pageName = key as AtlasPageName;
    const pageFromNotionDatabase = atlasNotionPages[pageName];
    const processedPage = await processNotionPage({
      page: pageFromNotionDatabase,
      pageName,
    });
    atlasPages[pageName] = processedPage as ProcessedAtlasPagesById;
  }

  return atlasPages;
}

export async function handlePaginatedRelations(
  notion: Client,
  pageId: string,
  propertyId: string,
) {
  let cursor: string | undefined = undefined;
  const fetchedRelationIds: { id: string }[] = [];

  while (true) {
    const response = await notion.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
      start_cursor: cursor,
    });

    if (response.type === "property_item") {
      const { results, next_cursor } = response;

      const relations = results
        .filter((r) => "relation" in r)
        .map((r) => r.relation);

      fetchedRelationIds.push(...relations);

      if (!next_cursor) break;

      cursor = next_cursor;
    }
  }

  return fetchedRelationIds;
}
