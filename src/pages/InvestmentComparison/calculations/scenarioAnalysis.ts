import {
  calculateFairComparison,
  type FairComparisonInput,
} from "./fairComparison";

export type ScenarioKey = "downside" | "base" | "upside";

export interface ScenarioAdjustment {
  annualStockReturn: number;
  annualPropertyGrowth: number;
  annualMortgageRate: number;
  annualRentalGrowth: number;
}

export interface ScenarioAnalysisRow {
  key: ScenarioKey;
  label: string;
  adjustment: ScenarioAdjustment;
  stocksNetWorth: number;
  propertyNetWorth: number | null;
  feasible: boolean;
}

export interface ScenarioAnalysis {
  rows: ScenarioAnalysisRow[];
}

const SCENARIOS: Array<{
  key: ScenarioKey;
  label: string;
  adjustment: ScenarioAdjustment;
}> = [
  {
    key: "downside",
    label: "Downside",
    adjustment: {
      annualStockReturn: -0.02,
      annualPropertyGrowth: -0.02,
      annualMortgageRate: 0.01,
      annualRentalGrowth: -0.01,
    },
  },
  {
    key: "base",
    label: "Base",
    adjustment: {
      annualStockReturn: 0,
      annualPropertyGrowth: 0,
      annualMortgageRate: 0,
      annualRentalGrowth: 0,
    },
  },
  {
    key: "upside",
    label: "Upside",
    adjustment: {
      annualStockReturn: 0.02,
      annualPropertyGrowth: 0.02,
      annualMortgageRate: -0.01,
      annualRentalGrowth: 0.01,
    },
  },
];

export function calculateFairScenarioAnalysis(
  input: FairComparisonInput,
): ScenarioAnalysis {
  const rows = SCENARIOS.map(({ key, label, adjustment }) => {
    const annualStockReturnRate = Math.max(
      -1,
      input.stocks.annualReturnRate + adjustment.annualStockReturn,
    );
    const annualMortgageRate = Math.max(
      0,
      input.property.annualMortgageRate + adjustment.annualMortgageRate,
    );
    const annualPropertyGrowthRate = Math.max(
      -1,
      input.property.annualPropertyGrowthRate +
        adjustment.annualPropertyGrowth,
    );
    const annualRentalGrowthRate = Math.max(
      -1,
      input.property.annualRentalGrowthRate + adjustment.annualRentalGrowth,
    );
    const scenarioInput: FairComparisonInput = {
      ...input,
      stocks: {
        ...input.stocks,
        annualReturnRate: annualStockReturnRate,
      },
      property: {
        ...input.property,
        annualMortgageRate,
        annualPropertyGrowthRate,
        annualRentalGrowthRate,
      },
    };
    const result = calculateFairComparison(scenarioInput);
    const finalStocks = result.stocksOnly.annual.at(-1);
    const finalProperty = result.propertyAndStocks.annual.at(-1);
    if (!finalStocks) {
      throw new Error("Missing annual results for sensitivity scenario.");
    }

    return {
      key,
      label,
      adjustment: {
        annualStockReturn:
          annualStockReturnRate - input.stocks.annualReturnRate,
        annualPropertyGrowth:
          annualPropertyGrowthRate -
          input.property.annualPropertyGrowthRate,
        annualMortgageRate:
          annualMortgageRate - input.property.annualMortgageRate,
        annualRentalGrowth:
          annualRentalGrowthRate - input.property.annualRentalGrowthRate,
      },
      stocksNetWorth: finalStocks.netWorth,
      propertyNetWorth:
        result.propertyAndStocks.feasible && finalProperty
          ? finalProperty.netWorth
          : null,
      feasible: result.propertyAndStocks.feasible,
    };
  });

  return { rows };
}
