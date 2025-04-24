import { type ViewNode } from '../types/view-nodes.js';
import { NodeContent } from './node-content.js';
import { SupportingDocuments } from './supporting-documents.js';
import { CategoryHeader } from './category-header.js';
import { getSupportDocs, getNonSupportDocs } from '../utils/processing.js';
import { MediaFiles } from './media-files.js';

interface Props {
  node: ViewNode;
}
export function SubDocument(props: Props) {
  const { node } = props;
  const { type, files } = node;

  if (type === 'category') {
    return <CategoryHeader node={node} />;
  }

  const supportingDocuments = getSupportDocs(node);
  const subDocumentsWithoutSupportingDocuments = getNonSupportDocs(node);

  return (
    <div>
      <NodeContent node={node} />
      <MediaFiles files={files} />
      <SupportingDocuments supportingDocuments={supportingDocuments} />
      {!!subDocumentsWithoutSupportingDocuments.length &&
        subDocumentsWithoutSupportingDocuments.map((node) => (
          <SubDocument key={node.id} node={node} />
        ))}
    </div>
  );
}
