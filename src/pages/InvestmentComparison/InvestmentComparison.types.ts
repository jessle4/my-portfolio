export type ComparisonMode = "fair" | "custom";

export type MonthlyAllocation = "offset" | "stocks";

export interface DashboardYear {
  year: number;

  stocksNetWorth: number;
  stocksPortfolio: number;
  stocksCash: number;
  stocksExternalCash: number;
  stocksRealNetWorth: number;

  propertyNetWorth: number | null;
  propertyRealNetWorth: number | null;
  propertyValue: number | null;
  loanBalance: number | null;
  propertyEquity: number | null;
  offsetBalance: number | null;
  propertyStocks: number | null;
  propertyStockContributions: number | null;

  rentReceived: number | null;
  operatingExpenses: number | null;
  propertyManagementFee: number | null;
  mortgagePayments: number | null;
  rentalCashFlow: number | null;
  propertyExternalCash: number | null;
}

export interface ChartSeries {
  label: string;
  color: string;
  values: Array<number | null>;
}
