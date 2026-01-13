import * as FileSystem from "expo-file-system/legacy";

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

function guessFileExtension(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".heic")) return ".heic";
  if (lower.endsWith(".heif")) return ".heif";
  return ".jpg";
}

async function ensureReadableFileUri(uri: string): Promise<{ readableUri: string; tempUri?: string }> {
  if (uri.startsWith("file://")) return { readableUri: uri };
  if (!FileSystem.cacheDirectory) return { readableUri: uri };

  const tempUri = `${FileSystem.cacheDirectory}profee-fuel-photo-${Date.now()}${guessFileExtension(uri)}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: tempUri });
    return { readableUri: tempUri, tempUri };
  } catch {
    return { readableUri: uri };
  }
}

export async function imageUriToBase64(uri?: string): Promise<string | null> {
  if (!uri) return null;

  try {
    const { readableUri, tempUri } = await ensureReadableFileUri(uri);

    const base64 = await FileSystem.readAsStringAsync(readableUri, {
      encoding: "base64",
    });

    if (tempUri) {
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch {
        // ignore cleanup failures
      }
    }

    const mime = guessMimeType(uri);
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}
