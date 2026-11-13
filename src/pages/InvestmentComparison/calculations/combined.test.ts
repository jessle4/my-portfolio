import { describe, expect, it } from "vitest";
import {
  calculateCombinedPropertyProjection,
  type CombinedPropertyInput,
} from "./combined";
import { calculatePropertyProjection } from "./property";

const baseInput: CombinedPropertyInput = {
  purchasePrice: 100_000,
  deposit: 0,
  upfrontPurchaseCosts: 0,
  financedPurchaseCosts: 0,
  annualMortgageRate: 0.06,
  mortgageTermYears: 30,
  extraMonthlyRepayment: 0,
  annualPropertyGrowthRate: 0,
  monthlyGrossRent: 0,
  annualRentalGrowthRate: 0,
  vacancyWeeksPerYear: 0,
  propertyManagementRate: 0,
  annualExpenses: {
    strata: 0,
    councilRates: 0,
    waterRates: 0,
    insurance: 0,
    maintenance: 0,
    other: 0,
  },
  projectionYears: 1,
  offset: {
    initialBalance: 0,
    monthlyDeposit: 0,
    monthlyWithdrawal: 0,
  },
  propertyShares: {
    initialInvestment: 0,
    monthlyContribution: 0,
    annualReturnRate: 0.07,
    annualFeeRate: 0.002,
    inflationRate: 0.025,
  },
  rentalSurplusAllocation: "cash",
  postPayoffAllocation: "cash",
};

describe("calculateCombinedPropertyProjection", () => {
  it("matches the property schedule when there is no offset activity", () => {
    const result = calculateCombinedPropertyProjection(baseInput);
    const property = calculatePropertyProjection(baseInput);

    expect(
      result.monthly.map(({ mortgagePayment, mortgageInterest, loanBalance }) => ({
        mortgagePayment,
        mortgageInterest,
        loanBalance,
      })),
    ).toEqual(
      property.monthly.map(({ mortgagePayment, mortgageInterest, loanBalance }) => ({
        mortgagePayment,
        mortgageInterest,
        loanBalance,
      })),
    );
  });

  it("uses the offset for interest without reducing mortgage principal directly", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      offset: { ...baseInput.offset, initialBalance: 50_000 },
    });

    expect(result.monthly[0].interestBearingMortgageBalance).toBe(50_000);
    expect(result.monthly[0].mortgageInterest).toBe(250);
    expect(result.monthly[0].interestSaved).toBe(250);
    expect(result.monthly[0].offsetBalance).toBe(50_000);
    expect(result.monthly[0].loanBalance).toBeGreaterThan(0);
    expect(result.mortgagePayoffMonth).toBeLessThan(
      result.baselineMortgagePayoffMonth ?? 0,
    );
    expect(result.totalInterestSavedOverLoan).toBeGreaterThan(0);
  });

  it("applies monthly offset deposits and withdrawals before calculating interest", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      annualMortgageRate: 0.12,
      mortgageTermYears: 1,
      offset: {
        initialBalance: 0,
        monthlyDeposit: 300,
        monthlyWithdrawal: 0,
      },
    });

    expect(result.monthly[0].offsetBalanceForInterest).toBe(300);
    expect(result.monthly[0].interestBearingMortgageBalance).toBe(11_700);
    expect(result.monthly[0].mortgageInterest).toBeCloseTo(117, 10);
    expect(result.monthly[0].offsetBalance).toBe(300);
  });

  it("routes rental surplus to the offset after that month's interest is calculated", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      annualMortgageRate: 0.12,
      mortgageTermYears: 1,
      monthlyGrossRent: 2_000,
      rentalSurplusAllocation: "offset",
    });

    expect(result.monthly[0].interestBearingMortgageBalance).toBe(12_000);
    expect(result.monthly[0].offsetBalance).toBeGreaterThan(0);
    expect(result.monthly[0].retainedCashBalance).toBe(0);
    expect(result.monthly[1].interestBearingMortgageBalance).toBeCloseTo(
      result.monthly[0].loanBalance - result.monthly[0].offsetBalance,
      8,
    );
    expect(result.monthly[1].mortgageInterest).toBeLessThan(
      result.monthly[0].mortgageInterest,
    );
  });

  it("rejects an invalid visible projection horizon", () => {
    expect(() =>
      calculateCombinedPropertyProjection({
        ...baseInput,
        projectionYears: 0,
      }),
    ).toThrow(/Projection years must be a whole number/);
  });

  it("rejects an offset withdrawal larger than the available balance", () => {
    expect(() =>
      calculateCombinedPropertyProjection({
        ...baseInput,
        offset: { ...baseInput.offset, monthlyWithdrawal: 1 },
      }),
    ).toThrow(/exceeds available balance/);
  });

  it("routes post-payoff rental surplus to shares and counts internal contributions separately", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      deposit: 12_000,
      annualMortgageRate: 0,
      monthlyGrossRent: 1_000,
      propertyShares: {
        initialInvestment: 1_000,
        monthlyContribution: 100,
        annualReturnRate: 0,
        annualFeeRate: 0,
        inflationRate: 0,
      },
      offset: {
        initialBalance: 500,
        monthlyDeposit: 10,
        monthlyWithdrawal: 0,
      },
      rentalSurplusAllocation: "cash",
      postPayoffAllocation: "stocks",
    });

    expect(result.monthly[0].propertySideStockContribution).toBe(1_100);
    expect(result.monthly[0].cumulativeStockContributions).toBe(2_100);
    expect(result.monthly[0].cumulativeExternalStockContributions).toBe(1_100);
    expect(
      result.monthly[0].cumulativeRentalSurplusInvestedInStocks,
    ).toBe(1_000);
    expect(result.annual[0].propertySideStockBalance).toBe(14_200);
    expect(result.annual[0].offsetBalance).toBe(620);
    expect(result.annual[0].netWorth).toBe(26_820);
    expect(result.annual[0].cumulativeExternalCash).toBe(14_820);
  });

  it("switches the rental-surplus destination after mortgage payoff", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      deposit: 0,
      annualMortgageRate: 0,
      mortgageTermYears: 1,
      projectionYears: 2,
      monthlyGrossRent: 2_000,
      propertyShares: {
        initialInvestment: 0,
        monthlyContribution: 0,
        annualReturnRate: 0,
        annualFeeRate: 0,
        inflationRate: 0,
      },
      rentalSurplusAllocation: "cash",
      postPayoffAllocation: "stocks",
    });

    expect(result.mortgagePayoffMonth).toBe(12);
    expect(result.monthly[10].rentalSurplusInvestedInStocks).toBe(0);
    expect(result.monthly[11].rentalSurplusInvestedInStocks).toBe(1_000);
    expect(result.monthly[12].mortgagePayment).toBe(0);
    expect(result.monthly[12].propertySideStockContribution).toBe(2_000);
  });

  it("keeps offset cash separate from principal even when it exceeds the loan", () => {
    const result = calculateCombinedPropertyProjection({
      ...baseInput,
      offset: { ...baseInput.offset, initialBalance: 150_000 },
    });

    expect(result.monthly[0].interestBearingMortgageBalance).toBe(0);
    expect(result.monthly[0].mortgageInterest).toBe(0);
    expect(result.monthly[0].loanBalance).toBeGreaterThan(0);
    expect(result.monthly[0].offsetBalance).toBe(150_000);
  });
});
