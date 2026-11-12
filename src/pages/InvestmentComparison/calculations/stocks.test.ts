import { describe, expect, it } from "vitest";
import {
  calculateStockInvestmentMonth,
  calculateStockInvestmentProjection,
} from "./stocks";

const baseInput = {
  initialInvestment: 0,
  monthlyContribution: 0,
  annualReturnRate: 0,
  annualFeeRate: 0,
  inflationRate: 0,
  years: 1,
};

describe("calculateStockInvestmentProjection", () => {
  it("calculates a single month with the same return, fee, and contribution convention", () => {
    const result = calculateStockInvestmentMonth({
      startingBalance: 1_000,
      monthlyContribution: 100,
      annualReturnRate: 0.12,
      annualFeeRate: 0.01,
    });

    expect(result.endingBalance).toBeCloseTo(
      1_000 * Math.pow(1.12, 1 / 12) * Math.pow(0.99, 1 / 12) + 100,
      10,
    );
    expect(result.fee).toBeGreaterThan(0);
  });

  it("returns each year-end balance and counts contributions made at month end", () => {
    const projection = calculateStockInvestmentProjection({
      ...baseInput,
      initialInvestment: 1_000,
      monthlyContribution: 100,
      years: 2,
    });

    expect(projection).toHaveLength(2);
    expect(projection[0]).toEqual({
      year: 1,
      nominalBalance: 2_200,
      inflationAdjustedBalance: 2_200,
      cumulativeContributions: 2_200,
      cumulativeFees: 0,
      netGrowth: 0,
    });
    expect(projection[1].cumulativeContributions).toBe(3_400);
    expect(projection[1].nominalBalance).toBe(3_400);
  });

  it("compounds an effective annual return monthly", () => {
    const [year] = calculateStockInvestmentProjection({
      ...baseInput,
      initialInvestment: 1_000,
      annualReturnRate: 0.12,
    });

    expect(year.nominalBalance).toBeCloseTo(1_120, 10);
    expect(year.netGrowth).toBeCloseTo(120, 10);
  });

  it("adds monthly contributions at month end", () => {
    const monthlyGrowthFactor = Math.pow(1.12, 1 / 12);
    const expectedBalance = Array.from({ length: 12 }, (_, month) =>
      100 * Math.pow(monthlyGrowthFactor, month),
    ).reduce((sum, contributionValue) => sum + contributionValue, 0);

    const [year] = calculateStockInvestmentProjection({
      ...baseInput,
      monthlyContribution: 100,
      annualReturnRate: 0.12,
    });

    expect(year.nominalBalance).toBeCloseTo(expectedBalance, 10);
    expect(year.cumulativeContributions).toBe(1_200);
  });

  it("applies annual fees monthly and reports cumulative fees", () => {
    const [year] = calculateStockInvestmentProjection({
      ...baseInput,
      initialInvestment: 1_000,
      annualReturnRate: 0.1,
      annualFeeRate: 0.01,
    });

    expect(year.nominalBalance).toBeCloseTo(1_000 * 1.1 * 0.99, 10);
    expect(year.cumulativeFees).toBeGreaterThan(0);
    expect(year.netGrowth).toBeCloseTo(year.nominalBalance - 1_000, 10);
  });

  it("reports inflation-adjusted year-end balances", () => {
    const [year] = calculateStockInvestmentProjection({
      ...baseInput,
      initialInvestment: 1_000,
      annualReturnRate: 0.1,
      inflationRate: 0.1,
    });

    expect(year.nominalBalance).toBeCloseTo(1_100, 10);
    expect(year.inflationAdjustedBalance).toBeCloseTo(1_000, 10);
  });

  it("supports negative annual returns", () => {
    const [year] = calculateStockInvestmentProjection({
      ...baseInput,
      initialInvestment: 1_000,
      annualReturnRate: -0.5,
    });

    expect(year.nominalBalance).toBeCloseTo(500, 10);
    expect(year.netGrowth).toBeCloseTo(-500, 10);
  });

  it.each([
    ["negative initial investment", { initialInvestment: -1 }],
    ["negative monthly contribution", { monthlyContribution: -1 }],
    ["return below -100%", { annualReturnRate: -1.01 }],
    ["negative fees", { annualFeeRate: -0.01 }],
    ["fees at or above 100%", { annualFeeRate: 1 }],
    ["inflation at or below -100%", { inflationRate: -1 }],
    ["zero years", { years: 0 }],
    ["fractional years", { years: 1.5 }],
    ["more than 50 years", { years: 51 }],
    ["non-finite amount", { initialInvestment: Number.POSITIVE_INFINITY }],
  ])("rejects %s", (_description, overrides) => {
    expect(() =>
      calculateStockInvestmentProjection({
        ...baseInput,
        ...overrides,
      }),
    ).toThrow(RangeError);
  });

  it("rejects a projection that overflows the numeric range", () => {
    expect(() =>
      calculateStockInvestmentProjection({
        ...baseInput,
        initialInvestment: Number.MAX_VALUE,
        annualReturnRate: 1_000,
      }),
    ).toThrow(/numeric range/);
  });

  it("rejects cumulative contributions that overflow the numeric range", () => {
    expect(() =>
      calculateStockInvestmentProjection({
        ...baseInput,
        monthlyContribution: Number.MAX_VALUE,
        annualReturnRate: -1,
      }),
    ).toThrow(/numeric range/);
  });
});
