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
  type NotionDataItem,
  type RawViewNodeMap,
  type ViewNodeMap,
  type ViewNodeExtended,
  type ViewNode,
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
  const viewNodeTreeExtended = makeViewNodeExtendedTreeFromViewNodeMap(viewNodeMap);
  // TODO: remove extended fields from viewNodeTreeExtended
  const viewNodeTree = makeViewNodeTreeFromViewNodeMap(viewNodeTreeExtended);
  const simplifiedViewNodeTreeTxt =
    makeSimplifiedAtlasData(viewNodeTree).join("\n");
  const nodeCountsText = printNodeCounts();

  return {
    rawViewNodeMap,
    viewNodeMap,
    viewNodeTree,
    viewNodeTreeExtended,
    slugLookup,
    nodeCountsText,
    simplifiedViewNodeTreeTxt,
  };
}

let skyPrimitiveCounter = 0;

function buildViewNodeTree(notionDataById: NotionDataById) {
  /* Initialize the raw view node map, this is then added to as we build the view node tree */
  const rawViewNodeMap: Record<string, RawViewNode> = {};

  /* The scopes are the root nodes of the Atlas view tree */
  const scopesNotionData = Object.values(notionDataById).filter(
    (notionDataItem) => notionDataItem.type === SCOPE,
  );

  const sortedScopesNotionData = makeSortedByNumberOrDocNo(scopesNotionData);

  /* This should always be `"A"`, if it changes later the whole Atlas will be changed */
  const firstScopePrefix = sortedScopesNotionData[0].docNo[0];

  sortedScopesNotionData.forEach((scopeNotionData, scopeNumber) => {
    const { id, content, files } = scopeNotionData;
    /* A scope's number path is always its index only, because scopes are the root nodes of the Atlas view tree */
    const numberPath = [scopeNumber];
    const type = SCOPE;
    /* The slug suffix of a scope is its id */
    const slugSuffix = id;
    /* A scope has no parent, so its parent slug suffix is `null` */
    const parentSlugSuffix = null;
    /* A scope has no ancestor slugs, so its ancestor slug suffixes are an empty array */
    const ancestorSlugSuffixes: string[] = [];
    const globalTags = scopeNotionData.globalTags;

    const subDocuments: RawViewNode[] = [];
    const descendantSlugSuffixes: string[] = [];

    const title = {
      formalId: {
        prefix: firstScopePrefix,
        numberPath,
      },
      title: makeDocTitle(scopeNotionData),
    };

    const newNode: RawViewNode = {
      id,
      type,
      content,
      files,
      slugSuffix,
      parentSlugSuffix,
      ancestorSlugSuffixes,
      descendantSlugSuffixes,
      subDocuments,
      title,
      globalTags,
    };

    newNode.subDocuments = buildSubDocumentsViewTree(
      scopeNotionData,
      newNode,
      notionDataById,
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

/**
 * Builds the sub documents view node tree
 * 
 * We call this on a newly created raw view node, which is why the args are named `parent`, since the node we are creating the sub documents for is the parent in this case
 * 
 * @param parentNotionDataItem - The notion data for the parent item
 * @param parentRawViewNode - The raw view node for the parent item
 * @param notionDataById - The notion data by id
 * @param viewNodeMap - The view node map
 * @param startCounter - The counter to start with, used for numbering the sub documents with respect to categories
 */
function buildSubDocumentsViewTree(
  parentNotionDataItem: NotionDataItem,
  parentRawViewNode: RawViewNode,
  notionDataById: NotionDataById,
  viewNodeMap: RawViewNodeMap,
  startCounter: number,
) {
  const subDocumentsViewNodeTree: RawViewNode[] = [];

  const subDocuments = getSubDocumentsFromNotionData(parentNotionDataItem, notionDataById);

  if (!subDocuments.length) return subDocumentsViewNodeTree;

  const sortedSubDocuments = makeSortedByNumberOrDocNo(subDocuments);

  let counter = startCounter;

  sortedSubDocuments.forEach((subDocument, index) => {
    const { id, type, content, files } = subDocument;

    const isAgentArtifact = subDocument.isAgentArtifact === true;
    const isSkyPrimitive = subDocument.isSkyPrimitive === true;

    /* Reset the sky primitive counter when we reach a new agent artifact */
    if (isAgentArtifact) {
      skyPrimitiveCounter = 0;
    }

    /* Increment the sky primitive counter when we reach a new sky primitive */
    if (isSkyPrimitive) {
      skyPrimitiveCounter += 1;
    }

   /* The number path is in most cases the parent's number path with a new number at the end */
    const parentNumberPath = parentRawViewNode.title.formalId.numberPath;
    /* The type of the parent node, which can determine some edge cases */
    const parentType = parentRawViewNode.type;
    /* The slug suffix of the parent node, which is appended to the new node for lookup purposes */
    const parentSlugSuffix = parentRawViewNode.slugSuffix;
    /* The number path of the new node */
    const numberPath = [...parentNumberPath];
    /* The prefix of the new node */
    const parentPrefix = parentRawViewNode.title.formalId.prefix;
    /* The prefix of the new node, which is the parent's prefix with an AG or P added depending on whether the new node is an agent artifact or sky primitive */
    const prefix = isAgentArtifact
      // Agent artifacts are numbered with a .AG suffix and ignore the rest of the parent number path
      ? `${parentPrefix}.AG${index + 1}`
      : parentPrefix;
    // sky primitives have a P prefix for the last number in the number path
    const nextPartOfPath = isSkyPrimitive ? `P${skyPrimitiveCounter}` : counter;

    // If the parent is a category or an agent artifact, we pop the last number from the number path
    // this is because their number path should be the same as the item we are creating the sub documents for's parent, i.e. this node's grandparent
    if (parentType === CATEGORY || isAgentArtifact) {
      numberPath.pop();
    }

    // support docs don't have counting numbers in their number path
    if (!isSupportDocType(type)) {
      numberPath.push(nextPartOfPath);
    }

    // agent artifacts ignore the rest of the parent number path
    if (isAgentArtifact) {
      numberPath.splice(0, numberPath.length);
    }

    // generate the slug suffix for the new node
    const slugSuffix = generateSlugSuffix(parentSlugSuffix, id);

    const ancestorSlugSuffixes = [
      ...parentRawViewNode.ancestorSlugSuffixes,
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

    const globalTags = subDocument.globalTags;

    const newNode: RawViewNode = {
      id,
      type,
      content,
      files,
      slugSuffix,
      parentSlugSuffix,
      ancestorSlugSuffixes,
      descendantSlugSuffixes,
      subDocuments,
      title,
      globalTags,
    };
    newNode.subDocuments = buildSubDocumentsViewTree(
      subDocument,
      newNode,
      notionDataById,
      viewNodeMap,
      // continue the recursive count for categories, otherwise restart the counter at 1
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

function makeViewNodeExtendedTreeFromViewNodeMap(viewNodeMap: ViewNodeMap) {
  return Object.values(viewNodeMap)
    .filter((node) => node?.type === SCOPE)
    .filter((node) => node !== undefined);
}

function makeViewNodeTreeFromViewNodeMap(viewNodeTreeExtended: ViewNodeExtended[]) {
  function filterExtendedNode(node: ViewNodeExtended): ViewNode {
    const { markdownContent, globalTags, ...rest } = node;

    const viewNode: ViewNode = {
      ...rest,
      subDocuments: [...rest.subDocuments.map(filterExtendedNode)],
    }

    return viewNode;
  }

  return viewNodeTreeExtended.map(filterExtendedNode);
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

function getSubDocumentsFromNotionData(
  parentNotionItem: NotionDataItem,
  notionDataById: NotionDataById,
) {
  return Object.values(notionDataById).filter((notionItem) => {
    const parentChildrenHasItem = parentNotionItem.children.includes(notionItem.id);

    if (!isSectionItem(notionItem)) return parentChildrenHasItem;

    const hasParents = notionItem.parents.length > 0;
    const childHasParentItem = notionItem.parents.includes(parentNotionItem.id);

    return parentChildrenHasItem && (childHasParentItem || !hasParents);
  });
}

/**
 * Updates the counter for the sub documents
 * Handles category special case
 * 
 * @param counter - The counter to update
 * @param node - The node to update the counter for
 * @returns The updated counter
 */
function updateCounter(counter: number, node: RawViewNode) {
  // support docs don't have counting numbers in their number path, so the counter stays the same
  if (isSupportDocType(node.type)) return counter;

  // for nodes other than categories, we just increment the counter
  if (node.type !== CATEGORY) return counter + 1;

  // for categories, we need to flatten the children and add the count to the counter
  // this recursive flattening is needed because a category can have sub categories
  return counter + recursivelyCountCategoryChildren(node);
}

/**
 * Recursively counts the children of a category, used for the counter
 * 
 * @param node - The node to count the children of
 * @returns The number of children
 */
function recursivelyCountCategoryChildren(node: RawViewNode) {
  let result = 0;

  for (const subDocument of node.subDocuments) {
    result +=
      subDocument.type === CATEGORY
        ? recursivelyCountCategoryChildren(subDocument)
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

function makeDocTitle(item: NotionDataItem) {
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
