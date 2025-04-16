// #!/usr/bin/env node
import {
  type ViewNode,
  makeViewNodeTitleText,
  getNonSupportDocs,
  getSupportDocs,
  type ViewNodeTree
} from "../src/index.js";

/**
 * Make simplified Atlas data
 * 
 * This function takes a tree map of view nodes and returns a list of strings
 * representing the simplified Atlas data.
 * 
 * This simplified data is useful for the Github snapshots of the Atlas data, because it is easier to see the changes than when looking at the JSON data.
 */
export function makeSimplifiedAtlasData(viewNodeTree: ViewNodeTree): string[] {
  const textLines: string[] = [];

  for (const node of viewNodeTree) {
    printNodeTree(node);
  }

  function printNodeTree(node: ViewNode, indent = 0) {
    const title = makeViewNodeTitleText(node);
    const content = node.content
      .map((content) => content.text.map((text) => text.text).join("\n"))
      .join("\n");

    const supportDocs = getSupportDocs(node);
    const supportDocIds = supportDocs.map((supportDoc) => supportDoc.id);
    const nonSupportDocs = getNonSupportDocs(node);
    const nonSupportDocIds = nonSupportDocs.map(
      (nonSupportDoc) => nonSupportDoc.id,
    );

    const linesToAdd = [
      `id: ${node.id}`,
      `${title} - ${node.type}`,
      "content:",
      content,
      "hub urls:",
      "sub-document ids:",
      ...nonSupportDocIds.toSorted(),
      ...node.hubUrls.toSorted(),
      "supporting document ids:",
      ...supportDocIds.toSorted(),
      "—".repeat(20),
    ];

    textLines.push(...linesToAdd.map((line) => "~".repeat(indent) + line));
    node.subDocuments.forEach((subDocument, index) => {
      printNodeTree(subDocument, indent + 1);
    });
  }

  return textLines;
}
