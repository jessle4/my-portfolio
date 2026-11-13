import type { DashboardYear } from "../pages/InvestmentComparison/InvestmentComparison.types";

export function exportAnnualCsv(rows: DashboardYear[]): void {
  const headers = [
    "Year",
    "Stocks net worth",
    "Property plus stocks net worth",
    "Property value",
    "Mortgage balance",
    "Offset balance",
    "Property equity",
    "Property-side stocks",
    "Rent received",
    "Operating expenses",
    "Property management",
    "Mortgage payments",
    "Rental cash flow",
    "Stocks external cash",
    "Property external cash",
  ];
  const values = rows.map((row) =>
    [
      row.year,
      row.stocksNetWorth,
      row.propertyNetWorth,
      row.propertyValue,
      row.loanBalance,
      row.offsetBalance,
      row.propertyEquity,
      row.propertyStocks,
      row.rentReceived,
      row.operatingExpenses,
      row.propertyManagementFee,
      row.mortgagePayments,
      row.rentalCashFlow,
      row.stocksExternalCash,
      row.propertyExternalCash,
    ]
      .map((value) => (value === null ? "" : value))
      .join(","),
  );
  const csv = [headers.join(","), ...values].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "investment-comparison.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
