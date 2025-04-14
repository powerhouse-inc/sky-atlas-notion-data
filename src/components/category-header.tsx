import { type ViewNode } from "../types/view-nodes.js";
import { LinkButton } from "./link-button.js";
import { SubDocument } from "./sub-document.js";

interface Props {
  node: ViewNode;
}
export function CategoryHeader(props: Props) {
  const { node } = props;
  const { subDocuments } = node;

  if (!subDocuments.length) return null;

  return (
    <div>
      <h2 id={node.slugSuffix}>
        <LinkButton node={node} />
        {node.title.title}
      </h2>
      {subDocuments.map((node) => (
        <SubDocument key={node.id} node={node} />
      ))}
    </div>
  );
}
