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
import { pageProperties } from "./page-properties/index.js";
import { Client, isFullPage } from "@notionhq/client";
import {
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Fetches a single Notion page either from the API or local cache
 * Handles both online and offline modes with local data fallback
 */
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

  if (fetchFromLocalFile) {
    console.log("fetching " + pageName + " from local file");
  }

  const page = fetchFromLocalFile
    ? await fetchPageFromLocalFile(notionPagePath)
    : await fetchPageFromNotionDatabase(notion, pageName, noFilter);

  if (fetchFromLocalFile) {
    console.log("fetched " + pageName + " from local file");
  }

  return page;
}

/**
 * Processes a Notion page using the appropriate processor
 * Applies the page-specific transformation logic to convert raw Notion data
 */
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

/**
 * Fetches all pages from a Notion database
 * Handles pagination and relation fetching for complete data retrieval
 */
export async function fetchPageFromNotionDatabase(
  notion: Client,
  pageName: PageName,
  noFilter: boolean,
): Promise<NotionDatabaseQueryResponse[]> {
  const databaseId = pageIds[pageName];
  console.log(`Querying from Notion...`);
  console.log(`Database name: ${pageName}`);
  console.log(`Database id: ${databaseId}`);
  const properties = pageProperties[pageName];
  if (!properties.length) {
    console.warn(`WARNING: No properties found for ${pageName}`);
  } else {
    console.log("Querying properties:");
  }
  for (const property of properties) {
    console.log(`Property name: ${property.name}`);
    console.log(`Property id: ${property.id}`);
    console.log(`Property type: ${property.type}`);
  }
  const filterProperties = properties.map((property) => property.id);
  const pages: NotionDatabaseQueryResponse[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 1;
  const startTime = Date.now();

  while (true) {
    const queryStartTime = Date.now();
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      filter_properties: filterProperties,
      start_cursor: cursor,
      filter: noFilter ? undefined : notionDatabaseFilters,
    });
    const queryDuration = Date.now() - queryStartTime;
    console.log(`Fetched page ${pageCount} with ${results.length} results in ${formatDuration(queryDuration)}`);
    pages.push(...results);

    if (!next_cursor) break;

    cursor = next_cursor;
    pageCount++;
  }

  for (const page of pages) {
    if (!isFullPage(page)) continue;
    if ("properties" in page) {
      for (const property of Object.values(page.properties)) {
        if (
          property.type === "relation" &&
          "relation" in property &&
          "has_more" in property &&
          property.has_more === true
        ) {
          const relationStartTime = Date.now();
          console.log(`Fetching paginated relation ${properties.find((p) => p.id === property.id)?.name} for ${pageName}`);
          const fetchedPageProperties = await handlePaginatedRelations(
            notion,
            page.id,
            property.id,
          );
          const relationDuration = Date.now() - relationStartTime;
          console.log(`Fetched relation in ${formatDuration(relationDuration)}`);

          property.relation = fetchedPageProperties;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`Fetched ${pages.length} pages from Notion for ${pageName} in ${formatDuration(totalDuration)}`);
  return pages;
}

export async function fetchDatabaseIdFromNotionDatabase(
  notion: Client,
  databaseId: string,
  noFilter: boolean,
): Promise<NotionDatabaseQueryResponse[]> {
  console.log(`Querying from Notion...`);
  console.log(`Database id: ${databaseId}`);
  const pages: NotionDatabaseQueryResponse[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 1;
  const startTime = Date.now();

  while (true) {
    const queryStartTime = Date.now();
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      filter: noFilter ? undefined : notionDatabaseFilters,
    });
    const queryDuration = Date.now() - queryStartTime;
    console.log(`Fetched page ${pageCount} with ${results.length} results in ${formatDuration(queryDuration)}`);
    pages.push(...results);

    if (!next_cursor) break;

    cursor = next_cursor;
    pageCount++;
  }

  for (const page of pages) {
    if (!isFullPage(page)) continue;
    if ("properties" in page) {
      for (const property of Object.values(page.properties)) {
        if (
          property.type === "relation" &&
          "relation" in property &&
          "has_more" in property &&
          property.has_more === true
        ) {
          const relationStartTime = Date.now();
          const fetchedPageProperties = await handlePaginatedRelations(
            notion,
            page.id,
            property.id,
          );
          const relationDuration = Date.now() - relationStartTime;
          console.log(`Fetched relation in ${formatDuration(relationDuration)}`);

          property.relation = fetchedPageProperties;
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`Fetched ${pages.length} pages from Notion for ${databaseId} in ${formatDuration(totalDuration)}`);
  return pages;
}

/**
 * Fetches a page from local cache
 * Used when working offline or with cached data
 */
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

/**
 * Fetches all Atlas pages from Notion
 * Can use local data or Notion API, but local data must be present
 */
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

/**
 * Processes all Atlas pages using their respective processors
 * Converts raw Notion data into our processed format
 */
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

/**
 * Handles paginated relation fetching from Notion
 * Ensures all related pages are retrieved even when they span multiple pages
 */
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
