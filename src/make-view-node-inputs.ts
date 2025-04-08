import {
  getIds,
  getMasterStatusNames,
  type Items,
  type TProcessedHubById,
  type Item,
  ProcessedSection,
} from "./index.js";
import type {
  AtlasPageName,
  ProcessedAtlasPagesById,
  ProcessedAtlasPagesByIdByPageName,
} from "./types/processed-data.js";

export async function makeViewNodeInputs(args: {
  processedAtlasPagesByIdByPageName: ProcessedAtlasPagesByIdByPageName;
  processedHubById: TProcessedHubById;
  masterStatusNameStrings: Record<string, string>;
  outputPath: string;
}) {
  const {
    processedAtlasPagesByIdByPageName,
    processedHubById,
    masterStatusNameStrings,
    outputPath,
  } = args;

  const viewNodeInputs = {} as ViewNodeInputs;

  for (const pageName of Object.keys(processedAtlasPagesByIdByPageName)) {
    const items = makeViewNodeInput(
      processedAtlasPagesByIdByPageName[pageName as AtlasPageName],
      pageName as AtlasPageName,
      outputPath,
      masterStatusNameStrings,
      processedHubById,
    );

    for (const item of Object.values(items)) {
      viewNodeInputs[item.id] = item;
    }
  }

  return viewNodeInputs;
}
export type ViewNodeInputs = Record<string, Item>;

function makeViewNodeInput(
  processedAtlasPagesById: ProcessedAtlasPagesById,
  pageName: AtlasPageName,
  parsedPath: string,
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
      const { parents, number } = ProcessedSection.parse(processed);
      items[processed.id].parents = getIds(parents);
      items[processed.id].number = number;
    }
  }

  return items;
}
