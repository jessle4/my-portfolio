import { describe, expect, it } from "vitest";
import { calculatePropertyProjection } from "./property";

const baseInput = {
  purchasePrice: 500_000,
  deposit: 50_000,
  upfrontPurchaseCosts: 10_000,
  financedPurchaseCosts: 0,
  annualMortgageRate: 0,
  mortgageTermYears: 30,
  extraMonthlyRepayment: 0,
  annualPropertyGrowthRate: 0,
  monthlyGrossRent: 2_200,
  annualRentalGrowthRate: 0,
  vacancyWeeksPerYear: 0,
  propertyManagementRate: 0,
  annualExpenses: {
    strata: 4_500,
    councilRates: 1_500,
    waterRates: 900,
    insurance: 700,
    maintenance: 1_500,
    other: 0,
  },
  projectionYears: 2,
};

describe("calculatePropertyProjection", () => {
  it("derives the loan and initial cash required from purchase allocations", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      financedPurchaseCosts: 5_000,
    });

    expect(result.loanPrincipal).toBe(455_000);
    expect(result.initialCashRequired).toBe(60_000);
    expect(result.scheduledMonthlyMortgagePayment).toBeCloseTo(
      455_000 / 360,
      10,
    );
  });

  it("projects property growth, mortgage balance, and equity at year end", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      annualPropertyGrowthRate: 0.03,
    });

    expect(result.annual[0].propertyValue).toBeCloseTo(515_000, 8);
    expect(result.annual[0].loanBalance).toBeCloseTo(435_000, 8);
    expect(result.annual[0].propertyEquity).toBeCloseTo(
      result.annual[0].propertyValue - result.annual[0].loanBalance,
      8,
    );
    expect(result.annual[1].propertyValue).toBeCloseTo(530_450, 8);
  });

  it("applies vacancy and management fees to collected rent only", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      vacancyWeeksPerYear: 2,
      propertyManagementRate: 0.07,
    });
    const firstMonth = result.monthly[0];
    const collectedRent = 2_200 * (50 / 52);

    expect(firstMonth.grossRent).toBe(2_200);
    expect(firstMonth.vacancyAllowance).toBeCloseTo(2_200 * (2 / 52), 10);
    expect(firstMonth.rentReceived).toBeCloseTo(collectedRent, 10);
    expect(firstMonth.propertyManagementFee).toBeCloseTo(
      collectedRent * 0.07,
      10,
    );
  });

  it("increases rent at the beginning of each projection year", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      annualRentalGrowthRate: 0.03,
    });

    expect(result.annual[0].grossRent).toBe(2_200 * 12);
    expect(result.annual[1].grossRent).toBeCloseTo(2_200 * 1.03 * 12, 10);
  });

  it("reports net monthly cash flow and uses retained surplus before out-of-pocket funding", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      monthlyGrossRent: 1_000,
      annualExpenses: {
        strata: 0,
        councilRates: 0,
        waterRates: 0,
        insurance: 0,
        maintenance: 0,
        other: 0,
      },
    });

    expect(result.monthly[0].cashFlow).toBe(-250);
    expect(result.monthly[0].outOfPocket).toBe(250);
    expect(result.monthly[0].cumulativeOutOfPocket).toBe(250);
    expect(result.annual[0].mortgagePayments).toBe(15_000);
    expect(result.annual[0].cashFlow).toBe(-3_000);
  });

  it("retains surplus cash and uses it to cover later monthly shortfalls", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      deposit: 0,
      upfrontPurchaseCosts: 0,
      monthlyGrossRent: 2_000,
      mortgageTermYears: 1,
      annualExpenses: {
        strata: 0,
        councilRates: 0,
        waterRates: 0,
        insurance: 0,
        maintenance: 0,
        other: 0,
      },
    });

    expect(result.monthly[0].cashFlow).toBe(1_000);
    expect(result.monthly[0].retainedCashBalance).toBe(1_000);
    expect(result.monthly[1].outOfPocket).toBe(0);
    expect(result.annual[0].retainedCashBalance).toBe(12_000);
    expect(result.annual[0].cumulativeOutOfPocket).toBe(0);
  });

  it("stops mortgage payments after early payoff while rent and expenses continue", () => {
    const result = calculatePropertyProjection({
      ...baseInput,
      purchasePrice: 12_000,
      deposit: 0,
      upfrontPurchaseCosts: 0,
      monthlyGrossRent: 1_000,
      mortgageTermYears: 10,
      extraMonthlyRepayment: 10_000,
      annualExpenses: {
        strata: 0,
        councilRates: 0,
        waterRates: 0,
        insurance: 0,
        maintenance: 0,
        other: 0,
      },
    });

    expect(result.mortgagePayoffMonth).toBe(2);
    expect(result.monthly[1].mortgagePayment).toBe(1_900);
    expect(result.monthly[2].mortgagePayment).toBe(0);
    expect(result.monthly[2].rentReceived).toBe(1_000);
  });

  it("rejects deposits above the purchase price and invalid growth inputs", () => {
    expect(() =>
      calculatePropertyProjection({
        ...baseInput,
        deposit: baseInput.purchasePrice + 1,
      }),
    ).toThrow(/Deposit cannot exceed/);

    expect(() =>
      calculatePropertyProjection({
        ...baseInput,
        annualPropertyGrowthRate: -1.01,
      }),
    ).toThrow(/below -100%/);
  });

  it("rejects invalid vacancy, costs, and projection horizons", () => {
    expect(() =>
      calculatePropertyProjection({
        ...baseInput,
        vacancyWeeksPerYear: 53,
      }),
    ).toThrow(/Vacancy/);

    expect(() =>
      calculatePropertyProjection({
        ...baseInput,
        annualExpenses: { ...baseInput.annualExpenses, strata: -1 },
      }),
    ).toThrow(/cannot be negative/);

    expect(() =>
      calculatePropertyProjection({
        ...baseInput,
        projectionYears: 0,
      }),
    ).toThrow(/Projection years/);
  });
});
