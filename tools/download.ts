import * as FileSystem from "expo-file-system";

async function handleDownload(remoteUrl: string, fileName: string) {
  // Ask the user to pick a folder (can be Downloads, Music, etc.)
  const permissions =
    await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

  if (!permissions.granted) return;

  const baseUri = permissions.directoryUri;
  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    baseUri,
    fileName,
    "audio/mpeg"
  );

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUrl,
    fileUri
  );
  await downloadResumable.downloadAsync();
}

export default handleDownload;
