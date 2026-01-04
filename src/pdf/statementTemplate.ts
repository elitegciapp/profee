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

/* ---------- template ---------- */
export function buildStatementHtml(
  statement: Statement,
  options?: { fuelProrationCredit?: number; fuelProrationPercent?: number }
): string {
  const summary = calculateStatementSummary(statement);

  const fuelProrationCredit = options?.fuelProrationCredit;
  const showFuelProrationCredit =
    Number.isFinite(fuelProrationCredit) && (fuelProrationCredit ?? 0) > 0;

  const fuelProrationPercent = clampNumber(options?.fuelProrationPercent ?? 0, 0, 100);

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
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #dddddd;
    }
    .label { color: #111; }
    .value { font-weight: 600; text-align: right; }
    .disclaimer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #dddddd;
      font-size: 10px;
      line-height: 1.35;
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
    <div class="label">Listing commission</div>
    <div class="value">${money(summary.listingCommissionAmount)}</div>
  </div>

  <div class="row">
    <div class="label">Buyer commission</div>
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
        <div class="row">
          <div class="label">Fuel Proration Credit (to Buyer)</div>
          <div class="value">${money(fuelProrationCredit)}</div>
        </div>
        ${fuelBar(fuelProrationPercent)}
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
