import { storageGet } from './storage';

export async function getSecureDownloadUrl(fileKey: string): Promise<string> {
  // Get the download URL from storage
  const result = await storageGet(fileKey);
  return result.url;
}
