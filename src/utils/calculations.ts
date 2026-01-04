import type { Statement, TeamSplit } from "@/src/models/statement";

export interface TeamSplitResult {
  name: string;
  percentage: number;
  amount: number;
}

export interface StatementSummary {
  listingCommissionAmount: number;
  buyerCommissionAmount: number;
  grossCommissionAmount: number;
  referralFeeAmount: number;
  netCommissionAmount: number;
  teamSplitResults: TeamSplitResult[];
  depositAmount: number;
}

function calculateTeamSplits(netCommission: number, splits: TeamSplit[] = []): TeamSplitResult[] {
  return splits.map((split) => ({
    name: split.name,
    percentage: split.percentage,
    amount: netCommission * (split.percentage / 100),
  }));
}

export function calculateStatementSummary(statement: Statement): StatementSummary {
  const salePrice = statement.salePrice ?? 0;

  const listingCommissionAmount = salePrice * ((statement.listingCommissionPct ?? 0) / 100);
  const buyerCommissionAmount = salePrice * ((statement.buyerCommissionPct ?? 0) / 100);

  const grossCommissionAmount = listingCommissionAmount + buyerCommissionAmount;

  const referralFeePct = statement.referralFeePercent ?? statement.referralFeePct ?? 0;
  const referralFeeAmount = grossCommissionAmount * (referralFeePct / 100);

  const netCommissionAmount = grossCommissionAmount - referralFeeAmount;

  const depositAmount = statement.deposit?.amount ?? 0;

  const teamSplitResults = calculateTeamSplits(netCommissionAmount, statement.teamSplits);

  return {
    listingCommissionAmount,
    buyerCommissionAmount,
    grossCommissionAmount,
    referralFeeAmount,
    netCommissionAmount,
    teamSplitResults,
    depositAmount,
  };
}
