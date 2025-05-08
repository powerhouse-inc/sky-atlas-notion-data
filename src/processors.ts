import {
  AnnotationsPageSchema,
  ArticlesPageSchema,
  MasterStatusPageSchema,
  NeededResearchPageSchema,
  OriginalContextDataPageSchema,
  ScenariosPageSchema,
  ScenarioVariationsPageSchema,
  ScopesPageSchema,
  SectionsPageSchema,
  TenetsPageSchema,
  type TStringFormula,
  type TNotionNumber,
  type TProcessedActiveDataById,
  type TProcessedAnnotationsById,
  type TProcessedArticlesById,
  type TProcessedMasterStatusById,
  type TProcessedNeededResearchById,
  type TProcessedOriginalContextDataById,
  type TProcessedScenariosById,
  type TProcessedScenarioVariationsById,
  type TProcessedScopesById,
  type TProcessedSectionsById,
  type TProcessedTenetsById,
} from "./types/index.js";
import { ActiveDataPageSchema } from "./types/page-schemas/activeData.js";
import {
  getContentFromRichText,
  getRelations,
  getTextFromSelect,
  makeProcessedRichTextString,
  getTextFromTitle,
  getProcessedFiles,
} from "./utils/processing.js";
import {
  ACTIVE_DATA,
  AGENT,
  agentArtifactsSectionId,
  ANNOTATION,
  ARTICLE,
  MASTER_STATUS,
  NEEDED_RESEARCH,
  ORIGINAL_CONTEXT_DATA,
  SCENARIO,
  SCENARIO_VARIATION,
  SCOPE,
  SECTION,
  TENET,
} from "./constants.js";
import { camelCase } from "change-case";
import { type TNotionUniqueId, type TDocType } from "./types/processed-data.js";
import { AgentsPageSchema } from "./types/page-schemas/agent.js";

function processScopes(pages: unknown): TProcessedScopesById {
  const scopesPages = ScopesPageSchema.parse(pages);
  const processed: TProcessedScopesById = {};

  for (const page of scopesPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const docNoString = makeProcessedRichTextString(docNo);
    const name = getContentFromRichText(properties.Name);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties.Articles),
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: SCOPE,
      docNo,
      docNoString,
      name,
      nameString,
      globalTags,
      content: [
        {
          text: getContentFromRichText(properties.Content),
        },
      ],
      children,
      masterStatus: getRelations(properties["Master Status"]),
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function processArticles(pages: unknown): TProcessedArticlesById {
  const articlesPages = ArticlesPageSchema.parse(pages);
  const processed: TProcessedArticlesById = {};

  for (const page of articlesPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const docNoString = makeProcessedRichTextString(docNo);
    const name = getContentFromRichText(properties.Name);
    const nameString = makeProcessedRichTextString(name);
    const globalTags = getRelations(properties["Global Tags"]);
    const children = [
      ...getRelations(properties["Sections & Primary Docs"]),
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    processed[id] = {
      id,
      type: ARTICLE,
      docNo,
      docNoString,
      name,
      nameString,
      content: [{ text: getContentFromRichText(properties.Content) }],
      children,
      masterStatus: getRelations(properties["Master Status"]),
      originalContextData: getRelations(properties["Original Context Data"]),
      globalTags,
    };
  }
  return processed;
}

function processSections(pages: unknown): TProcessedSectionsById {
  const sectionsPages = SectionsPageSchema.parse(pages);
  const processed: TProcessedSectionsById = {};

  for (const page of sectionsPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No (or Temp Name)"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties.Subdocs),
      ...getRelations(properties.Annotations),
      ...getRelations(properties.Tenets),
      ...getRelations(properties["Active Data"]),
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const parentArticle = getRelations(properties["Parent Article "]);
    const parentDoc = getRelations(properties["Parent Doc"]);
    const parents = parentDoc.length ? parentDoc : parentArticle;
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      children,
      parents,
      docNo,
      name,
      docNoString,
      nameString,
      number: getNumberFromNotionNumber(properties["No."]),
      type: camelCase(getTextFromSelect(properties.Type)) as TDocType,
      content: [
        { text: getContentFromRichText(properties.Content) },
        {
          heading: "components",
          text: getContentFromRichText(properties.Components),
        },
        {
          heading: "docIdentifierRules",
          text: getContentFromRichText(properties["Doc Identifier Rules"]),
        },
        {
          heading: "additionalLogic",
          text: getContentFromRichText(properties["Additional Logic"]),
        },
        {
          heading: "typeCategory",
          text: getTextFromSelect(properties["Type Category"]),
        },
        {
          heading: "typeName",
          text: getContentFromRichText(properties["Type Name"]),
        },
        {
          heading: "typeOverview",
          text: getContentFromRichText(properties["Type Overview"]),
        },
      ],
      masterStatus: getRelations(properties["Master Status"]),
      files: getProcessedFiles(properties["Files & media"]),
      globalTags,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }

  return processed;
}

function processAgents(pages: unknown): TProcessedSectionsById {
  const agentsPages = AgentsPageSchema.parse(pages);
  const processed: TProcessedSectionsById = {};

  for (const page of agentsPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Document Name"]);
    const name = getTextFromTitle(properties["Document Name"]);
    const nameString = makeProcessedRichTextString(name);
    const docNoString = nameString;
    const children = [
      ...getRelations(properties["Sub-item"]),
      ...getRelations(properties.Annotations),
      ...getRelations(properties.Tenets),
      ...getRelations(properties["Active Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const parentDoc = getRelations(properties["Parent item"]);
    const parents = parentDoc.length
      ? parentDoc
      : [{ id: agentArtifactsSectionId }];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      children,
      parents,
      docNo,
      name,
      docNoString,
      nameString,
      number: getNumberFromNotionStringFormula(properties["No."]),
      type: camelCase(getTextFromSelect(properties["Doc Type"])) as TDocType,
      content: [{ text: getContentFromRichText(properties.Content) }],
      masterStatus: getRelations(properties["Master Status"]),
      files: [],
      globalTags,
      originalContextData: [],
    };
  }

  return processed;
}

function processAnnotations(pages: unknown): TProcessedAnnotationsById {
  const annotationsPages = AnnotationsPageSchema.parse(pages);
  const processed: TProcessedAnnotationsById = {};

  for (const page of annotationsPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: ANNOTATION,
      docNo,
      docNoString,
      name,
      nameString,
      content: [{ text: getContentFromRichText(properties.Content) }],
      masterStatus: getRelations(properties["Master Status"]),
      children,
      globalTags,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function processTenets(pages: unknown): TProcessedTenetsById {
  const tenetsPages = TenetsPageSchema.parse(pages);
  const processed: TProcessedTenetsById = {};

  for (const page of tenetsPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No (or Temp Name)"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties.Scenarios),
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: TENET,
      docNo,
      docNoString,
      name,
      nameString,
      content: [{ text: getContentFromRichText(properties.Content) }],
      children,
      masterStatus: getRelations(properties["Master Status"]),
      globalTags,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function processScenarios(pages: unknown): TProcessedScenariosById {
  const scenariosPages = ScenariosPageSchema.parse(pages);
  const processed: TProcessedScenariosById = {};

  for (const page of scenariosPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No (or Temp Name)"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties["Scenario Variations"]),
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: SCENARIO,
      docNo,
      docNoString,
      name,
      nameString,
      content: [
        {
          heading: "description",
          text: getContentFromRichText(properties.Description),
        },
        {
          heading: "finding",
          text: getContentFromRichText(properties.Finding),
        },
        {
          heading: "additionalGuidance",
          text: getContentFromRichText(properties["Additional Guidance"]),
        },
      ],
      masterStatus: getRelations(properties["Master Status"]),
      children,
      globalTags,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function processScenarioVariations(
  pages: unknown,
): TProcessedScenarioVariationsById {
  const scenarioVariationsPages = ScenarioVariationsPageSchema.parse(pages);
  const processed: TProcessedScenarioVariationsById = {};

  for (const page of scenarioVariationsPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: SCENARIO_VARIATION,
      docNo,
      docNoString,
      name,
      nameString,
      content: [
        {
          heading: "description",
          text: getContentFromRichText(properties.Description),
        },
        {
          heading: "finding",
          text: getContentFromRichText(properties.Finding),
        },
        {
          heading: "additional guidance",
          text: getContentFromRichText(properties["Additional Guidance"]),
        },
      ],
      masterStatus: getRelations(properties["Master Status"]),
      globalTags,
      children,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function processNeededResearch(pages: unknown): TProcessedNeededResearchById {
  const neededResearchPages = NeededResearchPageSchema.parse(pages);
  const processed: TProcessedNeededResearchById = {};

  for (const page of neededResearchPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const docNoString = makeProcessedRichTextString(docNo);
    const name = getContentFromRichText(properties.Name);
    const nameString = makeProcessedRichTextString(name);
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      docNo,
      docNoString,
      name,
      nameString,
      type: NEEDED_RESEARCH,
      content: [
        {
          heading: "content",
          text: getContentFromRichText(properties["Content"]),
        },
      ],
      masterStatus: getRelations(properties["Master Status"]),
      children: [],
      globalTags,
      originalContextData: []
    };
  }
  return processed;
}

function processOriginalContextData(
  pages: unknown,
): TProcessedOriginalContextDataById {
  const originalContextDataPages = OriginalContextDataPageSchema.parse(pages);
  const processed: TProcessedOriginalContextDataById = {};

  for (const page of originalContextDataPages) {
    const id = page.id;
    const properties = page.properties;
    const name = getContentFromRichText(properties.Name);
    const nameString = makeProcessedRichTextString(name);
    const docNo = getTextFromTitle(properties["Doc No"]);
    const docNoString = makeProcessedRichTextString(docNo);
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: ORIGINAL_CONTEXT_DATA,
      docNo,
      docNoString,
      name,
      nameString,
      content: [{ text: getContentFromRichText(properties.Content) }],
      masterStatus: getRelations(properties["Master Status"]),
      children: [],
      globalTags,
      originalContextData: [],
    };
  }
  return processed;
}

function processMasterStatus(pages: unknown): TProcessedMasterStatusById {
  const masterStatusPages = MasterStatusPageSchema.parse(pages);
  const processed: TProcessedMasterStatusById = {};

  for (const page of masterStatusPages) {
    const id = page.id;
    const properties = page.properties;
    const name = getTextFromTitle(properties.Name);
    const nameString = makeProcessedRichTextString(name);
    processed[id] = {
      id,
      name,
      nameString,
    };
  }
  return processed;
}

function processActiveData(pages: unknown): TProcessedActiveDataById {
  const activeDataPages = ActiveDataPageSchema.parse(pages);
  const processed: TProcessedActiveDataById = {};

  for (const page of activeDataPages) {
    const id = page.id;
    const properties = page.properties;
    const docNo = getTextFromTitle(properties["Doc No"]);
    const name = getContentFromRichText(properties.Name);
    const docNoString = makeProcessedRichTextString(docNo);
    const nameString = makeProcessedRichTextString(name);
    const children = [
      ...getRelations(properties["Original Context Data"]),
      ...getRelations(properties["Needed Research"]),
    ];
    const globalTags = getRelations(properties["Global Tags"]);

    processed[id] = {
      id,
      type: ACTIVE_DATA,
      docNo,
      docNoString,
      name,
      nameString,
      content: [{ text: getContentFromRichText(properties.Content) }],
      masterStatus: getRelations(properties["Master Status"]),
      children,
      globalTags,
      originalContextData: getRelations(properties["Original Context Data"]),
    };
  }
  return processed;
}

function getNumberFromNotionNumber(
  notionNumber: TNotionNumber | null | undefined,
) {
  return notionNumber?.number;
}

function getNumberFromNotionUniqueId(
  notionUniqueId: TNotionUniqueId | null | undefined,
) {
  return notionUniqueId?.unique_id.number;
}

export function getNumberFromNotionStringFormula(
  notionStringFormula: TStringFormula | null | undefined,
) {
  const numberString = notionStringFormula?.formula?.string;
  const number = Number(numberString);
  if (isNaN(number)) {
    return null;
  }
  return number;
}

export const processors = {
  [MASTER_STATUS]: processMasterStatus,
  [ARTICLE]: processArticles,
  [SCOPE]: processScopes,
  [SECTION]: processSections,
  [AGENT]: processAgents,
  [ANNOTATION]: processAnnotations,
  [TENET]: processTenets,
  [SCENARIO]: processScenarios,
  [SCENARIO_VARIATION]: processScenarioVariations,
  [NEEDED_RESEARCH]: processNeededResearch,
  [ORIGINAL_CONTEXT_DATA]: processOriginalContextData,
  [ACTIVE_DATA]: processActiveData,
} as const;
