import { z } from "zod";
import type {
  TFiles,
  TProcessedFile,
  TProcessedRichText,
  TProcessedRichTextItem,
  TProcessedViewNodeContent,
  TTitleField,
  RawViewNode,
  RawViewNodeMap,
  ViewNodeMap,
  ViewNode,
  TProcessedNodeContentItem,
  TSectionDocType,
  TSupportDocType,
} from "../types/index.js";
import {
  RelationArray,
  SectionDocTypeSchema,
  SupportDocTypeSchema,
  type TProcessedRelations,
  type TRelation,
  type TRichTextField,
  type TSelect,
} from "../types/index.js";

export function getTextFromTitle(titleField: TTitleField): TProcessedRichText {
  const title = titleField?.title ?? [];

  return title.filter((item) => item !== null && item !== undefined);
}

export function getContentFromRichText(
  richTextField: TRichTextField,
): TProcessedRichText {
  const richText = richTextField?.rich_text ?? [];
  return richText.filter((item) => item !== null && item !== undefined);
}

export function makeProcessedRichTextString(richText: TProcessedRichText) {
  return richText
    .map((item) => item.plain_text)
    .join(" ")
    .trim();
}

export function getProcessedFiles(files: TFiles): TProcessedFile[] {
  if (!files?.files) return [];

  return files.files
    .map((file) => {
      if (file?.type === "file") {
        if (!file.file?.url) return null;
        return {
          url: file.file.url,
        };
      }

      if (file?.type === "external") {
        if (!file.external?.url) return null;
        return {
          url: file.external.url,
        };
      }

      return null;
    })
    .filter((file) => file !== null && file !== undefined);
}

export function getRelations(relation: TRelation) {
  if (!relation) return [];

  const result = RelationArray.safeParse(relation.relation);

  if (!result.success) {
    return [];
  }

  return (result.data?.filter((r) => Boolean(r?.id)) ??
    []) as TProcessedRelations;
}
export function getTextFromSelect(select: TSelect) {
  return select?.select?.name ?? "";
}

export function makeSchemaById<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return z.record(z.string(), schema);
}

export function getMasterStatusNames(
  masterStatusIds: string[],
  parsedMasterStatus: Record<string, string>,
): string[] {
  return masterStatusIds.map((id) => parsedMasterStatus[id]);
}

export function getIds(relations: any[]): string[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  return relations?.map((r) => r?.id) ?? [];
}

export function processRawViewNodeMap(
  rawViewNodeMap: RawViewNodeMap,
  slugLookup: Record<string, string>,
  viewNodeMap: ViewNodeMap = {},
): ViewNodeMap {
  for (const slugSuffix in rawViewNodeMap) {
    const rawNode = rawViewNodeMap[slugSuffix];
    if (rawNode) {
      processRawViewNode(rawNode, slugLookup, rawViewNodeMap, viewNodeMap);
    }
  }
  return viewNodeMap;
}

function processRawViewNode(
  node: RawViewNode,
  slugLookup: Record<string, string>,
  rawViewNodeMap: RawViewNodeMap,
  viewNodeMap: ViewNodeMap,
): ViewNode {
  // Avoid processing the same node multiple times
  if (viewNodeMap[node.slugSuffix]) {
    return viewNodeMap[node.slugSuffix]!;
  }

  // Process content using the updated function
  const content = processContentForViewNode(node, rawViewNodeMap, slugLookup);

  // Recursively process subDocuments
  const subDocuments = node.subDocuments
    ? node.subDocuments.map((subNode) =>
        processRawViewNode(subNode, slugLookup, rawViewNodeMap, viewNodeMap),
      )
    : [];

  // Create the ViewNode, omitting specified properties and adding processed ones
  const { content: _, subDocuments: __, ...rest } = node;
  const viewNode: ViewNode = {
    ...rest,
    content,
    subDocuments,
  };

  // Add the processed node to the map
  viewNodeMap[node.slugSuffix] = viewNode;

  return viewNode;
}

function processContentForViewNode(
  node: RawViewNode,
  rawViewNodeMap: RawViewNodeMap,
  slugLookup: Record<string, string>,
): TProcessedNodeContentItem[] {
  return node.content
    .map((contentItem) => {
      // Process the 'heading' field (preserve as is)
      const heading = contentItem.heading;

      let processedText: TProcessedViewNodeContent[] = [];

      // Process the 'text' field
      if (typeof contentItem.text === "string") {
        if (contentItem.text.length > 0) {
          processedText.push({
            type: "paragraphs",
            text: contentItem.text,
          });
        }
      } else if (Array.isArray(contentItem.text)) {
        processedText = contentItem.text
          .map((item) =>
            makeProcessedContentItem(item, rawViewNodeMap, slugLookup),
          )
          .filter(Boolean) as TProcessedViewNodeContent[];
      }

      // **Only include items that have non-empty 'processedText'**
      if (processedText.length > 0) {
        return {
          heading,
          text: processedText,
        };
      } else {
        return null;
      }
    })
    .filter((item) => item !== null && item !== undefined);
}

function makeProcessedContentItem(
  richTextItem: TProcessedRichTextItem,
  viewNodeMap: RawViewNodeMap,
  slugLookup: Record<string, string>,
): TProcessedViewNodeContent | null {
  if (
    richTextItem.type === "mention" &&
    richTextItem.mention?.page?.id &&
    richTextItem.plain_text?.length
  ) {
    return makeMentionContent(
      richTextItem.mention?.page?.id,
      richTextItem.plain_text,
      richTextItem.text?.link?.url,
      viewNodeMap,
      slugLookup,
    );
  }

  if (
    richTextItem.type === "text" &&
    richTextItem.text?.link?.url &&
    richTextItem.plain_text?.length
  ) {
    return makeLinkContent(
      richTextItem.text?.link?.url,
      richTextItem.plain_text,
      viewNodeMap,
      slugLookup,
    );
  }

  if (richTextItem.type === "equation" && richTextItem.plain_text?.length) {
    return makeEquationContent(richTextItem.plain_text);
  }

  if (richTextItem.annotations?.code && richTextItem.plain_text?.length) {
    return makeCodeContent(richTextItem.plain_text);
  }

  if (
    richTextItem.plain_text?.includes("----") &&
    richTextItem.plain_text?.length
  ) {
    return makeTableContent(richTextItem.plain_text);
  }

  if (richTextItem.plain_text?.length) {
    return makeParagraphsContent(richTextItem.plain_text);
  }

  return null;
}

function makeParagraphsContent(text: string) {
  return {
    type: "paragraphs",
    text,
  } as const;
}

function makeCodeContent(text: string) {
  return {
    type: "code",
    text,
  } as const;
}

function makeTableContent(text: string) {
  return {
    type: "table",
    text,
  } as const;
}

function makeEquationContent(text: string) {
  return {
    type: "equation",
    text,
  } as const;
}

function makeLinkContent(
  href: string,
  text: string,
  viewNodeMap: RawViewNodeMap,
  slugLookup: Record<string, string>,
) {
  const pageIdFromUrl = formatNotionIdFromUrl(href);
  const slug = getSlugWithSuffix(pageIdFromUrl ?? "", slugLookup);
  const node = viewNodeMap[slug];

  if (node) {
    const href = makeViewNodeUrl(node);
    const title = makeViewNodeTitleText(node);

    return {
      type: "link",
      text: title,
      href,
      external: false,
    } as const;
  }

  return {
    type: "link",
    text,
    href,
    external: true,
  } as const;
}

function makeMentionContent(
  id: string,
  text: string,
  url: string | null | undefined,
  viewNodeMap: RawViewNodeMap,
  slugLookup: Record<string, string>,
) {
  const slugWithSuffix = getSlugWithSuffix(id, slugLookup);
  const node = viewNodeMap[slugWithSuffix];
  const href = node ? makeViewNodeUrl(node) : (url ?? "");
  const title = node ? makeViewNodeTitleText(node) : text;
  return {
    type: "mention",
    text: title,
    href,
  } as const;
}

export function getSlugWithSuffix(
  id: string,
  slugLookup: Record<string, string>,
) {
  const slugFromLookup = slugLookup[id];
  const hasSlugFromLookup = !!slugFromLookup;

  if (!hasSlugFromLookup) {
    return id;
  }

  return `${id}|${slugFromLookup}`;
}

export function makeViewNodeUrl(node: RawViewNode) {
  const titleSlug = makeViewNodeTitleSlug(node);
  return `/${titleSlug}/${node.slugSuffix}`;
}

export function makeViewNodeTitleSlug(node: RawViewNode) {
  return makeViewNodeTitleText(node).replaceAll(/[- _/]+/g, "_");
}

export function makeViewNodeTitleText(node: ViewNode | RawViewNode): string {
  const { formalId, title, typeSuffix } = node.title;
  const { prefix, numberPath } = formalId;
  const numberPathString = numberPath.join(".");
  const typeSuffixString = typeSuffix ? ` - ${typeSuffix}` : "";

  return `${prefix}.${numberPathString} - ${title}${typeSuffixString}`;
}

export function formatNotionIdFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }
  // Check if the URL is a valid Notion link containing an ID
  const notionRegex = /^https:\/\/www\.notion\.so\/.+-([a-fA-F0-9]{32})$/;
  const match = notionRegex.exec(url);

  if (match) {
    // Extract the ID and format it
    const uuidWithoutDashes = match[1];
    return formatUUID(uuidWithoutDashes);
  }

  // Return null if the URL is not a valid Notion link
  return null;
}

export function formatUUID(uuid: string): string {
  if (uuid.length !== 32) {
    throw new Error("Invalid UUID string length");
  }

  return `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(
    12,
    16,
  )}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;
}

export function isSectionDocType(docType: string): docType is TSectionDocType {
  if (SectionDocTypeSchema.safeParse(docType).success) {
    return true;
  }

  return false;
}

export function isSupportDocType(docType: string): docType is TSupportDocType {
  if (SupportDocTypeSchema.safeParse(docType).success) {
    return true;
  }

  return false;
}

export function getSupportDocs(node: ViewNode) {
  return node.subDocuments.filter((subDoc) => isSupportDocType(subDoc.type));
}

export function getNonSupportDocs(node: ViewNode) {
  return node.subDocuments.filter((subDoc) => !isSupportDocType(subDoc.type));
}
