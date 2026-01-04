export interface FuelTank {
  id: string;
  capacityGallons: number;
  currentGallons: number;
  percentFull?: number;
  pricePerGallon: number;
}

export interface FuelProration {
  tanks: FuelTank[];
  totalCredit: number;
}
