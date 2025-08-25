export function displayNameFromSafUri(uri: string): string {
  try {
    const dec = decodeURIComponent(uri);
    const last = dec.lastIndexOf("/");
    const base = last >= 0 ? dec.slice(last + 1) : dec;
    return base.replace(/\.[a-z0-9]+$/i, "");
  } catch {
    const base = uri.split("/").pop() ?? uri;
    return base.replace(/\.[a-z0-9]+$/i, "");
  }
}

export function fileNameFromSafUri(uri: string): string {
  try {
    const dec = decodeURIComponent(uri);
    const last = dec.lastIndexOf("/");
    return last >= 0 ? dec.slice(last + 1) : dec;
  } catch {
    return uri.split("/").pop() ?? uri;
  }
}
