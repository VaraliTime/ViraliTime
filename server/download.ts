import { storageGet } from './storage';

export async function getSecureDownloadUrl(fileKey: string): Promise<string> {
  // If the fileKey is already a full URL (like Google Drive), return it directly
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    return fileKey;
  }
  
  // Otherwise, get the download URL from storage proxy
  const result = await storageGet(fileKey);
  return result.url;
}
