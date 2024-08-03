export const formatSize = (size: number | undefined) => {
  if (!size) return undefined;
  const sizeInGB = size / (1024 * 1024 * 1024);
  if (sizeInGB >= 1) {
    return `${sizeInGB.toFixed(2)} GB`;
  } else {
    const sizeInMB = size / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  }
};

export const formatDuration = (duration: number | undefined) => {
  if (!duration) return undefined;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.round(duration % 60);
  if (hours > 0) {
    return `${hours} hr ${minutes} min ${seconds} sec`;
  } else {
    return `${minutes} min ${seconds} sec`;
  }
};

export const formatMime = (mime: string | undefined) => {
  if (!mime) return undefined;
  return mime;
};

export const formatDimensions = (dimensions: number[] | undefined) => {
  if (!dimensions) return undefined;
  return dimensions.join("x");
};

export const formatTimestamp = (timestamp: number | undefined) => {
  if (!timestamp) return undefined;
  return new Date(timestamp * 1000).toDateString();
};

export const formatFrameRate = (frameRate: number | undefined) => {
  if (!frameRate) return undefined;
  return frameRate.toString();
};

export const formatDate = (date: Date | undefined) => {
  if (!date) return undefined;
  return date.toDateString();
};

export const formatFileName = (
  name: string | undefined,
): string | undefined => {
  if (!name) return undefined;
  return name.replace(/\.[^/.]+$/, "");
};
