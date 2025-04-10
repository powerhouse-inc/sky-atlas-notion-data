import type {
  TDocType,
  TNodeContent,
  TProcessedFile,
  TSectionDocType,
} from "./processed-data.js";

export type RawViewNode = {
  id: string;
  type: TDocType;
  title: ViewNodeTitle;
  hubUrls: string[];
  content: TNodeContent;
  slugSuffix: string;
  parentSlugSuffix: string | null;
  ancestorSlugSuffixes: string[];
  descendantSlugSuffixes: string[];
  subDocuments: RawViewNode[];
  files: TProcessedFile[];
};

export type ViewNode = Omit<RawViewNode, "content" | "subDocuments"> & {
  content: TProcessedNodeContentItem[];
  subDocuments: ViewNode[];
};
export type RawViewNodeMap = Record<string, RawViewNode | undefined>;

export type ViewNodeMap = Record<string, ViewNode | undefined>;

export type ViewNodeTree = ViewNode[];

export type ViewNodeTitle = {
  formalId: {
    prefix: string;
    numberPath: (number | string)[];
  };
  title: string;
  typeSuffix?: string;
};

export type CommonItemProperties = {
  id: string;
  masterStatus: string[];
  hubUrls: string[];
  masterStatusNames: string[];
  docNo: string;
  name: string;
  content: TNodeContent;
  children: string[];
  files: TProcessedFile[];
};

export type DefaultItem = CommonItemProperties & {
  type: TDocType;
  parents?: undefined;
  number?: undefined;
  isAgentArtifact?: undefined;
  isSkyPrimitive?: undefined;
};

export type SectionItem = CommonItemProperties & {
  type: TSectionDocType;
  parents: string[];
  number: number | null;
  isAgentArtifact?: boolean;
  isSkyPrimitive?: boolean;
};

export type Item = DefaultItem | SectionItem;

export type Items = Record<string, Item>;

export type Hub = Record<
  string,
  {
    id: string;
    url: string;
  }
>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type LinkViewNodeContent = {
  type: "link";
  text: string;
  href: string;
  external: boolean;
};

export type MentionViewNodeContent = {
  type: "mention";
  text: string;
  href: string;
};

export type EquationViewNodeContent = {
  type: "equation";
  text: string;
};

export type CodeViewNodeContent = {
  type: "code";
  text: string;
};

export type TableViewNodeContent = {
  type: "table";
  text: string;
};

export type ParagraphsViewNodeContent = {
  type: "paragraphs";
  text: string;
};

export type TProcessedViewNodeContent =
  | LinkViewNodeContent
  | MentionViewNodeContent
  | EquationViewNodeContent
  | CodeViewNodeContent
  | TableViewNodeContent
  | ParagraphsViewNodeContent;

// New type for processed content item
export type TProcessedNodeContentItem = {
  heading?: string | null;
  text: TProcessedViewNodeContent[];
};
