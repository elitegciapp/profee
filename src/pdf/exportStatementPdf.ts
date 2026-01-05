import * as Print from "expo-print";
import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  moveAsync,
} from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Statement } from "../models/statement";
import { buildStatementHtml } from "./statementTemplate";

function sanitizeFilename(input: string) {
  return input
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function buildFilename(statement: Statement) {
  const addressPartRaw = sanitizeFilename(statement.propertyAddress || "statement");
  const addressPart = addressPartRaw.length > 60 ? addressPartRaw.slice(0, 60) : addressPartRaw;
  const datePart = new Date(statement.createdAt).toISOString().split("T")[0];
  return `ProFee_Statement_${addressPart}_${datePart}.pdf`;
}

async function ensureNamedPdfUri(sourceUri: string, filename: string): Promise<string> {
  const baseDir = documentDirectory ?? cacheDirectory;
  if (!baseDir) return sourceUri;

  const exportsDir = `${baseDir}profee-exports/`;
  try {
    await makeDirectoryAsync(exportsDir, { intermediates: true });
  } catch {
    // ignore
  }

  const base = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const suffix = (n: number) => (n === 0 ? "" : `_${n}`);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${exportsDir}${base.replace(/\.pdf$/i, `${suffix(attempt)}.pdf`)}`;
    const info = await getInfoAsync(candidate);
    if (info.exists) continue;

    try {
      // Prefer a move so the share sheet uses the destination file name reliably.
      await moveAsync({ from: sourceUri, to: candidate });
      return candidate;
    } catch {
      try {
        await copyAsync({ from: sourceUri, to: candidate });
        // Best-effort cleanup; ignore failures.
        deleteAsync(sourceUri, { idempotent: true }).catch(() => undefined);
        return candidate;
      } catch {
        // If we can't rename, fall back to original (random print filename).
        return sourceUri;
      }
    }
  }

  return sourceUri;
}

export async function exportStatementPdf(
  statement: Statement,
  options?: { fuelProrationCredit?: number; fuelProrationPercent?: number }
) {
  const html = buildStatementHtml(statement, options);
  const desiredFilename = buildFilename(statement);

  const result = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const namedUri = await ensureNamedPdfUri(result.uri, desiredFilename);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(namedUri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: desiredFilename,
  });
}
