import { CreateFileResponse } from "@/api/api/file-api";

export type FileDetailProps = {
  fileData: CreateFileResponse;
  onUpdateName: (name: string) => void;
};
