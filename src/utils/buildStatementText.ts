import type { Statement } from "../models/statement";
import { calculateStatementSummary } from "./calculations";

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toFixed(2)}`;
}

function safeDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

export function buildStatementText(statement: Statement): string {
  const summary = calculateStatementSummary(statement);

  const titleName = statement.titleCompany?.name || statement.titleCompanyName || "—";
  const titleEmail = statement.titleCompany?.email || statement.titleCompanyEmail || "—";

  const lines: string[] = [];
  lines.push("ProFee Statement");

  const date = safeDate(statement.createdAt);
  if (statement.propertyAddress) lines.push(line("Property", statement.propertyAddress));
  if (date) lines.push(line("Date", date));

  lines.push("");
  lines.push(line("Sale price", money(statement.salePrice ?? 0)));
  lines.push(line("Title company", titleName));
  lines.push(line("Title email", titleEmail));

  lines.push("");
  lines.push(line("Listing commission", money(summary.listingCommissionAmount)));
  lines.push(line("Buyer commission", money(summary.buyerCommissionAmount)));
  lines.push(line("Gross commission", money(summary.grossCommissionAmount)));
  lines.push(line("Referral fee", money(summary.referralFeeAmount)));
  if (summary.referralFeeAmount > 0 && statement.referralRecipient) {
    lines.push(line("Referral paid to", statement.referralRecipient));
  }
  lines.push(line("Net commission", money(summary.netCommissionAmount)));

  if (statement.deposit?.amount && statement.deposit.amount > 0) {
    lines.push("");
    lines.push("Deposit");
    lines.push(line("Amount", money(statement.deposit.amount)));
    lines.push(line("Held by", statement.deposit.heldBy || "—"));
    lines.push(line("Credited to buyer", statement.deposit.creditedToBuyer ? "Yes" : "No"));
  }

  if (summary.teamSplitResults?.length) {
    lines.push("");
    lines.push("Team splits");
    for (const split of summary.teamSplitResults) {
      const name = split.name || "—";
      const pct = Number.isFinite(split.percentage) ? `${split.percentage}%` : "0%";
      lines.push(`${name} (${pct}): ${money(split.amount)}`);
    }
  }

  lines.push("");
  lines.push("Prepared by ProFee");
  return lines.join("\n");
}
