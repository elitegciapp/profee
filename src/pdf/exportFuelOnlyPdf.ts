import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { FuelOnlyData } from "../utils/buildFuelEmail";
import { buildFuelOnlyHtml } from "../utils/buildFuelPdf";

export async function exportFuelOnlyPdf(fuel: FuelOnlyData) {
  const html = buildFuelOnlyHtml(fuel);

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
    dialogTitle: "ProFee_Fuel_Proration.pdf",
  });
}
