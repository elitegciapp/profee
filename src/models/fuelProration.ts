export interface FuelTank {
  id: string;
  capacityGallons: number;
  currentGallons: number;
  percentFull?: number;
  pricePerGallon: number;
}

export type FuelPhotoAttachment = {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
};

export interface FuelProration {
  tanks: FuelTank[];
  totalCredit: number;
}
