import { useMemo, useState } from "react";
import { calculateFairComparison, type FairComparisonInput } from "../calculations/fairComparison";
import type { CombinedPropertyInput } from "../calculations/combined";
import type { StockInvestmentInput } from "../calculations/stocks";
import type { ChartSeries, MonthlyAllocation } from "../InvestmentComparison.types";
import { INITIAL_PROPERTY, INITIAL_STOCKS } from "../InvestmentComparison.defaults";
import { toFairDashboardRows } from "../../../utils/dashboardMappers";

export function useInvestmentComparison() {
  const [startingCapital, setStartingCapital] = useState(50_000);
  const [monthlyBudget, setMonthlyBudget] = useState(1_500);
  const [firstMonthlyAllocation, setFirstMonthlyAllocation] =
    useState<MonthlyAllocation>("offset");
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [property, setProperty] = useState(INITIAL_PROPERTY);

  const fairInput = useMemo<FairComparisonInput>(
    () => ({
      startingCapital,
      monthlyExternalCashBudget: monthlyBudget,
      projectionYears: stocks.years,
      inflationRate: stocks.inflationRate,
      stocks: {
        initialInvestment: stocks.initialInvestment,
        monthlyContribution: stocks.monthlyContribution,
        annualReturnRate: stocks.annualReturnRate,
        annualFeeRate: stocks.annualFeeRate,
      },
      property,
      monthlyAllocationPriority: [
        firstMonthlyAllocation,
        firstMonthlyAllocation === "offset" ? "stocks" : "offset",
      ],
    }),
    [firstMonthlyAllocation, monthlyBudget, property, startingCapital, stocks],
  );

  const calculation = useMemo(() => {
    try {
      const comparison = calculateFairComparison(fairInput);
      return { fair: comparison, error: null as string | null };
    } catch (error) {
      if (error instanceof RangeError) {
        return { fair: null, error: error.message };
      }
      throw error;
    }
  }, [fairInput]);

  const years = useMemo(
    () => calculation.fair ? toFairDashboardRows(calculation.fair) : [],
    [calculation],
  );

  const finalYear = years.at(-1);
  const fairFeasible = calculation.fair?.propertyAndStocks.feasible ?? true;
  const propertyYear = calculation.fair?.propertyAndStocks.annual.at(-1);
  const propertyMonth = calculation.fair?.propertyAndStocks.monthly.at(-1);
  const mortgagePayoffMonth =
    calculation.fair?.propertyAndStocks.mortgagePayoffMonth ?? null;
  const latestOutOfPocket = calculation.fair?.propertyAndStocks.feasible ? 0 : null;
  const propertyInitialAllocation =
    property.deposit +
    property.upfrontPurchaseCosts +
    property.offset.initialBalance +
    property.propertyShares.initialInvestment;

  function updateStock<K extends keyof StockInvestmentInput>(
    key: K,
    value: StockInvestmentInput[K],
  ) {
    setStocks((current) => ({ ...current, [key]: value }));
  }

  function updateProperty<K extends keyof CombinedPropertyInput>(
    key: K,
    value: CombinedPropertyInput[K],
  ) {
    setProperty((current) => ({ ...current, [key]: value }));
  }

  function updateStockRate(
    key: "annualReturnRate" | "annualFeeRate",
    percentage: number,
  ) {
    updateStock(key, percentage / 100);
  }

  function updatePropertyShareRate(
    key: "annualReturnRate" | "annualFeeRate",
    percentage: number,
  ) {
    setProperty((current) => ({
      ...current,
      propertyShares: {
        ...current.propertyShares,
        [key]: percentage / 100,
      },
    }));
  }

  function updateInflation(percentage: number) {
    const rate = percentage / 100;
    setStocks((current) => ({ ...current, inflationRate: rate }));
    setProperty((current) => ({
      ...current,
      propertyShares: { ...current.propertyShares, inflationRate: rate },
    }));
  }

  function updateExpense(
    key: keyof CombinedPropertyInput["annualExpenses"],
    value: number,
  ) {
    setProperty((current) => ({
      ...current,
      annualExpenses: { ...current.annualExpenses, [key]: value },
    }));
  }

  function updateOffset(
    key: keyof CombinedPropertyInput["offset"],
    value: number,
  ) {
    setProperty((current) => ({
      ...current,
      offset: { ...current.offset, [key]: value },
    }));
  }

  function updatePropertyShares(
    key: "initialInvestment" | "monthlyContribution",
    value: number,
  ) {
    setProperty((current) => ({
      ...current,
      propertyShares: { ...current.propertyShares, [key]: value },
    }));
  }

  function updateProjectionYears(value: number) {
    updateStock("years", value);
    updateProperty("projectionYears", value);
  }

  function resetInputs() {
    setStartingCapital(50_000);
    setMonthlyBudget(1_500);
    setFirstMonthlyAllocation("offset");
    setStocks(INITIAL_STOCKS);
    setProperty(INITIAL_PROPERTY);
  }

  const chartYears = years.map((year) => year.year);
  const propertySeries: ChartSeries[] = [
    {
      label: "Property value",
      color: "#A45573",
      values: years.map((year) => year.propertyValue),
    },
    {
      label: "Mortgage balance",
      color: "#C58B34",
      values: years.map((year) => year.loanBalance),
    },
    {
      label: "Property equity",
      color: "#527D60",
      values: years.map((year) => year.propertyEquity),
    },
    {
      label: "Offset",
      color: "#7472A8",
      values: years.map((year) => year.offsetBalance),
    },
  ];

  return {
    startingCapital, setStartingCapital, monthlyBudget, setMonthlyBudget,
    firstMonthlyAllocation, setFirstMonthlyAllocation, stocks, property, calculation,
    years, finalYear, fairFeasible, propertyYear, propertyMonth,
    mortgagePayoffMonth, latestOutOfPocket, propertyInitialAllocation, chartYears, propertySeries,
    updateStock, updateProperty, updateStockRate, updatePropertyShareRate, updateInflation,
    updateExpense, updateOffset, updatePropertyShares, updateProjectionYears, resetInputs,
  };
}

export type InvestmentComparisonModel = ReturnType<typeof useInvestmentComparison>;
