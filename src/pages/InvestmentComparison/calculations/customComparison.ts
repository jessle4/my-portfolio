import {
  calculateCombinedPropertyProjection,
  type CombinedPropertyInput,
} from "./combined";
import {
  calculateStockInvestmentProjection,
  type StockInvestmentInput,
  type StockInvestmentYear,
} from "./stocks";

export interface CustomComparisonInput {
  stocks: StockInvestmentInput;
  property: CombinedPropertyInput;
}

export interface CustomComparisonResult {
  stocks: StockInvestmentYear[];
  property: ReturnType<typeof calculateCombinedPropertyProjection>;
  stocksExternalCashContributed: number;
  propertyExternalCashContributed: number;
  warning: string | null;
}

const CONTRIBUTION_TOLERANCE = 0.01;

export function calculateCustomComparison(
  input: CustomComparisonInput,
): CustomComparisonResult {
  if (input.stocks.years !== input.property.projectionYears) {
    throw new RangeError(
      "Both custom scenarios must use the same projection horizon.",
    );
  }

  const stocks = calculateStockInvestmentProjection(input.stocks);
  const property = calculateCombinedPropertyProjection(input.property);
  const finalStockYear = stocks.at(-1);
  const finalPropertyYear = property.annual.at(-1);
  if (!finalStockYear || !finalPropertyYear) {
    throw new Error("Missing annual results for custom comparison.");
  }
  const stocksExternalCashContributed =
    finalStockYear.cumulativeContributions;
  const propertyExternalCashContributed =
    finalPropertyYear.cumulativeExternalCash;
  const propertyInitialContributions =
    input.property.deposit +
    input.property.upfrontPurchaseCosts +
    input.property.offset.initialBalance +
    input.property.propertyShares.initialInvestment;
  const propertyMonthlyContributions =
    input.property.offset.monthlyDeposit +
    input.property.propertyShares.monthlyContribution;
  const contributionsDiffer =
    Math.abs(
      stocksExternalCashContributed - propertyExternalCashContributed,
    ) > CONTRIBUTION_TOLERANCE ||
    Math.abs(
      input.stocks.initialInvestment - propertyInitialContributions,
    ) > CONTRIBUTION_TOLERANCE ||
    Math.abs(
      input.stocks.monthlyContribution - propertyMonthlyContributions,
    ) > CONTRIBUTION_TOLERANCE;

  return {
    stocks,
    property,
    stocksExternalCashContributed,
    propertyExternalCashContributed,
    warning: contributionsDiffer
      ? "External contributions differ; these outcomes are not directly comparable."
      : null,
  };
}
