import { FileCoverAspectRatio } from "./file-enum";

export type Library = {
  name: string;
  FileCoverAspectRatio: FileCoverAspectRatio;
  CoverPath: string | null;
  IncludeTags: string[];
  ExcludeTags: string[];
  IncludeFileIds: number[];
  ExcludeFileIds: number[];
  pageRowNumbers: number;
  pageSize: number;
};
