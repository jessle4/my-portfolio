import { describe, expect, it } from "vitest";
import {
  calculateCustomComparison,
  type CustomComparisonInput,
} from "./customComparison";

const baseInput: CustomComparisonInput = {
  stocks: {
    initialInvestment: 5_000,
    monthlyContribution: 100,
    annualReturnRate: 0.07,
    annualFeeRate: 0.002,
    inflationRate: 0.02,
    years: 1,
  },
  property: {
    purchasePrice: 10_000,
    deposit: 1_000,
    upfrontPurchaseCosts: 100,
    financedPurchaseCosts: 0,
    annualMortgageRate: 0,
    mortgageTermYears: 1,
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
      initialBalance: 500,
      monthlyDeposit: 0,
      monthlyWithdrawal: 0,
    },
    propertyShares: {
      initialInvestment: 1_000,
      monthlyContribution: 100,
      annualReturnRate: 0.07,
      annualFeeRate: 0.002,
      inflationRate: 0.02,
    },
    rentalSurplusAllocation: "cash",
    postPayoffAllocation: "cash",
  },
};

describe("calculateCustomComparison", () => {
  it("reports each scenario's external contributions and warns when they differ", () => {
    const result = calculateCustomComparison(baseInput);

    expect(result.stocksExternalCashContributed).toBe(6_200);
    expect(result.propertyExternalCashContributed).toBeGreaterThan(
      result.stocksExternalCashContributed,
    );
    expect(result.warning).toMatch(/External contributions differ/);
  });

  it("warns when contribution timing differs even if totals match", () => {
    const result = calculateCustomComparison({
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 0,
        monthlyContribution: 100,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 1_200,
        deposit: 1_200,
        upfrontPurchaseCosts: 0,
        financedPurchaseCosts: 0,
        offset: {
          initialBalance: 0,
          monthlyDeposit: 0,
          monthlyWithdrawal: 0,
        },
        propertyShares: {
          ...baseInput.property.propertyShares,
          initialInvestment: 0,
          monthlyContribution: 0,
        },
      },
    });

    expect(result.stocksExternalCashContributed).toBe(1_200);
    expect(result.propertyExternalCashContributed).toBe(1_200);
    expect(result.warning).toMatch(/External contributions differ/);
  });

  it("requires a shared projection horizon", () => {
    expect(() =>
      calculateCustomComparison({
        ...baseInput,
        property: { ...baseInput.property, projectionYears: 2 },
      }),
    ).toThrow(/same projection horizon/);
  });
});
