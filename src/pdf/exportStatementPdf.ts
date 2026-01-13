import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { imageUriToBase64 } from "../../lib/imageToBase64";

import { Statement } from "../models/statement";
import { buildStatementHtml } from "./statementTemplate";

export type StatementPdfResult = {
  uri: string;
  filename: string;
};

export type StatementPdfOptions = {
  fuelProrationCredit?: number;
  fuelProrationPercent?: number;
  fuelProrationCreditTo?: "buyer" | "seller";
  fuelGaugePhotoUri?: string;
  fuelType?: "oil" | "propane" | "kerosene";
  fuelCompany?: string;
  tankOwnership?: "owned" | "leased";
  tanks?: { gallons: number; pricePerGallon: number }[];
};

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
  const baseDir = FileSystem.Paths.document ?? FileSystem.Paths.cache;
  if (!baseDir?.uri) return sourceUri;

  const exportsDir = new FileSystem.Directory(baseDir, "profee-exports");
  try {
    exportsDir.create({ intermediates: true, idempotent: true });
  } catch {
    // ignore
  }

  const base = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  const suffix = (n: number) => (n === 0 ? "" : `_${n}`);

  const sourceFile = new FileSystem.File(sourceUri);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = new FileSystem.File(
      exportsDir,
      base.replace(/\.pdf$/i, `${suffix(attempt)}.pdf`)
    );
    if (candidate.exists) continue;

    try {
      // Prefer a move so the share sheet uses the destination file name reliably.
      sourceFile.move(candidate);
      return candidate.uri;
    } catch {
      try {
        sourceFile.copy(candidate);
        // Best-effort cleanup; ignore failures.
        try {
          sourceFile.delete();
        } catch {
          // ignore
        }
        return candidate.uri;
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
  options?: StatementPdfOptions
) {
  const { uri: namedUri, filename: desiredFilename } = await createStatementPdf(statement, options);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(namedUri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: desiredFilename,
  });
}

export async function createStatementPdf(
  statement: Statement,
  options?: StatementPdfOptions
): Promise<StatementPdfResult> {
  const fuelGaugePhotoDataUrl = options?.fuelGaugePhotoUri
    ? await imageUriToBase64(options.fuelGaugePhotoUri)
    : null;

  const html = buildStatementHtml(statement, {
    fuelProrationCredit: options?.fuelProrationCredit,
    fuelProrationPercent: options?.fuelProrationPercent,
    fuelProrationCreditTo: options?.fuelProrationCreditTo,
    fuelGaugePhotoDataUrl: fuelGaugePhotoDataUrl ?? undefined,
    fuelType: options?.fuelType,
    fuelCompany: options?.fuelCompany,
    tankOwnership: options?.tankOwnership,
    tanks: options?.tanks,
  });
  const filename = buildFilename(statement);

  const result = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const uri = await ensureNamedPdfUri(result.uri, filename);
  return { uri, filename };
}
