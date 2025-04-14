import { type ViewNode } from "../types/view-nodes.js";
import { type ViewNodeTree } from "../types/view-nodes.js";
import { renderToString } from 'react-dom/server';
import { Scope } from "./scope.js";
import { SubDocument } from "./sub-document.js";
import { format } from "prettier";

const prettierOptions = {
  parser: "html",
  htmlWhitespaceSensitivity: "ignore",
  bracketSameLine: true,
  printWidth: 100,
} as const;

export async function makeAtlasDataHtmlDocument(viewNodeTree: ViewNodeTree, formatOptions = prettierOptions) {
  const htmlString = await makeAtlasDataHtmlString(viewNodeTree, formatOptions);
  const document = `<!DOCTYPE html>
<html>
  <head>
    <title>Atlas Explorer V2</title>
    <style>
      body {
        font-family: sans-serif;
        line-height: 1.6;
        margin: 2rem;
        color: #333;
        background: #fff;
      }

      h1, h2, h3, h4, h5, h6 {
        margin-top: 2rem;
        margin-bottom: 1rem;
        font-weight: 600;
        line-height: 1.25;
      }

      h1 { font-size: 2rem; }
      h2 { font-size: 1.75rem; }
      h3 { font-size: 1.5rem; }
      h4 { font-size: 1.25rem; }
      h5 { font-size: 1rem; }
      h6 { font-size: 0.875rem; }

      p {
        margin-bottom: 1rem;
        max-width: 60ch;
      }

      a {
        color: #0066cc;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      ul, ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
      }

      li {
        margin-bottom: 0.5rem;
      }
    </style>
  </head>
  <body>
    ${htmlString}
  </body>
</html>`;

  const formatted = await format(document, formatOptions);
  return formatted;
}

export async function makeAtlasDataHtmlString(viewNodeTree: ViewNodeTree, formatOptions = prettierOptions) {
  const htmlString = viewNodeTree.map((viewNode) => renderViewNodeToHtmlString(viewNode)).join("");
  const formatted = await format(htmlString, formatOptions);
  return formatted;
}

export function renderViewNodeToHtmlString(viewNode: ViewNode) {
  if (viewNode.type === "scope") {
    return renderToString(<Scope node={viewNode} />);
  }
  return renderToString(<SubDocument node={viewNode} />);
}
