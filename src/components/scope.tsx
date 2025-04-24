import { type ViewNode } from "../types/view-nodes.js";
import {
  getNonSupportDocs,
  getSupportDocs,
  makeViewNodeTitleText,
} from "../utils/processing.js";
import { LinkButton } from "./link-button.js";
import { NodeContent } from "./node-content.js";
import { SubDocument } from "./sub-document.js";
import { SupportingDocuments } from "./supporting-documents.js";

interface Props {
  node: ViewNode;
}
export function Scope(props: Props) {
  const { node } = props;
  const title = makeViewNodeTitleText(node);
  const supportingDocuments = getSupportDocs(node);
  const subDocumentsWithoutSupportingDocuments = getNonSupportDocs(node);

  return (
    <div>
      <div>
        <h1 id={node.slugSuffix}><LinkButton node={node} /> {title}</h1>
      </div>
      <div>
        <NodeContent node={node} />
        <SupportingDocuments supportingDocuments={supportingDocuments} />
        {subDocumentsWithoutSupportingDocuments.map((node) => (
          <SubDocument key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
