/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from "react";
import { FileDetailProps } from "./file-details-type";

export const ManageDetails = ({ fileData }: FileDetailProps) => {
  const mainFile = useMemo(() => fileData?.file, [fileData]);
  const fileChildren = useMemo(() => fileData?.fileChildren, [fileData]);
  return <div>ManageDetailsPage</div>;
};
