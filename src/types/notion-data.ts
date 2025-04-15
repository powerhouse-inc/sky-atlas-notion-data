import {
  type PageObjectResponse,
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
  type DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { z } from "zod";
import { type AtlasPageName } from "./processed-data.js";

/**
 * Schema for Notion formula fields that return string values
 */
export const StringFormula = z.object({
  type: z.literal("formula"),
  formula: z.object({
    type: z.literal("string"),
    string: z.string().nullish(),
  }).nullish(),
});

export type TStringFormula = z.infer<typeof StringFormula>;

/**
 * Schema for Notion relation fields, which contain arrays of page references
 */
export const RelationArray = z
  .array(z.object({ id: z.string().nullish() }).nullish())
  .nullish();

/**
 * Schema for text formatting annotations in Notion rich text
 * Includes bold, italic, strikethrough, underline, code, and color
 */
export const RichTextAnnotations = z
  .object({
    bold: z.boolean().nullish(),
    italic: z.boolean().nullish(),
    strikethrough: z.boolean().nullish(),
    underline: z.boolean().nullish(),
    code: z.boolean().nullish(),
    color: z.string().nullish(),
  })
  .nullish();

export type TRichTextAnnotations = z.infer<typeof RichTextAnnotations>;

/**
 * Schema for Notion rich text content
 * Can be plain text, mentions of other pages, or equations
 */
export const RichText = z
  .object({
    type: z.union([
      z.literal("text"),
      z.literal("mention"),
      z.literal("equation"),
    ]),
    text: z
      .object({
        content: z.string().nullish(),
        link: z
          .object({
            url: z.string().nullish(),
          })
          .nullish(),
      })
      .nullish(),
    plain_text: z.string().nullish(),
    annotations: RichTextAnnotations,
    mention: z
      .object({
        type: z.string().nullish(),
        page: z
          .object({
            id: z.string().nullish(),
          })
          .nullish(),
      })
      .nullish(),
  })
  .nullish();

export type TRichText = z.infer<typeof RichText>;

/**
 * Schema for Notion rich text fields, which contain arrays of rich text content
 */
export const RichTextField = z
  .object({
    rich_text: z.array(RichText).nullish(),
  })
  .nullish();

export type TRichTextField = z.infer<typeof RichTextField>;

/**
 * Schema for Notion title fields, which are special rich text fields
 */
export const TitleField = z
  .object({
    type: z.literal("title"),
    title: z.array(RichText).nullish(),
  })
  .nullish();

export type TTitleField = z.infer<typeof TitleField>;

/**
 * Schema for Notion relation fields, which link to other pages
 */
export const Relation = z
  .object({
    relation: RelationArray,
  })
  .nullish();
export type TRelation = z.infer<typeof Relation>;

/**
 * Schema for Notion select fields, which contain a single selected option
 */
export const Select = z
  .object({
    select: z
      .object({
        name: z.string().nullish(),
      })
      .nullish(),
  })
  .nullish();

export type TSelect = z.infer<typeof Select>;

/**
 * Schema for Notion file fields that contain uploaded files
 */
export const File = z
  .object({
    type: z.literal("file"),
    file: z
      .object({
        url: z.string().nullish(),
      })
      .nullish(),
  })
  .nullish();

export type TFile = z.infer<typeof File>;

/**
 * Schema for Notion file fields that contain external file links
 */
export const ExternalFile = z
  .object({
    type: z.literal("external"),
    external: z
      .object({
        url: z.string().nullish(),
      })
      .nullish(),
  })
  .nullish();

export type TExternalFile = z.infer<typeof ExternalFile>;

/**
 * Schema for Notion files fields, which can contain both uploaded and external files
 */
export const Files = z
  .object({
    id: z.string(),
    type: z.literal("files"),
    files: z.array(z.union([File, ExternalFile])).nullish(),
  })
  .nullish();

export type TFiles = z.infer<typeof Files>;

/**
 * Union type of all possible Notion API response types for database queries
 */
export type NotionDatabaseQueryResponse =
  | PageObjectResponse
  | PartialPageObjectResponse
  | PartialDatabaseObjectResponse
  | DatabaseObjectResponse;

/**
 * Type for the result of fetching Atlas pages from Notion
 * Maps page names to arrays of Notion page responses
 */
export type FetchAtlasNotionPagesResult = Record<
  AtlasPageName,
  NotionDatabaseQueryResponse[]
>;
