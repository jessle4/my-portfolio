import type { CombinedPropertyInput } from "./calculations/combined";
import type { StockInvestmentInput } from "./calculations/stocks";

export const INITIAL_STOCKS: StockInvestmentInput = {
  initialInvestment: 50_000,
  monthlyContribution: 1_500,
  annualReturnRate: 0.06,
  annualFeeRate: 0.002,
  inflationRate: 0.025,
  years: 10,
};

export const INITIAL_PROPERTY: CombinedPropertyInput = {
  purchasePrice: 500_000,
  deposit: 30_000,
  upfrontPurchaseCosts: 5_000,
  financedPurchaseCosts: 0,
  annualMortgageRate: 0.06,
  mortgageTermYears: 30,
  extraMonthlyRepayment: 0,
  annualPropertyGrowthRate: 0.03,
  monthlyGrossRent: 2_400,
  annualRentalGrowthRate: 0.03,
  vacancyWeeksPerYear: 2,
  propertyManagementRate: 0.06,
  annualExpenses: {
    strata: 4_500,
    councilRates: 1_500,
    waterRates: 900,
    insurance: 700,
    maintenance: 1_500,
    other: 0,
  },
  projectionYears: 10,
  offset: {
    initialBalance: 10_000,
    monthlyDeposit: 300,
    monthlyWithdrawal: 0,
  },
  propertyShares: {
    initialInvestment: 5_000,
    monthlyContribution: 500,
    annualReturnRate: 0.06,
    annualFeeRate: 0.002,
    inflationRate: 0.025,
  },
  rentalSurplusAllocation: "offset",
  postPayoffAllocation: "stocks",
};
