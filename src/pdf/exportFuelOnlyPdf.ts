import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { imageUriToBase64 } from "../../lib/imageToBase64";
import type { FuelProrationSummary } from "../utils/buildFuelText";
import { buildFuelOnlyHtml } from "../utils/buildFuelPdf";

export async function exportFuelOnlyPdf(fuel: FuelProrationSummary) {
  const gaugePhotoDataUrl =
    typeof fuel.gaugePhotoUri === "string" && fuel.gaugePhotoUri.startsWith("data:")
      ? fuel.gaugePhotoUri
      : await imageUriToBase64(fuel.gaugePhotoUri);

  const html = buildFuelOnlyHtml({
    ...fuel,
    gaugePhotoUri: gaugePhotoDataUrl ?? undefined,
  });

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
