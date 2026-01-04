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

  deposit?: Deposit;

  teamSplits?: TeamSplit[];

  titleCompanyName?: string;
  titleCompanyEmail?: string;
}
