import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";

export const ManageDetails = ({ fileData }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);
  return (
    <>
      <div>ManageDetailsPage</div>
      <div>{mainFile.name}</div>
      {fileChildren.map((file) => (
        <div key={file.id}>{file.name}</div>
      ))}
    </>
  )
};
