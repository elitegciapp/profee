import * as Print from "expo-print";
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
  const addressPart = sanitizeFilename(statement.propertyAddress || "statement");
  const datePart = new Date(statement.createdAt).toISOString().split("T")[0];
  return `ProFee_Statement_${addressPart}_${datePart}.pdf`;
}

export async function exportStatementPdf(
  statement: Statement,
  options?: { fuelProrationCredit?: number; fuelProrationPercent?: number }
) {
  const html = buildStatementHtml(statement, options);

  const result = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: buildFilename(statement),
  });
}
