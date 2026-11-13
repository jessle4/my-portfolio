import { CURRENCY, formatCurrency } from "../utils/formatters";
import { exportAnnualCsv } from "../utils/exportCsv";
import SummaryCard from "../components/SummaryCard";
import ChartPanel from "../components/ChartPanel";
import LineChart from "../components/LineChart";
import type { InvestmentComparisonModel } from "../pages/InvestmentComparison/hooks/useInvestmentComparison";

export default function ResultsSection({
  model,
}: {
  model: InvestmentComparisonModel;
}) {
  const {
    stocks,
    years,
    calculation,
    finalYear,
    fairFeasible,
    propertyYear,
    propertyMonth,
    mortgagePayoffMonth,
    latestOutOfPocket,
    chartYears,
    propertySeries,
  } = model;
  return (
    <section aria-labelledby="results-heading" className="mt-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A45573]">
            shared-budget view
          </p>
          <h2
            id="results-heading"
            className="mt-2 text-2xl font-bold text-[#493841] sm:text-3xl"
          >
            Projection results
          </h2>
        </div>
        {years.length > 0 && (
          <button
            type="button"
            onClick={() => exportAnnualCsv(years)}
            className="rounded-full border border-[#A45573]/30 bg-white/55 px-4 py-2 text-sm font-medium text-[#8F4561] transition hover:bg-[#A45573]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A45573]"
          >
            Download annual CSV
          </button>
        )}
      </div>

      {calculation.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50/90 p-4 text-sm text-red-800"
        >
          {calculation.error}
        </p>
      ) : (
        <>
          {calculation.fair?.propertyAndStocks.fundingShortfall && (
            <div
              role="alert"
              className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950"
            >
              <p className="font-semibold">
                Property strategy is infeasible in month{" "}
                {calculation.fair.propertyAndStocks.fundingShortfall.month}.
              </p>
              <p className="mt-1">
                Required cash{" "}
                {CURRENCY.format(
                  calculation.fair.propertyAndStocks.fundingShortfall
                    .requiredCash,
                )}
                ; available{" "}
                {CURRENCY.format(
                  calculation.fair.propertyAndStocks.fundingShortfall
                    .availableCash,
                )}
                ; shortfall{" "}
                {CURRENCY.format(
                  calculation.fair.propertyAndStocks.fundingShortfall.amount,
                )}
                . No unmodeled funds are added, and property results stop at the
                last fully funded month.
              </p>
            </div>
          )}

          {calculation.fair && !calculation.fair.propertyAndStocks.feasible && (
            <div className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
              <h3 className="text-sm font-medium text-[#806D76]">
                Stocks-only projected net worth at year {stocks.years}
              </h3>
              <p className="mt-2 text-3xl font-semibold text-[#A45573]">
                {CURRENCY.format(
                  calculation.fair.stocksOnly.annual.at(-1)?.netWorth ?? 0,
                )}
              </p>
              <p className="mt-1 text-sm text-[#806D76]">
                Property comparison is incomplete because the shared budget
                cannot meet mandatory costs.
              </p>
            </div>
          )}

          {finalYear && fairFeasible && (
            <section
              aria-label="Investment comparison summary"
              aria-live="polite"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              <SummaryCard
                label={`Stocks-only net worth · year ${finalYear.year}`}
                value={CURRENCY.format(finalYear.stocksNetWorth)}
                detail="Portfolio plus any retained cash"
                accent="pink"
              />
              <SummaryCard
                label={`Property + shares · year ${finalYear.year}`}
                value={formatCurrency(finalYear.propertyNetWorth)}
                detail={
                  propertyYear
                    ? "Property equity + offset + cash + shares"
                    : "No fully funded annual result"
                }
                accent="green"
              />
              <SummaryCard
                label="Net-worth difference"
                value={
                  finalYear.propertyNetWorth === null
                    ? "—"
                    : CURRENCY.format(
                        finalYear.propertyNetWorth - finalYear.stocksNetWorth,
                      )
                }
                detail="Property strategy minus stocks-only"
              />
              <SummaryCard
                label="Property-side shares"
                value={formatCurrency(finalYear.propertyStocks)}
                detail={`Offset balance ${formatCurrency(finalYear.offsetBalance)}`}
              />
              <SummaryCard
                label="Stocks-only external cash"
                value={CURRENCY.format(finalYear.stocksExternalCash)}
                detail="Starting capital + monthly budget or contributions"
              />
              <SummaryCard
                label="Property external cash"
                value={formatCurrency(finalYear.propertyExternalCash)}
                detail="Excludes rent as an external contribution"
              />
              <SummaryCard
                label="Latest rental cash flow"
                value={formatCurrency(propertyMonth?.cashFlow ?? null)}
                detail="Rent less expenses and mortgage payment"
              />
              <SummaryCard
                label="Interest saved by offset"
                value={formatCurrency(
                  calculation.fair?.propertyAndStocks.totalInterestSaved ??
                    null,
                )}
                detail="Modelled over the displayed period"
              />
              <SummaryCard
                label="Mortgage payoff"
                value={
                  mortgagePayoffMonth === 0
                    ? "No mortgage"
                    : mortgagePayoffMonth === null
                      ? "Not in horizon"
                      : `Year ${Math.ceil(mortgagePayoffMonth / 12)}`
                }
                detail={
                  mortgagePayoffMonth && mortgagePayoffMonth > 0
                    ? `Projected month ${mortgagePayoffMonth}`
                    : "Based on the selected assumptions"
                }
              />
              <SummaryCard
                label="Latest monthly out-of-pocket"
                value={formatCurrency(latestOutOfPocket)}
                detail="The comparison stops rather than auto-funding a gap"
              />
            </section>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <ChartPanel title="Net worth comparison">
              <LineChart
                title="Annual net worth comparison"
                description="Stocks-only and property-plus-shares net worth by year. The property series stops where a funding shortfall occurs."
                years={chartYears}
                series={[
                  {
                    label: "Stocks only",
                    color: "#A45573",
                    values: years.map((year) => year.stocksNetWorth),
                  },
                  {
                    label: "Property + shares",
                    color: "#527D60",
                    values: years.map((year) => year.propertyNetWorth),
                  },
                ]}
              />
            </ChartPanel>
            <ChartPanel title="Property value, mortgage and offset">
              <LineChart
                title="Property, mortgage and offset balances"
                description="Annual property value, remaining mortgage, equity and offset balance."
                years={chartYears}
                series={propertySeries}
              />
            </ChartPanel>
            <ChartPanel title="Annual rental cash flow">
              <LineChart
                title="Rental cash flow by year"
                description="Annual rent after vacancy, operating expenses, property management and mortgage payments."
                years={chartYears}
                series={[
                  {
                    label: "Rental cash flow",
                    color: "#7472A8",
                    values: years.map((year) => year.rentalCashFlow),
                  },
                ]}
              />
            </ChartPanel>
            <ChartPanel title="Property-side share portfolio">
              <LineChart
                title="Property-side share balance and contributions"
                description="Annual property-side share balance compared with cumulative contributions."
                years={chartYears}
                series={[
                  {
                    label: "Share balance",
                    color: "#A45573",
                    values: years.map((year) => year.propertyStocks),
                  },
                  {
                    label: "Cumulative contributions",
                    color: "#C58B34",
                    values: years.map(
                      (year) => year.propertyStockContributions,
                    ),
                  },
                ]}
              />
            </ChartPanel>
          </div>

          <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#493841]">
                  Annual breakdown
                </h2>
                <p className="mt-1 text-sm text-[#806D76]">
                  Exact annual values; scroll horizontally on smaller screens.
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1450px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Annual stocks-only and property-plus-shares value,
                  contributions, cash flow, debt and equity
                </caption>
                <thead>
                  <tr className="border-b border-[#E8DDE3] text-xs uppercase tracking-wide text-[#806D76]">
                    {[
                      "Year",
                      "Stocks net worth",
                      "Property net worth",
                      "Property value",
                      "Mortgage",
                      "Offset",
                      "Property equity",
                      "Property shares",
                      "Rent received",
                      "Operating costs",
                      "Management fee",
                      "Mortgage payments",
                      "Rental cash flow",
                      "Stocks external cash",
                      "Property external cash",
                    ].map((heading) => (
                      <th key={heading} scope="col" className="px-3 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {years.map((year) => (
                    <tr
                      key={year.year}
                      className="border-b border-[#E8DDE3]/70 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-3 py-3 font-medium text-[#493841]"
                      >
                        {year.year}
                      </th>
                      {[
                        year.stocksNetWorth,
                        year.propertyNetWorth,
                        year.propertyValue,
                        year.loanBalance,
                        year.offsetBalance,
                        year.propertyEquity,
                        year.propertyStocks,
                        year.rentReceived,
                        year.operatingExpenses,
                        year.propertyManagementFee,
                        year.mortgagePayments,
                        year.rentalCashFlow,
                        year.stocksExternalCash,
                        year.propertyExternalCash,
                      ].map((value, index) => (
                        <td
                          key={`${year.year}-value-${index}`}
                          className="whitespace-nowrap px-3 py-3 text-[#493841]"
                        >
                          {formatCurrency(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
