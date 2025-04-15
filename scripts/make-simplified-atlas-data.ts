// #!/usr/bin/env node
import {
  type ViewNodeMap,
  type ViewNode,
  makeViewNodeTitleText,
  getNonSupportDocs,
  getSupportDocs,
} from "../src/index.js";

export function makeSimplifiedAtlasData(treeMap: ViewNodeMap): string[] {
  const scopes = Object.values(treeMap).filter(
    (node) => node?.type === "scope",
  );
  const textLines: string[] = [];

  for (const scope of scopes) {
    printNodeTree(scope!);
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
