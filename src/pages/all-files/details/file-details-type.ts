import { GetFileByIdResponse } from "@/api/api/file-api";

export type FileDetailProps = {
  fileData: GetFileByIdResponse;
  onUpdateName: (name: string) => void;
};
