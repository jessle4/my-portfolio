import { describe, expect, it } from "vitest";
import {
  parseSavedScenario,
  serializeSavedScenario,
  type SavedScenario,
} from "./savedScenario";

const scenario: SavedScenario = {
  name: "Base case",
  mode: "fair",
  startingCapital: 50_000,
  monthlyBudget: 1_500,
  firstMonthlyAllocation: "offset",
  stocks: {
    initialInvestment: 50_000,
    monthlyContribution: 1_500,
    annualReturnRate: 0.07,
    annualFeeRate: 0.002,
    inflationRate: 0.025,
    years: 10,
  },
  property: {
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
    propertyManagementRate: 0.07,
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
      annualReturnRate: 0.07,
      annualFeeRate: 0.002,
      inflationRate: 0.025,
    },
    rentalSurplusAllocation: "offset",
    postPayoffAllocation: "stocks",
  },
};

describe("saved comparison scenarios", () => {
  it("round-trips supported scenario data", () => {
    expect(parseSavedScenario(serializeSavedScenario(scenario))).toEqual(
      scenario,
    );
  });

  it("rejects malformed, unsupported, or invalid scenario data", () => {
    expect(parseSavedScenario("{")).toBeNull();
    expect(parseSavedScenario(JSON.stringify({ version: 99 }))).toBeNull();
    expect(
      parseSavedScenario(
        JSON.stringify({
          ...scenario,
          stocks: { ...scenario.stocks, years: 1.5 },
        }),
      ),
    ).toBeNull();
  });
});
