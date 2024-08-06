export const copyToClipboard = (
  text: string,
  callback?: (success: boolean) => void,
): void => {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (callback) callback(true);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        if (callback) callback(false);
      });
  } else {
    // Fallback for browsers that do not support the Clipboard API
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      if (callback) callback(true);
    } catch (err) {
      if (callback) callback(false);
    }
    document.body.removeChild(textArea);
  }
};

export const downloadFile = (
  content: string | Blob,
  fileName: string,
  contentType: string,
  callback?: () => void,
): void => {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Execute callback if provided
  if (callback) callback();
};
