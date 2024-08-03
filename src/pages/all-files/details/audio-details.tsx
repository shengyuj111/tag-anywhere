/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";

export const AudioDetails = ({ fileData }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);
  return <div>AudioDetailsPage</div>;
};
