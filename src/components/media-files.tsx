
interface Props {
  files?: { url: string }[];
}
export function MediaFiles(props: Props) {
  const { files } = props;
  if (!files?.length) return null;

  return (
    <div>
      <h3>Files & media</h3>
      {files.map((file, index) => (
        <div key={index}>
          <a href={file.url} target="_blank" rel="noopener noreferrer"></a>
        </div>
      ))}
    </div>
  );
}
