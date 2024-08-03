export const extractFilenameAndExtension = (
  filePath: string,
): [string, string] => {
  // Use regex to match the filename and extension at the end of the path
  const match = filePath.match(/([^\\/]+)\.([^\\/]+)$/);
  if (match) {
    return [match[1], match[2]];
  }
  return ["", ""];
};
