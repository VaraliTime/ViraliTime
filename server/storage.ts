// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  // If relKey is already a full URL (like Google Drive), return it directly
  if (relKey.startsWith('http://') || relKey.startsWith('https://')) {
    return relKey;
  }

  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));

  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  
  const data = await response.json();
  
  // CRITICAL FIX: If the proxy returns a URL that contains another URL (like CloudFront proxying Google Drive),
  // extract the final URL to avoid Access Denied from CloudFront.
  if (data.url && data.url.includes('https://drive.google.com')) {
    const match = data.url.match(/https:\/\/drive\.google\.com\/.*/);
    if (match) return match[0];
  }

  return data.url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

export const storage = {
  upload: async (
    relKey: string,
    data: Buffer | Uint8Array | string,
    contentType: string,
    fileName: string
  ): Promise<void> => {
    const { baseUrl, apiKey } = getStorageConfig();
    const uploadUrl = buildUploadUrl(baseUrl, relKey);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: toFormData(data, contentType, fileName),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  },

  getDownloadUrl: async (relKey: string): Promise<string> => {
    const { baseUrl, apiKey } = getStorageConfig();
    return buildDownloadUrl(baseUrl, relKey, apiKey);
  },
};
