import { sentenceCase } from "change-case";
import { Fragment } from "react/jsx-runtime";
import {
  type ViewNode,
  type TProcessedViewNodeContent,
  type LinkViewNodeContent,
  type MentionViewNodeContent,
  type EquationViewNodeContent,
  type CodeViewNodeContent,
  type TableViewNodeContent,
  type ParagraphsViewNodeContent,
} from "../types/view-nodes.js";
import { makeViewNodeAtlasId } from "../utils/processing.js";
import { DEFAULT_ATLAS_DATA_URL } from "../constants.js";

export function NodeContent(props: { node: ViewNode }) {
  const { node } = props;

  const { content } = node;
  const atlasId = makeViewNodeAtlasId(node);

  return content.map((contentItem, index) => (
    <div key={index} data-atlas-id={atlasId} data-notion-id={node.id}>
      {!!contentItem.heading && <h3>{sentenceCase(contentItem.heading)}</h3>}

      {contentItem.text.map((textItem, index) => (
        <NodeContentItem key={index} content={textItem} />
      ))}
    </div>
  ));
}

/**
 * Component for rendering individual content items within a node
 * @param {Object} props - Component props
 * @param {TProcessedViewNodeContent} props.content - The content item to render
 * @returns {JSX.Element} Rendered content item
 */
function NodeContentItem(props: { content: TProcessedViewNodeContent }) {
  const { content } = props;

  switch (content.type) {
    case "paragraphs":
      return <ParagraphsNodeContent content={content} />;
    case "link":
      return <LinkNodeContent content={content} />;
    case "mention":
      return <MentionNodeContent content={content} />;
    case "equation":
      return <EquationNodeContent content={content} />;
    case "code":
      return <CodeNodeContent content={content} />;
    case "table":
      return <TableNodeContent content={content} />;
  }
}

/**
 * Component for rendering link content
 * @param {Object} props - Component props
 * @param {LinkViewNodeContent} props.content - The link content to render
 * @returns {JSX.Element} Rendered link element
 */
function LinkNodeContent(props: { content: LinkViewNodeContent }) {
  const {
    content: { text, href, external },
  } = props;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {text}
        <svg
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={12}
          height={12}
        >
          <path
            d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </a>
    );
  }

  const atlasDataUrl = process.env.ATLAS_DATA_URL ?? DEFAULT_ATLAS_DATA_URL;

  return <a href={`${atlasDataUrl}${href}`}>{text}</a>;
}

/**
 * Component for rendering mention content
 * @param {Object} props - Component props
 * @param {MentionViewNodeContent} props.content - The mention content to render
 * @returns {JSX.Element} Rendered mention element
 */
function MentionNodeContent(props: { content: MentionViewNodeContent }) {
  const {
    content: { text, href },
  } = props;

  const atlasDataUrl = process.env.ATLAS_DATA_URL ?? DEFAULT_ATLAS_DATA_URL;

  return <a href={`${atlasDataUrl}${href}`}>{text}</a>;
}

/**
 * Component for rendering equation content
 * @param {Object} props - Component props
 * @param {EquationViewNodeContent} props.content - The equation content to render
 * @returns {JSX.Element} Rendered equation element
 */
function EquationNodeContent(props: { content: EquationViewNodeContent }) {
  const {
    content: { text },
  } = props;

  return <pre>{text}</pre>;
}

/**
 * Component for rendering code content
 * @param {Object} props - Component props
 * @param {CodeViewNodeContent} props.content - The code content to render
 * @returns {JSX.Element} Rendered code element
 */
function CodeNodeContent(props: { content: CodeViewNodeContent }) {
  const {
    content: { text },
  } = props;

  return <code>{text}</code>;
}

/**
 * Component for rendering table content
 * @param {Object} props - Component props
 * @param {TableViewNodeContent} props.content - The table content to render
 * @returns {JSX.Element} Rendered table element
 */
function TableNodeContent(props: { content: TableViewNodeContent }) {
  const {
    content: { text },
  } = props;

  return (
    <pre>
      <code>{text}</code>
    </pre>
  );
}

/**
 * Component for rendering paragraphs content
 * @param {Object} props - Component props
 * @param {ParagraphsViewNodeContent} props.content - The paragraphs content to render
 * @returns {JSX.Element} Rendered paragraphs element
 */
function ParagraphsNodeContent(props: { content: ParagraphsViewNodeContent }) {
  const {
    content: { text },
  } = props;

  return text.split("\n").map((part, index) => (
    <Fragment key={index}>
      {part}
    </Fragment>
  ));
}
