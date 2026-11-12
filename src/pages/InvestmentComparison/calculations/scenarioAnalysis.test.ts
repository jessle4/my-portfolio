import { describe, expect, it } from "vitest";
import { calculateFairScenarioAnalysis } from "./scenarioAnalysis";
import {
  calculateFairComparison,
  type FairComparisonInput,
} from "./fairComparison";

const input: FairComparisonInput = {
  startingCapital: 20_000,
  monthlyExternalCashBudget: 600,
  projectionYears: 1,
  inflationRate: 0.02,
  stocks: {
    initialInvestment: 20_000,
    monthlyContribution: 600,
    annualReturnRate: 0.07,
    annualFeeRate: 0.002,
  },
  property: {
    purchasePrice: 100_000,
    deposit: 10_000,
    upfrontPurchaseCosts: 0,
    financedPurchaseCosts: 0,
    annualMortgageRate: 0.06,
    mortgageTermYears: 30,
    extraMonthlyRepayment: 0,
    annualPropertyGrowthRate: 0.03,
    monthlyGrossRent: 2_000,
    annualRentalGrowthRate: 0.02,
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
    offset: {
      initialBalance: 1_000,
      monthlyDeposit: 100,
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
    postPayoffAllocation: "stocks",
  },
};

describe("calculateFairScenarioAnalysis", () => {
  it("includes the exact base case and bounded downside and upside cases", () => {
    const scenarios = calculateFairScenarioAnalysis(input);

    expect(scenarios.rows.map((row) => row.key)).toEqual([
      "downside",
      "base",
      "upside",
    ]);
    const base = calculateFairComparison(input);
    expect(scenarios.rows[1]?.stocksNetWorth).toBeCloseTo(
      base.stocksOnly.annual.at(-1)?.netWorth ?? 0,
      8,
    );
    expect(scenarios.rows[0]?.stocksNetWorth).toBeLessThan(
      scenarios.rows[1]?.stocksNetWorth ?? 0,
    );
    expect(scenarios.rows[2]?.stocksNetWorth).toBeGreaterThan(
      scenarios.rows[1]?.stocksNetWorth ?? 0,
    );
    expect(scenarios.rows.every((row) => row.propertyNetWorth !== null)).toBe(
      true,
    );
  });

  it("keeps the downside valid at lower rate boundaries", () => {
    const scenarios = calculateFairScenarioAnalysis({
      ...input,
      stocks: { ...input.stocks, annualReturnRate: -1 },
      property: {
        ...input.property,
        annualMortgageRate: 0,
        annualPropertyGrowthRate: -1,
        annualRentalGrowthRate: -1,
      },
    });

    expect(scenarios.rows).toHaveLength(3);
    expect(Number.isFinite(scenarios.rows[0]?.stocksNetWorth)).toBe(true);
    expect(scenarios.rows[2]?.adjustment.annualMortgageRate).toBe(0);
  });
});
