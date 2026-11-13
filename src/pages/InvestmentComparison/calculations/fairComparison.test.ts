import { describe, expect, it } from "vitest";
import {
  calculateFairComparison,
  type FairComparisonInput,
} from "./fairComparison";
import { calculateStockInvestmentProjection } from "./stocks";

const baseInput: FairComparisonInput = {
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

describe("calculateFairComparison", () => {
  it("supports the comparison page's default fair-mode assumptions", () => {
    const result = calculateFairComparison({
      startingCapital: 50_000,
      monthlyExternalCashBudget: 1_500,
      projectionYears: 10,
      inflationRate: 0.025,
      stocks: {
        initialInvestment: 50_000,
        monthlyContribution: 1_500,
        annualReturnRate: 0.07,
        annualFeeRate: 0.002,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 500_000,
        deposit: 30_000,
        upfrontPurchaseCosts: 5_000,
        annualMortgageRate: 0.06,
        mortgageTermYears: 30,
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
    });

    expect(result.propertyAndStocks.feasible).toBe(true);
    expect(result.stocksOnly.annual).toHaveLength(10);
    expect(result.propertyAndStocks.annual).toHaveLength(10);
  });

  it("includes the property management fee in the cash ledger and rental flow", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 1_000,
      monthlyExternalCashBudget: 0,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 0,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 1_000,
        deposit: 1_000,
        monthlyGrossRent: 500,
        propertyManagementRate: 1,
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
        rentalSurplusAllocation: "cash",
      },
    });
    const month = result.propertyAndStocks.monthly[0];

    expect(month.propertyManagementFee).toBe(500);
    expect(month.cashFlow).toBe(0);
    expect(month.retainedCashBalance).toBe(0);
    expect(month.cashAvailableBeforeAllocations).toBe(500);
  });

  it("uses the same external capital and monthly budget for both strategies", () => {
    const result = calculateFairComparison(baseInput);
    const stockProjection = calculateStockInvestmentProjection({
      initialInvestment: baseInput.stocks.initialInvestment,
      monthlyContribution: baseInput.stocks.monthlyContribution,
      annualReturnRate: baseInput.stocks.annualReturnRate,
      annualFeeRate: baseInput.stocks.annualFeeRate,
      inflationRate: baseInput.inflationRate,
      years: baseInput.projectionYears,
    });

    expect(result.stocksOnly.annual[0].stockBalance).toBe(
      stockProjection[0].nominalBalance,
    );
    expect(result.stocksOnly.annual[0].cumulativeExternalCash).toBe(27_200);
    expect(
      result.propertyAndStocks.annual[0].cumulativeExternalCash,
    ).toBe(27_200);
    const propertyMonth = result.propertyAndStocks.monthly[0];
    expect(propertyMonth.cashAvailableBeforeAllocations).toBeCloseTo(
      propertyMonth.operatingExpenses +
        propertyMonth.propertyManagementFee +
        propertyMonth.mortgagePayment +
        propertyMonth.offsetDeposit +
        propertyMonth.propertySideStockContribution +
        propertyMonth.rentalSurplusToOffset +
        propertyMonth.retainedCashBalance,
      8,
    );
  });

  it("rejects initial property allocations above shared starting capital", () => {
    expect(() =>
      calculateFairComparison({
        ...baseInput,
        property: {
          ...baseInput.property,
          deposit: 19_000,
        },
      }),
    ).toThrow(/cannot exceed the shared starting capital/);
  });

  it("reconciles an offset deposit as a transfer from cash to the offset", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 1_000,
      monthlyExternalCashBudget: 100,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 0,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 1_000,
        deposit: 1_000,
        monthlyGrossRent: 0,
        offset: {
          initialBalance: 0,
          monthlyDeposit: 100,
          monthlyWithdrawal: 0,
        },
        propertyShares: {
          ...baseInput.property.propertyShares,
          initialInvestment: 0,
          monthlyContribution: 0,
        },
        rentalSurplusAllocation: "cash",
      },
    });
    const month = result.propertyAndStocks.monthly[0];

    expect(month.offsetDeposit).toBe(100);
    expect(month.offsetBalance).toBe(100);
    expect(month.retainedCashBalance).toBe(0);
    expect(month.netWorth).toBeCloseTo(month.propertyValue + 100, 8);
  });

  it("compares offset interest using the same actual extra repayments", () => {
    const result = calculateFairComparison({
      ...baseInput,
      property: {
        ...baseInput.property,
        extraMonthlyRepayment: 100,
        offset: {
          initialBalance: 0,
          monthlyDeposit: 0,
          monthlyWithdrawal: 0,
        },
      },
    });

    expect(result.propertyAndStocks.totalInterestSaved).toBeCloseTo(0, 8);
    expect(
      result.propertyAndStocks.monthly.every(
        (month) => Math.abs(month.interestSaved) < 1e-8,
      ),
    ).toBe(true);
  });

  it("uses available cash for required costs before optional stock contributions", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 10_000,
      monthlyExternalCashBudget: 200,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 10_000,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        deposit: 10_000,
        monthlyGrossRent: 400,
        offset: {
          initialBalance: 0,
          monthlyDeposit: 50,
          monthlyWithdrawal: 0,
        },
        propertyShares: {
          ...baseInput.property.propertyShares,
          initialInvestment: 0,
          monthlyContribution: 100,
        },
      },
      monthlyAllocationPriority: ["stocks", "offset"],
    });
    const month = result.propertyAndStocks.monthly[0];

    expect(result.propertyAndStocks.feasible).toBe(true);
    expect(month.mortgagePayment).toBeGreaterThan(500);
    expect(month.propertySideStockContribution).toBeLessThan(100);
    expect(month.offsetDeposit).toBe(0);
    expect(month.retainedCashBalance).toBeCloseTo(0, 8);
  });

  it("flags a required-funding shortfall without fabricating later projections", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 10_000,
      monthlyExternalCashBudget: 100,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 10_000,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        deposit: 10_000,
        monthlyGrossRent: 0,
        offset: {
          initialBalance: 0,
          monthlyDeposit: 0,
          monthlyWithdrawal: 0,
        },
        propertyShares: {
          ...baseInput.property.propertyShares,
          initialInvestment: 0,
          monthlyContribution: 500,
        },
      },
    });

    expect(result.propertyAndStocks.feasible).toBe(false);
    expect(result.propertyAndStocks.fundingShortfall).toMatchObject({
      month: 1,
      availableCash: 100,
    });
    expect(result.propertyAndStocks.fundingShortfall?.amount).toBeGreaterThan(0);
    expect(result.propertyAndStocks.monthly).toHaveLength(0);
  });

  it("does not count rental surplus as both shares and retained cash", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 1_000,
      monthlyExternalCashBudget: 0,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 0,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 1_000,
        deposit: 1_000,
        monthlyGrossRent: 100,
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
        rentalSurplusAllocation: "stocks",
      },
    });
    const month = result.propertyAndStocks.monthly[0];

    expect(month.propertySideStockContribution).toBe(100);
    expect(month.rentalSurplusInvestedInStocks).toBe(100);
    expect(month.retainedCashBalance).toBe(0);
    expect(month.cashAvailableBeforeAllocations).toBe(100);
  });

  it("stops mortgage payments and switches allocation after payoff", () => {
    const result = calculateFairComparison({
      ...baseInput,
      startingCapital: 0,
      monthlyExternalCashBudget: 0,
      projectionYears: 2,
      stocks: {
        ...baseInput.stocks,
        initialInvestment: 0,
        monthlyContribution: 0,
      },
      property: {
        ...baseInput.property,
        purchasePrice: 1_200,
        deposit: 0,
        annualMortgageRate: 0,
        mortgageTermYears: 1,
        monthlyGrossRent: 100,
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
        rentalSurplusAllocation: "cash",
        postPayoffAllocation: "stocks",
      },
    });

    expect(result.propertyAndStocks.mortgagePayoffMonth).toBe(12);
    expect(result.propertyAndStocks.monthly[11].mortgagePayment).toBe(100);
    expect(result.propertyAndStocks.monthly[12].mortgagePayment).toBe(0);
    expect(
      result.propertyAndStocks.monthly[12].rentalSurplusInvestedInStocks,
    ).toBe(result.propertyAndStocks.monthly[12].rentReceived);
  });
});
