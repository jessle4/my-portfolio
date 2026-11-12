import type { CombinedPropertyInput } from "./combined";
import type { StockInvestmentInput } from "./stocks";

export interface SavedScenario {
  name: string;
  mode: "fair" | "custom";
  startingCapital: number;
  monthlyBudget: number;
  firstMonthlyAllocation: "offset" | "stocks";
  stocks: StockInvestmentInput;
  property: CombinedPropertyInput;
}

const STOCK_NUMBER_FIELDS = [
  "initialInvestment",
  "monthlyContribution",
  "annualReturnRate",
  "annualFeeRate",
  "inflationRate",
] as const;
const PROPERTY_NUMBER_FIELDS = [
  "purchasePrice",
  "deposit",
  "upfrontPurchaseCosts",
  "financedPurchaseCosts",
  "annualMortgageRate",
  "mortgageTermYears",
  "extraMonthlyRepayment",
  "annualPropertyGrowthRate",
  "monthlyGrossRent",
  "annualRentalGrowthRate",
  "vacancyWeeksPerYear",
  "propertyManagementRate",
  "projectionYears",
] as const;
const EXPENSE_FIELDS = [
  "strata",
  "councilRates",
  "waterRates",
  "insurance",
  "maintenance",
  "other",
] as const;
const OFFSET_FIELDS = [
  "initialBalance",
  "monthlyDeposit",
  "monthlyWithdrawal",
] as const;
const PROPERTY_SHARE_FIELDS = [
  "initialInvestment",
  "monthlyContribution",
  "annualReturnRate",
  "annualFeeRate",
  "inflationRate",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasFiniteNumbers(
  record: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  return fields.every(
    (field) =>
      typeof record[field] === "number" && Number.isFinite(record[field]),
  );
}

function isSavedScenario(value: unknown): value is SavedScenario {
  if (!isRecord(value) || !isRecord(value.stocks) || !isRecord(value.property)) {
    return false;
  }
  const stocks = value.stocks;
  const property = value.property;
  const annualExpenses = property.annualExpenses;
  const offset = property.offset;
  const propertyShares = property.propertyShares;

  return (
    typeof value.name === "string" &&
    (value.mode === "fair" || value.mode === "custom") &&
    typeof value.startingCapital === "number" &&
    Number.isFinite(value.startingCapital) &&
    typeof value.monthlyBudget === "number" &&
    Number.isFinite(value.monthlyBudget) &&
    (value.firstMonthlyAllocation === "offset" ||
      value.firstMonthlyAllocation === "stocks") &&
    hasFiniteNumbers(stocks, STOCK_NUMBER_FIELDS) &&
    typeof stocks.years === "number" &&
    Number.isInteger(stocks.years) &&
    hasFiniteNumbers(property, PROPERTY_NUMBER_FIELDS) &&
    isRecord(annualExpenses) &&
    hasFiniteNumbers(annualExpenses, EXPENSE_FIELDS) &&
    isRecord(offset) &&
    hasFiniteNumbers(offset, OFFSET_FIELDS) &&
    isRecord(propertyShares) &&
    hasFiniteNumbers(propertyShares, PROPERTY_SHARE_FIELDS) &&
    (property.rentalSurplusAllocation === "offset" ||
      property.rentalSurplusAllocation === "stocks" ||
      property.rentalSurplusAllocation === "cash") &&
    (property.postPayoffAllocation === "offset" ||
      property.postPayoffAllocation === "stocks" ||
      property.postPayoffAllocation === "cash")
  );
}

export function serializeSavedScenario(scenario: SavedScenario): string {
  return JSON.stringify(scenario);
}

export function parseSavedScenario(serialized: string): SavedScenario | null {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    return null;
  }
  return isSavedScenario(value) ? value : null;
}
