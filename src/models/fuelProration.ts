export interface FuelTank {
  id: string;
  capacityGallons: number;
  currentGallons: number;
  percentFull?: number;
  pricePerGallon: number;
}

export type FuelType = "oil" | "propane" | "kerosene";
export type TankOwnership = "owned" | "leased";

export type FuelPhotoAttachment = {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
};

export interface FuelProrationRecord {
  id: string;
  fuelLevelPercent: number;
  totalFuelCredit: number;
  creditedTo: "buyer" | "seller";
  fuelType: FuelType;
  fuelCompany: string;
  tankOwnership: TankOwnership;
  gaugePhotoUri?: string;
  createdAt: string;
}

export interface FuelProration {
  tanks: FuelTank[];
  totalCredit: number;
}
