import {
  type PageObjectResponse,
  type PartialPageObjectResponse,
  type PartialDatabaseObjectResponse,
  type DatabaseObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { z } from "zod";
import { type AtlasPageName } from "./processed-data.js";

export const RelationArray = z
  .array(z.object({ id: z.string().nullish() }).nullish())
  .nullish();

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

export const RichTextField = z
  .object({
    rich_text: z.array(RichText).nullish(),
  })
  .nullish();

export type TRichTextField = z.infer<typeof RichTextField>;

export const TitleField = z
  .object({
    type: z.literal("title"),
    title: z.array(RichText).nullish(),
  })
  .nullish();

export type TTitleField = z.infer<typeof TitleField>;

export const Relation = z
  .object({
    relation: RelationArray,
  })
  .nullish();
export type TRelation = z.infer<typeof Relation>;

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

export const Files = z
  .object({
    id: z.string(),
    type: z.literal("files"),
    files: z.array(z.union([File, ExternalFile])).nullish(),
  })
  .nullish();

export type TFiles = z.infer<typeof Files>;

export type NotionDatabaseQueryResponse =
  | PageObjectResponse
  | PartialPageObjectResponse
  | PartialDatabaseObjectResponse
  | DatabaseObjectResponse;

export type FetchAtlasNotionPagesResult = Record<
  AtlasPageName,
  NotionDatabaseQueryResponse[]
>;
