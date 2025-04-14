
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
          <img
            src={file.url}
            alt="Attached image"
          />
        </div>
      ))}
    </div>
  );
}
