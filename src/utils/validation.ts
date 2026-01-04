import { Statement } from "../models/statement";

export type ValidationError = {
  field: string;
  message: string;
};

export function validateStatement(statement: Statement): ValidationError[] {
  const errors: ValidationError[] = [];

  /* ---------- Sale price ---------- */
  const salePrice = statement.salePrice ?? NaN;
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    errors.push({
      field: "salePrice",
      message: "Sale price must be greater than 0.",
    });
  }

  /* ---------- Commission percentages ---------- */
  const listingCommissionPct = statement.listingCommissionPct ?? NaN;
  if (
    !Number.isFinite(listingCommissionPct) ||
    listingCommissionPct < 0 ||
    listingCommissionPct > 100
  ) {
    errors.push({
      field: "listingCommissionPct",
      message: "Listing commission must be between 0 and 100%.",
    });
  }

  const buyerCommissionPct = statement.buyerCommissionPct ?? NaN;
  if (
    !Number.isFinite(buyerCommissionPct) ||
    buyerCommissionPct < 0 ||
    buyerCommissionPct > 100
  ) {
    errors.push({
      field: "buyerCommissionPct",
      message: "Buyer commission must be between 0 and 100%.",
    });
  }

  /* ---------- Referral ---------- */
  if (
    Number.isFinite(statement.referralFeePct) &&
    (statement.referralFeePct! < 0 || statement.referralFeePct! > 100)
  ) {
    errors.push({
      field: "referralFeePct",
      message: "Referral fee must be between 0 and 100%.",
    });
  }

  /* ---------- Deposit ---------- */
  if (statement.deposit) {
    if (!Number.isFinite(statement.deposit.amount) || statement.deposit.amount < 0) {
      errors.push({
        field: "deposit.amount",
        message: "Deposit amount cannot be negative.",
      });
    }

    if (!statement.deposit.heldBy?.trim()) {
      errors.push({
        field: "deposit.heldBy",
        message: "Deposit must specify who is holding the funds.",
      });
    }
  }

  /* ---------- Team splits ---------- */
  if (statement.teamSplits?.length) {
    let totalPct = 0;

    statement.teamSplits.forEach((split, index) => {
      if (!split.name?.trim()) {
        errors.push({
          field: `teamSplits[${index}].name`,
          message: "All team members must have a name.",
        });
      }

      if (
        !Number.isFinite(split.percentage) ||
        split.percentage <= 0 ||
        split.percentage > 100
      ) {
        errors.push({
          field: `teamSplits[${index}].percentage`,
          message: "Each team split must be between 0 and 100%.",
        });
      }

      totalPct += split.percentage || 0;
    });

    if (Math.round(totalPct * 100) / 100 !== 100) {
      errors.push({
        field: "teamSplits",
        message: "Team split percentages must total exactly 100%.",
      });
    }
  }

  return errors;
}
