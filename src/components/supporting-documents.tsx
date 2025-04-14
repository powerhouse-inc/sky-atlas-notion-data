import { sentenceCase } from "change-case";
import { type ViewNode } from "../types/view-nodes.js";
import { SubDocument } from "./sub-document.js";

interface Props {
  supportingDocuments: ViewNode[];
}
export function SupportingDocuments(props: Props) {
  const { supportingDocuments } = props;

  if (!supportingDocuments.length) return null;

  const supportingDocumentsWithHeadings = Object.groupBy(
    supportingDocuments,
    (node) => node.type,
  );

  return (
    <div>
      <h3>Supporting Documents</h3>
      {Object.entries(supportingDocumentsWithHeadings).map(
        ([heading, nodes]) => (
          <div key={heading}>
            <h4>{sentenceCase(heading)}</h4>
            {nodes.map((node) => (
              <SubDocument key={node.id} node={node} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}
