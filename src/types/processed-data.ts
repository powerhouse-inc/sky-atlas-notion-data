import { z } from "zod";
import {
  ACTIVE_DATA,
  ACTIVE_DATA_CONTROLLER,
  ANNOTATION,
  ARTICLE,
  CATEGORY,
  CORE,
  NEEDED_RESEARCH,
  ORIGINAL_CONTEXT_DATA,
  SCENARIO,
  SCENARIO_VARIATION,
  SCOPE,
  SECTION,
  TENET,
  TYPE_SPECIFICATION,
  type allowedPageFieldTypes,
  type allPageNames,
  type atlasPageNames,
  type referencePageNames,
} from "../constants.js";
import { makeSchemaById } from "../utils/processing.js";
import { RichTextAnnotations } from "./notion-data.js";
import type { Item } from "./view-nodes.js";

/**
 * Schema for Notion's unique ID fields, which combine a prefix and number
 */
export const NotionUniqueId = z.object({
  unique_id: z.object({
    number: z.number().nullish(),
    prefix: z.string().nullish(),
  }),
});

export type TNotionUniqueId = z.infer<typeof NotionUniqueId>;

/**
 * Schema for Notion's number fields
 */
export const NotionNumber = z.object({
  number: z.number().nullish(),
});

export type TNotionNumber = z.infer<typeof NotionNumber>;

/**
 * Schema for processed rich text content
 * Similar to Notion's rich text but with additional processing for mentions and links
 */
export const ProcessedRichText = z.array(
  z.object({
    type: z
      .union([z.literal("text"), z.literal("equation"), z.literal("mention")])
      .nullish(),
    text: z
      .object({
        link: z
          .object({
            url: z.string().nullish(),
          })
          .nullish(),
      })
      .nullish(),
    url: z.string().nullish(),
    plain_text: z.string().nullish(),
    annotations: RichTextAnnotations,
    mention: z
      .object({
        type: z.string().nullish(),
        page: z
          .object({
            id: z.string().nullish(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
  }),
);

export type TProcessedRichText = z.infer<typeof ProcessedRichText>;

export type TProcessedRichTextItem = TProcessedRichText[number];

/**
 * Schema for node content, which can include headings and rich text
 */
export const NodeContent = z.array(
  z.object({
    heading: z.string().nullish(),
    text: ProcessedRichText.or(z.string()).nullish(),
  }),
);

export type TNodeContent = z.infer<typeof NodeContent>;

/**
 * Schema for processed relations, which are simplified from Notion's format
 */
export const ProcessedRelations = z.array(z.object({ id: z.string() }));

export type TProcessedRelations = z.infer<typeof ProcessedRelations>;

/**
 * Schema for processed file references
 */
export const ProcessedFile = z.object({
  url: z.string(),
});

export const ProcessedFiles = z.array(ProcessedFile);

export type TProcessedFile = z.infer<typeof ProcessedFile>;

/**
 * Common relation fields used across different document types
 */
export const CommonRelations = {
  masterStatus: ProcessedRelations,
  hub: ProcessedRelations,
  children: ProcessedRelations,
};

/**
 * Schema for section document types
 * These are subject to special processing because their parent-child relationships are not always persisted both ways in Notion.
 * Categories also have special logic, see `makeNotionDataById` for details.
 */
export const SectionDocTypeSchema = z.union([
  z.literal(SECTION),
  z.literal(CORE),
  z.literal(ACTIVE_DATA_CONTROLLER),
  z.literal(TYPE_SPECIFICATION),
  z.literal(CATEGORY),
]);

export type TSectionDocType = z.infer<typeof SectionDocTypeSchema>;

/**
 * Schema for support document types
 * These are displayed below other contents in the Atlas Explorer
 */
export const SupportDocTypeSchema = z.union([
  z.literal(NEEDED_RESEARCH),
  z.literal(ORIGINAL_CONTEXT_DATA),
  z.literal(TENET),
  z.literal(ANNOTATION),
  z.literal(ACTIVE_DATA),
]);

export type TSupportDocType = z.infer<typeof SupportDocTypeSchema>;

/**
 * Schema for default document types
 * These are not subject to special processing
 */
export const DefaultDocTypeSchema = z.union([
  z.literal(SCOPE),
  z.literal(ARTICLE),
  z.literal(TENET),
  z.literal(SCENARIO),
  z.literal(SCENARIO_VARIATION),
]);

export type TDefaultDocType = z.infer<typeof DefaultDocTypeSchema>;

/**
 * Combined schema for all document types
 */
export const DocTypeSchema = z.union([
  SectionDocTypeSchema,
  SupportDocTypeSchema,
  DefaultDocTypeSchema,
]);

export type TDocType = z.infer<typeof DocTypeSchema>;

/**
 * Common properties shared across all processed documents
 */
export const SharedSchemaProperties = {
  ...CommonRelations,
  id: z.string(),
  docNo: ProcessedRichText,
  name: ProcessedRichText,
  docNoString: z.string(),
  nameString: z.string(),
  type: DocTypeSchema,
  content: NodeContent,
  files: ProcessedFiles.optional(),
};

/**
 * Schema for processed scenario variations
 */
export const ProcessedScenarioVariation = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedScenarioVariation = z.infer<
  typeof ProcessedScenarioVariation
>;

export const ProcessedScenarioVariationsById = makeSchemaById(
  ProcessedScenarioVariation,
);

export type TProcessedScenarioVariationsById = z.infer<
  typeof ProcessedScenarioVariationsById
>;

/**
 * Schema for processed scenarios
 */
export const ProcessedScenario = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedScenario = z.infer<typeof ProcessedScenario>;

export const ProcessedScenariosById = makeSchemaById(ProcessedScenario);

export type TProcessedScenariosById = z.infer<typeof ProcessedScenariosById>;

/**
 * Schema for processed scopes
 */
export const ProcessedScope = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedScope = z.infer<typeof ProcessedScope>;

export const ProcessedScopesById = makeSchemaById(ProcessedScope);

export type TProcessedScopesById = z.infer<typeof ProcessedScopesById>;

/**
 * Schema for processed articles
 */
export const ProcessedArticle = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedArticle = z.infer<typeof ProcessedArticle>;

export const ProcessedArticlesById = makeSchemaById(ProcessedArticle);

export type TProcessedArticlesById = z.infer<typeof ProcessedArticlesById>;

/**
 * Schema for processed sections
 * Includes additional fields for hierarchy and special flags for agent artifacts and sky primitives
 */
export const ProcessedSection = z.object({
  number: z.number().nullish(),
  parents: ProcessedRelations,
  isAgentArtifact: z.boolean().nullish(),
  isSkyPrimitive: z.boolean().nullish(),
  ...SharedSchemaProperties,
});

export type TProcessedSection = z.infer<typeof ProcessedSection>;

export const ProcessedSectionsById = makeSchemaById(ProcessedSection);

export type TProcessedSectionsById = z.infer<typeof ProcessedSectionsById>;

/**
 * Schema for processed annotations
 */
export const ProcessedAnnotation = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedAnnotation = z.infer<typeof ProcessedAnnotation>;

export const ProcessedAnnotationsById = makeSchemaById(ProcessedAnnotation);

export type TProcessedAnnotationsById = z.infer<
  typeof ProcessedAnnotationsById
>;

/**
 * Schema for processed tenets
 */
export const ProcessedTenet = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedTenet = z.infer<typeof ProcessedTenet>;

/**
 * Schema for processed active data
 */
export const ProcessedActiveData = z.object({
  ...SharedSchemaProperties,
});

export const ProcessedActiveDataById = makeSchemaById(ProcessedActiveData);

export type TProcessedActiveDataById = z.infer<typeof ProcessedActiveDataById>;

export type TProcessedActiveData = z.infer<typeof ProcessedActiveData>;

export const ProcessedTenetsById = makeSchemaById(ProcessedTenet);

export type TProcessedTenetsById = z.infer<typeof ProcessedTenetsById>;

/**
 * Schema for processed needed research
 */
export const ProcessedNeededResearch = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedNeededResearch = z.infer<typeof ProcessedNeededResearch>;

export const ProcessedNeededResearchById = makeSchemaById(
  ProcessedNeededResearch,
);

export type TProcessedNeededResearchById = z.infer<
  typeof ProcessedNeededResearchById
>;

/**
 * Schema for processed original context data
 */
export const ProcessedOriginalContextData = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedOriginalContextData = z.infer<
  typeof ProcessedOriginalContextData
>;

export const ProcessedOriginalContextDataById = makeSchemaById(
  ProcessedOriginalContextData,
);

export type TProcessedOriginalContextDataById = z.infer<
  typeof ProcessedOriginalContextDataById
>;

/**
 * Schema for processed master status
 */
export const ProcessedMasterStatus = z.object({
  id: z.string(),
  name: ProcessedRichText,
  nameString: z.string().nullish(),
});

export type TProcessedMasterStatus = z.infer<typeof ProcessedMasterStatus>;

export const ProcessedMasterStatusById = makeSchemaById(ProcessedMasterStatus);

export type TProcessedMasterStatusById = z.infer<
  typeof ProcessedMasterStatusById
>;

/**
 * Schema for processed hubs
 */
export const ProcessedHub = z.object({
  id: z.string(),
  url: z.string().nullish(),
});

export type TProcessedHub = z.infer<typeof ProcessedHub>;

export const ProcessedHubById = makeSchemaById(ProcessedHub);

export type TProcessedHubById = z.infer<typeof ProcessedHubById>;

/**
 * Type for Atlas page names
 */
export type AtlasPageNames = typeof atlasPageNames;

export type AtlasPageName = AtlasPageNames[number];

/**
 * Type for reference page names
 */
export type ReferencePageNames = typeof referencePageNames;

export type ReferencePageName = ReferencePageNames[number];

/**
 * Type for all page names
 */
export type PageNames = typeof allPageNames;

export type PageName = PageNames[number];

/**
 * Type for allowed page field types
 */
export type AllowedPageFieldType = (typeof allowedPageFieldTypes)[number];

/**
 * Type for page properties list
 */
export type PagePropertiesList = {
  name: string;
  id: string;
  type: AllowedPageFieldType;
}[];

/**
 * Union type for all Atlas page types
 */
export type ProcessedAtlasPage =
  | TProcessedArticle
  | TProcessedScope
  | TProcessedSection
  | TProcessedAnnotation
  | TProcessedTenet
  | TProcessedScenario
  | TProcessedScenarioVariation
  | TProcessedNeededResearch
  | TProcessedOriginalContextData
  | TProcessedActiveData;

/**
 * Union type for all reference page types
 */
export type ProcessedReferencePage = TProcessedMasterStatus | TProcessedHub;

/**
 * Union type for all processed page types
 */
export type ProcessedPage = ProcessedAtlasPage | ProcessedReferencePage;

/**
 * Union type for all Atlas page maps
 */
export type ProcessedAtlasPagesById =
  | TProcessedArticlesById
  | TProcessedScopesById
  | TProcessedSectionsById
  | TProcessedAnnotationsById
  | TProcessedTenetsById
  | TProcessedScenariosById
  | TProcessedScenarioVariationsById
  | TProcessedNeededResearchById
  | TProcessedOriginalContextDataById
  | TProcessedActiveDataById;

/**
 * Union type for all reference page maps
 */
export type ProcessedReferencePagesById =
  | TProcessedMasterStatusById
  | TProcessedHubById;

/**
 * Union type for all processed page maps
 */
export type ProcessedPagesById =
  | ProcessedAtlasPagesById
  | ProcessedReferencePagesById;

/**
 * Type for Atlas page maps by page name
 */
export type ProcessedAtlasPagesByIdByPageName = Record<
  AtlasPageName,
  ProcessedAtlasPagesById
>;

/**
 * Type for reference page maps by page name
 */
export type ProcessedReferencePagesByIdByPageName = Record<
  ReferencePageName,
  ProcessedReferencePagesById
>;

/**
 * Type for all page maps by page name
 */
export type ProcessedPagesByIdByPageName = Record<PageName, ProcessedPagesById>;

/**
 * Type for page processors
 */
export type Processor = (pages: unknown) => ProcessedPagesById;

/**
 * Type for the result of fetching and processing Notion pages
 */
export type FetchAndProcessNotionPagesResult = {
  atlasPages: ProcessedAtlasPagesByIdByPageName;
  referencePages: {
    masterStatus: TProcessedMasterStatusById;
    hub: TProcessedHubById;
  };
};

/**
 * Type for Notion data by ID
 */
export type NotionDataById = Record<string, Item>;


