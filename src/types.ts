export type UnitSystem = "metric" | "imperial";

export interface BmiRecord {
  id: string;
  date: string;
  weight: number; // kg or lbs
  height: number; // cm or inches
  unitSystem: UnitSystem;
  bmi: number;
  category: "Underweight" | "Normal Weight" | "Overweight" | "Obese";
  age?: number;
  gender?: string;
  goal?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  affiliateUrl: string;
  badge?: string;
}

export interface HealthFact {
  id: string;
  title: string;
  description: string;
  category: string;
}
