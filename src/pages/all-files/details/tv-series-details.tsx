import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";

export const TVSeriesDetails = ({ fileData }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);
  return (
    <>
      <div>TVSeriesDetailsPage</div>
      <div>{mainFile.name}</div>
      {fileChildren.map((file) => (
        <div key={file.id}>{file.name}</div>
      ))}
    </>
  )
};
