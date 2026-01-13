import type { Statement } from "../models/statement";
import { calculateStatementSummary } from "../utils/calculations";

/* ---------- helpers ---------- */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeDateLabel(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function money(value?: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value!.toFixed(2)}`;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function pct(value?: number): string {
  if (!Number.isFinite(value)) return "—";
  const clamped = clampNumber(value as number, 0, 100);
  const rounded = Math.round(clamped * 100) / 100;
  return `${rounded}%`;
}

function fuelBar(percent: number): string {
  const p = Math.round(clampNumber(percent, 0, 100));

  return `
    <div style="margin-top:8px;">
      <div style="font-size:12px; color:#111; margin-bottom:6px;">Fuel Level</div>
      <div style="width:220px; height:14px; border:1px solid #dddddd; background:#ffffff;">
        <div style="height:14px; width:${p}%; background:#22D3EE;"></div>
      </div>
      <div style="font-size:12px; color:#111; margin-top:6px;">${p}%</div>
    </div>
  `;
}

function fuelTypeLabel(value?: "oil" | "propane" | "kerosene"): string {
  if (value === "oil") return "Oil";
  if (value === "propane") return "Propane";
  if (value === "kerosene") return "Kerosene";
  return "—";
}

function tankOwnershipLabel(value?: "owned" | "leased"): string {
  if (value === "owned") return "Owned";
  if (value === "leased") return "Leased";
  return "—";
}

function gallonsLabel(value?: number): string {
  if (!Number.isFinite(value) || (value as number) <= 0) return "—";
  const rounded = Math.round((value as number) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} gal`;
}

function moneyPerGallon(value?: number): string {
  if (!Number.isFinite(value) || (value as number) <= 0) return "—";
  return `$${(value as number).toFixed(2)}/gal`;
}

function renderTankDetailRows(tanks?: { gallons: number; pricePerGallon: number }[]): string {
  if (!Array.isArray(tanks) || tanks.length === 0) return "";

  return tanks
    .map((t, idx) => {
      const labelPrefix = tanks.length === 1 ? "Tank" : `Tank ${idx + 1}`;
      return `
        <div class="row">
          <div class="label">${labelPrefix} Gallons</div>
          <div class="value">${gallonsLabel(t.gallons)}</div>
        </div>
        <div class="row">
          <div class="label">${labelPrefix} Price/gal</div>
          <div class="value">${moneyPerGallon(t.pricePerGallon)}</div>
        </div>
      `;
    })
    .join("");
}

/* ---------- template ---------- */
export function buildStatementHtml(
  statement: Statement,
  options?: {
    fuelProrationCredit?: number;
    fuelProrationPercent?: number;
    fuelProrationCreditTo?: "buyer" | "seller";
    fuelGaugePhotoDataUrl?: string;
    fuelType?: "oil" | "propane" | "kerosene";
    fuelCompany?: string;
    tankOwnership?: "owned" | "leased";
    tanks?: { gallons: number; pricePerGallon: number }[];
  }
): string {
  const summary = calculateStatementSummary(statement);

  const fuelProrationCredit = options?.fuelProrationCredit;
  const showFuelProrationCredit =
    Number.isFinite(fuelProrationCredit) && (fuelProrationCredit ?? 0) > 0;

  const fuelProrationPercent = clampNumber(options?.fuelProrationPercent ?? 0, 0, 100);
  const fuelProrationCreditTo = options?.fuelProrationCreditTo === "buyer" ? "Buyer" : "Seller";
  const fuelGaugePhotoDataUrl = options?.fuelGaugePhotoDataUrl;
  const fuelType = options?.fuelType;
  const fuelCompany = options?.fuelCompany?.trim() || "—";
  const tankOwnership = options?.tankOwnership;
  const tanks = options?.tanks;

  const address = statement.propertyAddress
    ? escapeHtml(statement.propertyAddress)
    : "";

  const createdAt = safeDateLabel(statement.createdAt);

  const showReferral =
    Number.isFinite(summary.referralFeeAmount) &&
    summary.referralFeeAmount > 0;

  const showDeposit =
    statement.deposit &&
    Number.isFinite(statement.deposit.amount) &&
    statement.deposit.amount > 0;

  const showTeamSplits =
    Array.isArray(summary.teamSplitResults) &&
    summary.teamSplitResults.length > 0;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #ffffff;
      color: #000000;
      padding: 24px;
      font-size: 12px;
    }
    h1 { font-size: 20px; margin: 0 0 8px 0; }
    h2 { font-size: 14px; margin: 18px 0 6px 0; }
    .meta { font-size: 12px; margin-bottom: 16px; }
    .row {
      display: table;
      width: 100%;
      padding: 6px 0;
      border-bottom: 1px solid #dddddd;
    }
    .label {
      color: #111;
      display: table-cell;
      padding-right: 12px;
    }
    .value {
      font-weight: 600;
      text-align: right;
      display: table-cell;
      white-space: nowrap;
    }
    .valueWrap {
      font-weight: 600;
      text-align: right;
      display: table-cell;
      white-space: normal;
      word-break: break-word;
    }
    .disclaimer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #dddddd;
      font-size: 10px;
      line-height: 1.35;
    }
    .twoCol {
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    .twoColLeft {
      display: table-cell;
      vertical-align: top;
      padding-right: 12px;
      width: 62%;
    }
    .twoColRight {
      display: table-cell;
      vertical-align: top;
      width: 38%;
      text-align: right;
    }
    .photo {
      display: inline-block;
      max-width: 180px;
      max-height: 180px;
      width: auto;
      height: auto;
      border-radius: 6px;
      border: 1px solid #dddddd;
    }
  </style>
</head>

<body>
  <h1>ProFee Statement</h1>

  <div class="meta">
    ${address ? `Property: ${address}<br/>` : ""}
    ${createdAt ? `Date: ${escapeHtml(createdAt)}` : ""}
  </div>

  <h2>Commissions</h2>

  <div class="row">
    <div class="label">Sale price</div>
    <div class="value">${money(statement.salePrice)}</div>
  </div>

  <div class="row">
    <div class="label">Title Company</div>
    <div class="value">${escapeHtml(statement.titleCompany?.name || statement.titleCompanyName || "—")}</div>
  </div>

  <div class="row">
    <div class="label">Title Email</div>
    <div class="value">${escapeHtml(statement.titleCompany?.email || statement.titleCompanyEmail || "—")}</div>
  </div>

  <div class="row">
    <div class="label">Seller agent commission (${pct(statement.listingCommissionPct)})</div>
    <div class="value">${money(summary.listingCommissionAmount)}</div>
  </div>

  <div class="row">
    <div class="label">Buyer agent commission (${pct(statement.buyerCommissionPct)})</div>
    <div class="value">${money(summary.buyerCommissionAmount)}</div>
  </div>

  <div class="row">
    <div class="label">Gross commission</div>
    <div class="value">${money(summary.grossCommissionAmount)}</div>
  </div>

  ${
    showReferral
      ? `<div class="row">
           <div class="label">Referral fee</div>
           <div class="value">-${money(summary.referralFeeAmount)}</div>
         </div>`
      : ""
  }

  ${
    showReferral && statement.referralRecipient
      ? `<div class="row">
           <div class="label">Referral Paid To</div>
           <div class="value">${escapeHtml(statement.referralRecipient)}</div>
         </div>`
      : ""
  }

  <div class="row">
    <div class="label">Net commission</div>
    <div class="value">${money(summary.netCommissionAmount)}</div>
  </div>

  ${
    showDeposit
      ? `
        <h2>Deposit</h2>
        <div class="row">
          <div class="label">Deposit amount</div>
          <div class="value">${money(statement.deposit!.amount)}</div>
        </div>
        <div class="row">
          <div class="label">Held by</div>
          <div class="value">${escapeHtml(statement.deposit!.heldBy || "—")}</div>
        </div>
        <div class="row">
          <div class="label">Credited to buyer</div>
          <div class="value">${statement.deposit!.creditedToBuyer ? "Yes" : "No"}</div>
        </div>
      `
      : ""
  }

  ${
    showTeamSplits
      ? `
        <h2>Team Splits</h2>
        ${summary.teamSplitResults
          .map(
            (split) => `
            <div class="row">
              <div class="label">
                ${escapeHtml(split.name)} (${split.percentage}%)
              </div>
              <div class="value">${money(split.amount)}</div>
            </div>
          `
          )
          .join("")}
      `
      : ""
  }

  ${
    showFuelProrationCredit
      ? `
        <h2>Disbursements</h2>
        <div class="twoCol">
          <div class="twoColLeft">
            <div class="row">
              <div class="label">Fuel Type</div>
              <div class="value">${fuelTypeLabel(fuelType)}</div>
            </div>
            <div class="row">
              <div class="label">Fuel Company</div>
              <div class="valueWrap">${escapeHtml(fuelCompany)}</div>
            </div>
            <div class="row">
              <div class="label">Tank Ownership</div>
              <div class="value">${tankOwnershipLabel(tankOwnership)}</div>
            </div>
            ${renderTankDetailRows(tanks)}
            <div class="row">
              <div class="label">Fuel Level</div>
              <div class="value">${Math.round(fuelProrationPercent)}%</div>
            </div>
            <div class="row">
              <div class="label">Fuel Proration Credit (to ${fuelProrationCreditTo})</div>
              <div class="value">${money(fuelProrationCredit)}</div>
            </div>
          </div>

          <div class="twoColRight">
            ${
              fuelGaugePhotoDataUrl
                ? `<img class="photo" src="${fuelGaugePhotoDataUrl}" alt="Fuel gauge photo" />`
                : ""
            }
          </div>
        </div>
      `
      : ""
  }

  <div class="disclaimer">
    ProFee provides calculation and documentation tools only.
    Figures are estimates and may vary based on contract terms and brokerage policies.
    ProFee does not provide legal, tax, or brokerage advice.
    Verify all numbers and requirements prior to use.
  </div>
</body>
</html>`;
}
