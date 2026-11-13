import type { DashboardYear } from "../InvestmentComparison.types";
import type { FairComparisonResult } from "../calculations/fairComparison";
import type { CustomComparisonResult } from "../calculations/customComparison";

export function toFairDashboardRows(result: FairComparisonResult): DashboardYear[] {
  const propertyByYear = new Map(
    result.propertyAndStocks.annual.map((year) => [year.year, year]),
  );

  return result.stocksOnly.annual.map((stocks) => {
    const property = propertyByYear.get(stocks.year);
    return {
      year: stocks.year,
      stocksNetWorth: stocks.netWorth,
      stocksPortfolio: stocks.stockBalance,
      stocksCash: stocks.cashBalance,
      stocksExternalCash: stocks.cumulativeExternalCash,
      stocksRealNetWorth: stocks.inflationAdjustedNetWorth,
      propertyNetWorth: property?.netWorth ?? null,
      propertyRealNetWorth: property?.inflationAdjustedNetWorth ?? null,
      propertyValue: property?.propertyValue ?? null,
      loanBalance: property?.loanBalance ?? null,
      propertyEquity: property?.propertyEquity ?? null,
      offsetBalance: property?.offsetBalance ?? null,
      propertyStocks: property?.propertySideStockBalance ?? null,
      propertyStockContributions:
        property?.cumulativeStockContributions ?? null,
      rentReceived: property?.rentReceived ?? null,
      operatingExpenses: property?.operatingExpenses ?? null,
      propertyManagementFee: property?.propertyManagementFee ?? null,
      mortgagePayments: property?.mortgagePayments ?? null,
      rentalCashFlow: property?.cashFlow ?? null,
      propertyExternalCash: property?.cumulativeExternalCash ?? null,
    };
  });
}

export function toCustomDashboardRows(
  result: CustomComparisonResult,
): DashboardYear[] {
  const propertyByYear = new Map(
    result.property.annual.map((year) => [year.year, year]),
  );

  return result.stocks.map((stocks) => {
    const property = propertyByYear.get(stocks.year);
    return {
      year: stocks.year,
      stocksNetWorth: stocks.nominalBalance,
      stocksPortfolio: stocks.nominalBalance,
      stocksCash: 0,
      stocksExternalCash: stocks.cumulativeContributions,
      stocksRealNetWorth: stocks.inflationAdjustedBalance,
      propertyNetWorth: property?.netWorth ?? null,
      propertyRealNetWorth: property?.inflationAdjustedNetWorth ?? null,
      propertyValue: property?.propertyValue ?? null,
      loanBalance: property?.loanBalance ?? null,
      propertyEquity: property?.propertyEquity ?? null,
      offsetBalance: property?.offsetBalance ?? null,
      propertyStocks: property?.propertySideStockBalance ?? null,
      propertyStockContributions:
        property?.cumulativeStockContributions ?? null,
      rentReceived: property?.rentReceived ?? null,
      operatingExpenses: property?.operatingExpenses ?? null,
      propertyManagementFee: property?.propertyManagementFee ?? null,
      mortgagePayments: property?.mortgagePayments ?? null,
      rentalCashFlow: property?.cashFlow ?? null,
      propertyExternalCash: property?.cumulativeExternalCash ?? null,
    };
  });
}
