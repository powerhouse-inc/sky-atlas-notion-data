import { makeSimplifiedAtlasData } from "../scripts/make-simplified-atlas-data.js";
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
} from "./constants.js";
import type { NotionDataById } from "./types/processed-data.js";
import {
  type RawViewNode,
  type Item,
  type RawViewNodeMap,
  type ViewNodeMap,
} from "./types/view-nodes.js";
import {
  processRawViewNodeMap as addLinkedContentToViewNodes,
  isSupportDocType,
  makeViewNodeTitleText,
} from "./utils/index.js";
import {
  getFirstElement,
  getLastElement,
  isSectionItem,
  makeSortedByNumberOrDocNo,
} from "./utils/view-nodes.js";

const DEBUG_OUTPUT = false;
const ANCESTOR_SLUG_CHARS = 4;
const slugLookup: Record<string, string> = {};

const nodeCounts = {
  unknown: 0,
  [SCOPE]: 0,
  [ARTICLE]: 0,
  [CORE]: 0,
  [ACTIVE_DATA_CONTROLLER]: 0,
  [SECTION]: 0,
  [TYPE_SPECIFICATION]: 0,
  [CATEGORY]: 0,
  [ANNOTATION]: 0,
  [NEEDED_RESEARCH]: 0,
  [ORIGINAL_CONTEXT_DATA]: 0,
  [SCENARIO]: 0,
  [SCENARIO_VARIATION]: 0,
  [TENET]: 0,
  [ACTIVE_DATA]: 0,
};

export function buildAtlasDataFromNotionData(notionDataById: NotionDataById) {
  const rawViewNodeMap = buildViewNodeTree(notionDataById);
  const viewNodeMap = addLinkedContentToViewNodes(rawViewNodeMap, slugLookup);
  const viewNodeTree = makeViewNodeTreeFromViewNodeMap(viewNodeMap);
  const simplifiedViewNodeTreeTxt = makeSimplifiedAtlasData(viewNodeMap).join("\n");
  const nodeCountsText = printNodeCounts();

  return {
    rawViewNodeMap,
    viewNodeMap,
    viewNodeTree,
    slugLookup,
    nodeCountsText,
    simplifiedViewNodeTreeTxt,
  };
}

let skyPrimitiveCounter = 0;

function buildViewNodeTree(viewNodeInputs: NotionDataById) {
  const rawViewNodeMap: Record<string, RawViewNode> = {};

  /* The scopes are the root nodes of the Atlas view tree */
  const scopes = Object.values(viewNodeInputs).filter(
    (item) => item.type === SCOPE,
  );

  const sortedScopes = makeSortedByNumberOrDocNo(scopes);

  /* This should always be `"A"`, if it changes later the whole Atlas will be changed */
  const firstScopePrefix = sortedScopes[0].docNo[0];

  sortedScopes.forEach((scope, index) => {
    const { id, content, hubUrls, files } = scope;
    /* A scope's number path is always its index only, because scopes are the root nodes of the Atlas view tree */
    const numberPath = [index];
    const type = SCOPE;
    /* The slug suffix of a scope is its id */
    const slugSuffix = id;
    /* A scope has no parent, so its parent slug suffix is `null` */
    const parentSlugSuffix = null;
    /* A scope has no ancestor slugs, so its ancestor slug suffixes are an empty array */
    const ancestorSlugSuffixes: string[] = [];

    const subDocuments: RawViewNode[] = [];
    const descendantSlugSuffixes: string[] = [];

    const title = {
      formalId: {
        prefix: firstScopePrefix,
        numberPath,
      },
      title: makeDocTitle(scope),
    };

    const newNode: RawViewNode = {
      id,
      type,
      content,
      hubUrls,
      files,
      slugSuffix,
      parentSlugSuffix,
      ancestorSlugSuffixes,
      descendantSlugSuffixes,
      subDocuments,
      title,
    };

    newNode.subDocuments = buildSubDocumentsViewTree(
      scope,
      newNode,
      viewNodeInputs,
      rawViewNodeMap,
      1,
    );
    /* Descendant slug suffixes are the slug suffixes of all the node's sub documents, so this must _always_ be done _after_ the sub documents have been built */
    newNode.descendantSlugSuffixes = collectDescendantSlugSuffixes(newNode);

    rawViewNodeMap[slugSuffix] = newNode;

    nodeCounts[type] += 1;
    debugPrint(newNode);
  });

  return rawViewNodeMap;
}

function buildSubDocumentsViewTree(
  parentItem: Item,
  parentNode: RawViewNode,
  viewNodeInputs: NotionDataById,
  viewNodeMap: RawViewNodeMap,
  startCounter: number,
) {
  const subDocumentsViewNodeTree: RawViewNode[] = [];

  const subDocuments = getSubDocumentsForParentItem(parentItem, viewNodeInputs);

  if (!subDocuments.length) return subDocumentsViewNodeTree;

  const sortedSubDocuments = makeSortedByNumberOrDocNo(subDocuments);

  let counter = startCounter;

  sortedSubDocuments.forEach((subDocument, index) => {
    const { id, type, content, hubUrls, files } = subDocument;

    const isAgentArtifact = subDocument.isAgentArtifact === true;
    const isSkyPrimitive = subDocument.isSkyPrimitive === true;

    if (isAgentArtifact) {
      skyPrimitiveCounter = 0;
    }
    if (isSkyPrimitive) {
      skyPrimitiveCounter += 1;
    }

    const parentNumberPath = parentNode.title.formalId.numberPath;
    const parentType = parentNode.type;
    const parentSlugSuffix = parentNode.slugSuffix;
    const numberPath = [...parentNumberPath];
    const parentPrefix = parentNode.title.formalId.prefix;
    const prefix = isAgentArtifact
      ? `${parentPrefix}.AG${index + 1}`
      : parentPrefix;
    const nextPartOfPath = isSkyPrimitive ? `P${skyPrimitiveCounter}` : counter;

    if (parentType === CATEGORY || isAgentArtifact) {
      numberPath.pop();
    }

    if (!isSupportDocType(type)) {
      numberPath.push(nextPartOfPath);
    }

    if (isAgentArtifact) {
      numberPath.splice(0, numberPath.length);
    }

    const slugSuffix = generateSlugSuffix(parentSlugSuffix, id);

    const ancestorSlugSuffixes = [
      ...parentNode.ancestorSlugSuffixes,
      parentSlugSuffix,
    ];

    const descendantSlugSuffixes: string[] = [];

    const subDocuments: RawViewNode[] = [];

    const title = {
      formalId: {
        prefix,
        numberPath,
      },
      title: makeDocTitle(subDocument),
    };

    const newNode: RawViewNode = {
      id,
      type,
      content,
      hubUrls,
      files,
      slugSuffix,
      parentSlugSuffix,
      ancestorSlugSuffixes,
      descendantSlugSuffixes,
      subDocuments,
      title,
    };
    newNode.subDocuments = buildSubDocumentsViewTree(
      subDocument,
      newNode,
      viewNodeInputs,
      viewNodeMap,
      type === CATEGORY ? counter : 1,
    );
    newNode.descendantSlugSuffixes = collectDescendantSlugSuffixes(newNode);

    subDocumentsViewNodeTree.push(newNode);
    viewNodeMap[slugSuffix] = newNode;
    counter = updateCounter(counter, newNode);

    nodeCounts[type] += 1;
    debugPrint(newNode);
  });
  return subDocumentsViewNodeTree;
}

function makeViewNodeTreeFromViewNodeMap(viewNodeMap: ViewNodeMap) {
  return Object.values(viewNodeMap)
    .filter((node) => node?.type === SCOPE)
    .filter((node) => node !== undefined);
}

function printNodeCounts() {
  let content = "";
  content += "======================================\n";
  content += "=      GENERATED VIEW NODES          =\n";
  content += "======================================\n";
  content += `= Scopes:                  ${nodeCounts[SCOPE]}\n`;
  content += `= Articles:                ${nodeCounts[ARTICLE]}\n`;
  content += `= Core:                    ${nodeCounts[CORE]}\n`;
  content += `= Active Data Controllers: ${nodeCounts[ACTIVE_DATA_CONTROLLER]}\n`;
  content += `= Sections:                ${nodeCounts[SECTION]}\n`;
  content += `= Type Specifications:     ${nodeCounts[TYPE_SPECIFICATION]}\n`;
  content += `= Categories:              ${nodeCounts[CATEGORY]}\n`;
  content += `= Annotations:             ${nodeCounts[ANNOTATION]}\n`;
  content += `= Needed Research:         ${nodeCounts[NEEDED_RESEARCH]}\n`;
  content += `= Original Context:        ${nodeCounts[ORIGINAL_CONTEXT_DATA]}\n`;
  content += `= Scenarios:               ${nodeCounts[SCENARIO]}\n`;
  content += `= Scenario Variations:     ${nodeCounts[SCENARIO_VARIATION]}\n`;
  content += `= Tenets:                  ${nodeCounts[TENET]}\n`;
  content += `= Active Data:             ${nodeCounts[ACTIVE_DATA]}\n`;
  content += `= Unknown:                 ${nodeCounts.unknown}\n`;
  content += "======================================\n";
  return content;
}

function getSubDocumentsForParentItem(
  parentItem: Item,
  viewNodeInputs: NotionDataById,
) {
  return Object.values(viewNodeInputs).filter((input) => {
    const parentChildrenHasItem = parentItem.children.includes(input.id);

    if (!isSectionItem(input)) return parentChildrenHasItem;

    const hasParents = input.parents.length > 0;
    const childHasParentItem = input.parents.includes(parentItem.id);

    return parentChildrenHasItem && (childHasParentItem || !hasParents);
  });
}

function updateCounter(counter: number, node: RawViewNode) {
  if (isSupportDocType(node.type)) return counter;

  if (node.type !== CATEGORY) return counter + 1;

  return counter + flattenedCategoryChildren(node);
}

function flattenedCategoryChildren(node: RawViewNode) {
  let result = 0;

  for (const subDocument of node.subDocuments) {
    result +=
      subDocument.type === CATEGORY
        ? flattenedCategoryChildren(subDocument)
        : 1;
  }

  return result;
}

function generateSlugSuffix(parentSlugSuffix: string, ownId: string) {
  let suffix = "";

  const delimiterPosition = parentSlugSuffix.lastIndexOf("|");
  if (delimiterPosition < 0) {
    suffix = parentSlugSuffix.slice(-ANCESTOR_SLUG_CHARS);
  } else {
    suffix =
      parentSlugSuffix.slice(delimiterPosition + 1) +
      parentSlugSuffix.slice(
        delimiterPosition - ANCESTOR_SLUG_CHARS,
        delimiterPosition,
      );
  }

  if (!slugLookup[ownId]) {
    slugLookup[ownId] = suffix;
  } else if (slugLookup[ownId] === suffix) {
    throw new Error(
      "Duplicate slug suffix detected for " +
        ownId +
        "|" +
        suffix +
        ". Consider increasing ANCESTOR_SLUG_CHARS.",
    );
  }

  return `${ownId}|${suffix}`;
}

function makeViewNodeSlug(node: RawViewNode): string {
  const titleSlug = makeViewNodeTitleText(node).replaceAll(/[- _/]+/g, "_");
  return `${titleSlug}-${node.slugSuffix}`;
}

function debugPrint(newNode: RawViewNode) {
  if (DEBUG_OUTPUT) {
    console.log(
      " \n",
      makeViewNodeTitleText(newNode),
      "\n",
      makeViewNodeSlug(newNode),
      "\n",
      newNode,
    );
  }
}

function makeDocTitle(item: Item) {
  if (item.type === SCOPE) {
    const lastElement = getLastElement(item.name);
    return lastElement ? lastElement : item.name;
  }

  if (item.type === ARTICLE) return item.name;

  if ([ANNOTATION, SCENARIO].includes(item.type)) {
    const firstElement = getFirstElement(item.docNo);
    return firstElement ? firstElement : item.docNo;
  }

  if (
    [
      ACTIVE_DATA,
      ORIGINAL_CONTEXT_DATA,
      SECTION,
      CORE,
      ACTIVE_DATA_CONTROLLER,
      TYPE_SPECIFICATION,
      CATEGORY,
    ].includes(item.type)
  ) {
    const lastElement = getLastElement(item.docNo);
    return lastElement ? lastElement : item.docNo;
  }

  if (item.type === SCENARIO_VARIATION) {
    const firstElement = getFirstElement(item.docNo);
    const lastElement = getLastElement(item.docNo);
    return firstElement && lastElement
      ? `${firstElement} - ${lastElement}`
      : item.docNo;
  }
  return item.docNo;
}

function collectDescendantSlugSuffixes(node: RawViewNode): string[] {
  let descendantSlugSuffixes: string[] = [];

  for (const subNode of node.subDocuments) {
    descendantSlugSuffixes.push(subNode.slugSuffix);
    if (
      subNode.descendantSlugSuffixes &&
      subNode.descendantSlugSuffixes.length > 0
    ) {
      descendantSlugSuffixes = descendantSlugSuffixes.concat(
        subNode.descendantSlugSuffixes,
      );
    }
  }

  return descendantSlugSuffixes;
}
