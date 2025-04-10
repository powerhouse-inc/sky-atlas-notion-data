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
  ViewNodeInputs,
} from "./types/processed-data.js";

export async function makeViewNodeInputs(args: {
  processedAtlasPagesByIdByPageName: ProcessedAtlasPagesByIdByPageName;
  processedHubById: TProcessedHubById;
  masterStatusNameStrings: Record<string, string>;
}) {
  const {
    processedAtlasPagesByIdByPageName,
    processedHubById,
    masterStatusNameStrings,
  } = args;

  const viewNodeInputs = {} as ViewNodeInputs;

  for (const pageName of Object.keys(processedAtlasPagesByIdByPageName)) {
    const items = makeViewNodeInput(
      processedAtlasPagesByIdByPageName[pageName as AtlasPageName],
      masterStatusNameStrings,
      processedHubById,
    );

    for (const item of Object.values(items)) {
      viewNodeInputs[item.id] = item;
    }
  }

  return viewNodeInputs;
}
function makeViewNodeInput(
  processedAtlasPagesById: ProcessedAtlasPagesById,
  masterStatusNameStrings: Record<string, string>,
  processedHubById: TProcessedHubById,
) {
  const items: Items = {};
  for (const processed of Object.values(processedAtlasPagesById)) {
    const masterStatus = getIds(processed.masterStatus);
    const masterStatusNames = getMasterStatusNames(
      masterStatus,
      masterStatusNameStrings,
    );
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
      masterStatus,
      masterStatusNames,
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
