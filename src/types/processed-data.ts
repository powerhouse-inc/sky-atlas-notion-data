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

export const NotionNumber = z.object({
  number: z.number().nullish(),
});

export type TNotionNumber = z.infer<typeof NotionNumber>;

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

export const NodeContent = z.array(
  z.object({
    heading: z.string().nullish(),
    text: ProcessedRichText.or(z.string()).nullish(),
  }),
);

export type TNodeContent = z.infer<typeof NodeContent>;

export const ProcessedRelations = z.array(z.object({ id: z.string() }));

export type TProcessedRelations = z.infer<typeof ProcessedRelations>;

export const ProcessedFile = z.object({
  url: z.string(),
});

export const ProcessedFiles = z.array(ProcessedFile);

export type TProcessedFile = z.infer<typeof ProcessedFile>;

export const CommonRelations = {
  masterStatus: ProcessedRelations,
  hub: ProcessedRelations,
  children: ProcessedRelations,
};

export const SectionDocTypeSchema = z.union([
  z.literal(SECTION),
  z.literal(CORE),
  z.literal(ACTIVE_DATA_CONTROLLER),
  z.literal(TYPE_SPECIFICATION),
  z.literal(CATEGORY),
]);

export type TSectionDocType = z.infer<typeof SectionDocTypeSchema>;

export const SupportDocTypeSchema = z.union([
  z.literal(NEEDED_RESEARCH),
  z.literal(ORIGINAL_CONTEXT_DATA),
  z.literal(TENET),
  z.literal(ANNOTATION),
  z.literal(ACTIVE_DATA),
]);

export type TSupportDocType = z.infer<typeof SupportDocTypeSchema>;

export const DefaultDocTypeSchema = z.union([
  z.literal(SCOPE),
  z.literal(ARTICLE),
  z.literal(TENET),
  z.literal(SCENARIO),
  z.literal(SCENARIO_VARIATION),
]);

export type TDefaultDocType = z.infer<typeof DefaultDocTypeSchema>;

export const DocTypeSchema = z.union([
  SectionDocTypeSchema,
  SupportDocTypeSchema,
  DefaultDocTypeSchema,
]);

export type TDocType = z.infer<typeof DocTypeSchema>;

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

export const ProcessedScenario = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedScenario = z.infer<typeof ProcessedScenario>;

export const ProcessedScenariosById = makeSchemaById(ProcessedScenario);

export type TProcessedScenariosById = z.infer<typeof ProcessedScenariosById>;

export const ProcessedScope = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedScope = z.infer<typeof ProcessedScope>;

export const ProcessedScopesById = makeSchemaById(ProcessedScope);

export type TProcessedScopesById = z.infer<typeof ProcessedScopesById>;

export const ProcessedArticle = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedArticle = z.infer<typeof ProcessedArticle>;

export const ProcessedArticlesById = makeSchemaById(ProcessedArticle);

export type TProcessedArticlesById = z.infer<typeof ProcessedArticlesById>;

export const ProcessedSection = z.object({
  number: z.number().nullish(),
  parents: ProcessedRelations,
  ...SharedSchemaProperties,
});

export type TProcessedSection = z.infer<typeof ProcessedSection>;

export const ProcessedSectionsById = makeSchemaById(ProcessedSection);

export type TProcessedSectionsById = z.infer<typeof ProcessedSectionsById>;

export const ProcessedAnnotation = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedAnnotation = z.infer<typeof ProcessedAnnotation>;

export const ProcessedAnnotationsById = makeSchemaById(ProcessedAnnotation);

export type TProcessedAnnotationsById = z.infer<
  typeof ProcessedAnnotationsById
>;

export const ProcessedTenet = z.object({
  ...SharedSchemaProperties,
});

export type TProcessedTenet = z.infer<typeof ProcessedTenet>;

export const ProcessedActiveData = z.object({
  ...SharedSchemaProperties,
});

export const ProcessedActiveDataById = makeSchemaById(ProcessedActiveData);

export type TProcessedActiveDataById = z.infer<typeof ProcessedActiveDataById>;

export type TProcessedActiveData = z.infer<typeof ProcessedActiveData>;

export const ProcessedTenetsById = makeSchemaById(ProcessedTenet);

export type TProcessedTenetsById = z.infer<typeof ProcessedTenetsById>;

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

export const ProcessedHub = z.object({
  id: z.string(),
  url: z.string().nullish(),
});

export type TProcessedHub = z.infer<typeof ProcessedHub>;

export const ProcessedHubById = makeSchemaById(ProcessedHub);

export type TProcessedHubById = z.infer<typeof ProcessedHubById>;

export type AtlasPageNames = typeof atlasPageNames;

export type AtlasPageName = AtlasPageNames[number];

export type ReferencePageNames = typeof referencePageNames;

export type ReferencePageName = ReferencePageNames[number];

export type PageNames = typeof allPageNames;

export type PageName = PageNames[number];

export type AllowedPageFieldType = (typeof allowedPageFieldTypes)[number];

export type PagePropertiesList = {
  name: string;
  id: string;
  type: AllowedPageFieldType;
}[];

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

export type ProcessedReferencePage = TProcessedMasterStatus | TProcessedHub;

export type ProcessedPage = ProcessedAtlasPage | ProcessedReferencePage;

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

export type ProcessedReferencePagesById =
  | TProcessedMasterStatusById
  | TProcessedHubById;

export type ProcessedPagesById =
  | ProcessedAtlasPagesById
  | ProcessedReferencePagesById;

export type ProcessedAtlasPagesByIdByPageName = Record<
  AtlasPageName,
  ProcessedAtlasPagesById
>;

export type ProcessedReferencePagesByIdByPageName = Record<
  ReferencePageName,
  ProcessedReferencePagesById
>;

export type ProcessedPagesByIdByPageName = Record<PageName, ProcessedPagesById>;

export type Processor = (pages: unknown) => ProcessedPagesById;

export type FetchAndProcessNotionPagesResult = {
  atlasPages: ProcessedAtlasPagesByIdByPageName;
  referencePages: {
    masterStatus: TProcessedMasterStatusById;
    hub: TProcessedHubById;
  };
};
