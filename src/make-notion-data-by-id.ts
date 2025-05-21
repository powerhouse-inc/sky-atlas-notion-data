import { type RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints.js";
import {
  getIds, getMasterStatusName, type NotionDataItemsById,
  ProcessedSection
} from "./index.js";
import type {
  AtlasPageName,
  ProcessedAtlasPagesById,
  ProcessedAtlasPagesByIdByPageName,
  NotionDataById,
  TProcessedRichText,
} from "./types/processed-data.js";
import { capitalizedTagsMap } from "./utils/tags-map.js";

/* Takes all of the notion data and puts it into a map by id.
 * 
 * This is used to look up data for a given id when building the Atlas Explorer.
*/
export async function makeNotionDataById(
  processedAtlasPagesByIdByPageName: ProcessedAtlasPagesByIdByPageName) {
  const notionDataById = {} as NotionDataById;

  for (const pageName of Object.keys(processedAtlasPagesByIdByPageName)) {
    const items = makeNotionDataForPage(
      processedAtlasPagesByIdByPageName[pageName as AtlasPageName],
    );

    for (const item of Object.values(items)) {
      notionDataById[item.id] = item;
    }
  }

  return notionDataById;
}

function makeNotionDataForPage(
  processedAtlasPagesById: ProcessedAtlasPagesById,
) {
  const notionDataItemsById: NotionDataItemsById = {};
  for (const processed of Object.values(processedAtlasPagesById)) {
    notionDataItemsById[processed.id] = {
      id: processed.id,
      type: processed.type,
      docNo: processed.docNoString,
      name: processed.nameString,
      content: processed.content,
      rawContent: processed.rawContent as RichTextItemResponse[],
      children: getIds(processed.children),
      files: processed.files ?? [],
      globalTags: (processed.globalTags ?? []).map((tag) => capitalizedTagsMap[tag.id]),
      originalContextData: getIds(processed.originalContextData),
      masterStatus: getMasterStatusName(processed.masterStatus?.[0]?.id),
    };

    if (ProcessedSection.safeParse(processed).success) {
      const { parents, number, isAgentArtifact, isSkyPrimitive } =
        ProcessedSection.parse(processed);
      notionDataItemsById[processed.id].parents = getIds(parents);
      notionDataItemsById[processed.id].number = number;
      notionDataItemsById[processed.id].isAgentArtifact = isAgentArtifact ?? false;
      notionDataItemsById[processed.id].isSkyPrimitive = isSkyPrimitive ?? false;
    }
  }

  return notionDataItemsById;
}
