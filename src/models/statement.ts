import type { TitleCompany } from "./titleCompany";

export interface Deposit {
  amount: number;
  heldBy: string;
  creditedToBuyer: boolean;
}

export interface TeamSplit {
  id?: string;
  name: string;
  percentage: number;
}

export interface Statement {
  id: string;
  createdAt: string;

  propertyAddress?: string;
  salePrice?: number;

  listingCommissionPct?: number; // 0–100
  buyerCommissionPct?: number; // 0–100

  referralFeePct?: number; // 0–100
  referralFeePercent?: number; // 0–100 (alias)
  referralRecipient?: string;

  deposit?: Deposit;

  teamSplits?: TeamSplit[];

  titleCompany?: TitleCompany;

  titleCompanyName?: string;
  titleCompanyEmail?: string;
}
