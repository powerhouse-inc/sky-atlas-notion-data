import {
  getIds,
  getMasterStatusNames,
  type Items,
  type TProcessedHubById,
  ProcessedSection,
} from "./index.js";
import type {
  AtlasPageName,
  ProcessedAtlasPagesById,
  ProcessedAtlasPagesByIdByPageName,
  NotionDataById,
} from "./types/processed-data.js";

/* Takes all of the notion data and puts it into a map by id.
 * 
 * This is used to look up data for a given id when building the Atlas Explorer.
*/
export async function makeNotionDataById(args: {
  processedAtlasPagesByIdByPageName: ProcessedAtlasPagesByIdByPageName;
  processedHubById: TProcessedHubById;
}) {
  const {
    processedAtlasPagesByIdByPageName,
    processedHubById,
  } = args;

  const notionDataById = {} as NotionDataById;

  for (const pageName of Object.keys(processedAtlasPagesByIdByPageName)) {
    const items = makeNotionDataForPage(
      processedAtlasPagesByIdByPageName[pageName as AtlasPageName],
      processedHubById,
    );

    for (const item of Object.values(items)) {
      notionDataById[item.id] = item;
    }
  }

  return notionDataById;
}

function makeNotionDataForPage(
  processedAtlasPagesById: ProcessedAtlasPagesById,
  processedHubById: TProcessedHubById,
) {
  const items: Items = {};
  for (const processed of Object.values(processedAtlasPagesById)) {
    const hubUrls = getIds(processed.hub)
      .map((id) => processedHubById[id]?.url)
      .filter((item) => typeof item === "string");

    items[processed.id] = {
      id: processed.id,
      type: processed.type,
      docNo: processed.docNoString,
      name: processed.nameString,
      content: processed.content,
      children: getIds(processed.children),
      files: processed.files ?? [],
      hubUrls,
    };

    if (ProcessedSection.safeParse(processed).success) {
      const { parents, number, isAgentArtifact, isSkyPrimitive } =
        ProcessedSection.parse(processed);
      items[processed.id].parents = getIds(parents);
      items[processed.id].number = number;
      items[processed.id].isAgentArtifact = isAgentArtifact ?? false;
      items[processed.id].isSkyPrimitive = isSkyPrimitive ?? false;
    }
  }

  return items;
}
