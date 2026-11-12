import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  calculateCustomComparison,
  type CustomComparisonResult,
} from "./calculations/customComparison";
import {
  calculateFairComparison,
  type FairComparisonInput,
  type FairComparisonResult,
} from "./calculations/fairComparison";
import { calculateFairScenarioAnalysis } from "./calculations/scenarioAnalysis";
import {
  parseSavedScenario,
  serializeSavedScenario,
} from "./calculations/savedScenario";
import {
  type CombinedPropertyInput,
  type SurplusAllocation,
} from "./calculations/combined";
import type { StockInvestmentInput } from "./calculations/stocks";

type ComparisonMode = "fair" | "custom";
type MonthlyAllocation = "offset" | "stocks";

interface DashboardYear {
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

interface ChartSeries {
  label: string;
  color: string;
  values: Array<number | null>;
}

const INITIAL_STOCKS: StockInvestmentInput = {
  initialInvestment: 50_000,
  monthlyContribution: 1_500,
  annualReturnRate: 0.07,
  annualFeeRate: 0.002,
  inflationRate: 0.025,
  years: 10,
};

const INITIAL_PROPERTY: CombinedPropertyInput = {
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
};

const CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const COMPACT_CURRENCY = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const SAVED_SCENARIO_KEY = "investment-comparison.saved-scenario.v1";

function isSurplusAllocation(value: string): value is SurplusAllocation {
  return value === "offset" || value === "stocks" || value === "cash";
}

function formatCurrency(value: number | null): string {
  return value === null ? "—" : CURRENCY.format(value);
}

function toFairDashboardRows(
  result: FairComparisonResult,
): DashboardYear[] {
  const propertyByYear = new Map(
    result.propertyAndStocks.annual.map((year) => [year.year, year]),
  );

  return result.stocksOnly.annual.map((stocks) => {
    const property = propertyByYear.get(stocks.year);
    return {
      year: stocks.year,
      stocksNetWorth: stocks.netWorth,
      stocksPortfolio: stocks.stockBalance,
      stocksCash: stocks.cashBalance,
      stocksExternalCash: stocks.cumulativeExternalCash,
      stocksRealNetWorth: stocks.inflationAdjustedNetWorth,
      propertyNetWorth: property?.netWorth ?? null,
      propertyRealNetWorth: property?.inflationAdjustedNetWorth ?? null,
      propertyValue: property?.propertyValue ?? null,
      loanBalance: property?.loanBalance ?? null,
      propertyEquity: property?.propertyEquity ?? null,
      offsetBalance: property?.offsetBalance ?? null,
      propertyStocks: property?.propertySideStockBalance ?? null,
      propertyStockContributions:
        property?.cumulativeStockContributions ?? null,
      rentReceived: property?.rentReceived ?? null,
      operatingExpenses: property?.operatingExpenses ?? null,
      propertyManagementFee: property?.propertyManagementFee ?? null,
      mortgagePayments: property?.mortgagePayments ?? null,
      rentalCashFlow: property?.cashFlow ?? null,
      propertyExternalCash: property?.cumulativeExternalCash ?? null,
    };
  });
}

function toCustomDashboardRows(
  result: CustomComparisonResult,
): DashboardYear[] {
  const propertyByYear = new Map(
    result.property.annual.map((year) => [year.year, year]),
  );

  return result.stocks.map((stocks) => {
    const property = propertyByYear.get(stocks.year);
    return {
      year: stocks.year,
      stocksNetWorth: stocks.nominalBalance,
      stocksPortfolio: stocks.nominalBalance,
      stocksCash: 0,
      stocksExternalCash: stocks.cumulativeContributions,
      stocksRealNetWorth: stocks.inflationAdjustedBalance,
      propertyNetWorth: property?.netWorth ?? null,
      propertyRealNetWorth: property?.inflationAdjustedNetWorth ?? null,
      propertyValue: property?.propertyValue ?? null,
      loanBalance: property?.loanBalance ?? null,
      propertyEquity: property?.propertyEquity ?? null,
      offsetBalance: property?.offsetBalance ?? null,
      propertyStocks: property?.propertySideStockBalance ?? null,
      propertyStockContributions:
        property?.cumulativeStockContributions ?? null,
      rentReceived: property?.rentReceived ?? null,
      operatingExpenses: property?.operatingExpenses ?? null,
      propertyManagementFee: property?.propertyManagementFee ?? null,
      mortgagePayments: property?.mortgagePayments ?? null,
      rentalCashFlow: property?.cashFlow ?? null,
      propertyExternalCash: property?.cumulativeExternalCash ?? null,
    };
  });
}

function buildPath(
  values: Array<number | null>,
  indexCount: number,
  minimum: number,
  maximum: number,
): string {
  const left = 96;
  const right = 724;
  const top = 20;
  const bottom = 236;
  const range = maximum - minimum || 1;
  const denominator = Math.max(indexCount - 1, 1);
  let shouldMove = true;
  const commands: string[] = [];

  values.forEach((value, index) => {
    if (value === null) {
      shouldMove = true;
      return;
    }
    const x = left + (index / denominator) * (right - left);
    const y = bottom - ((value - minimum) / range) * (bottom - top);
    commands.push(`${shouldMove ? "M" : "L"} ${x} ${y}`);
    shouldMove = false;
  });

  return commands.join(" ");
}

function LineChart({
  title,
  description,
  years,
  series,
}: {
  title: string;
  description: string;
  years: number[];
  series: ChartSeries[];
}) {
  const chartId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const values = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );

  if (values.length === 0) {
    return (
      <p className="rounded-xl bg-white/45 p-4 text-sm text-[#806D76]">
        No funded property projection is available for this chart.
      </p>
    );
  }

  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const range = maximum - minimum || 1;
  const ticks = Array.from({ length: 5 }, (_, index) =>
    minimum + (range * index) / 4,
  );
  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((years.length - 1) / 2),
      Math.max(years.length - 1, 0),
    ]),
  ];

  return (
    <div>
      <svg
        viewBox="0 0 760 270"
        role="img"
        aria-labelledby={`${chartId}-title ${chartId}-description`}
        className="h-auto w-full overflow-visible"
      >
        <title id={`${chartId}-title`}>{title}</title>
        <desc id={`${chartId}-description`}>{description}</desc>
        {ticks.map((value, index) => {
          const y = 236 - (index / 4) * (236 - 20);
          return (
            <g key={`${title}-tick-${index}`}>
              <line
                x1="96"
                x2="724"
                y1={y}
                y2={y}
                stroke="#E8DDE3"
                strokeDasharray="4 6"
              />
              <text
                x="86"
                y={y + 4}
                textAnchor="end"
                className="fill-[#806D76] text-[11px]"
              >
                {COMPACT_CURRENCY.format(value)}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <g key={item.label}>
            <path
              d={buildPath(item.values, years.length, minimum, maximum)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {item.values.map((value, index) => {
              if (value === null) {
                return null;
              }
              const x =
                96 +
                (index / Math.max(years.length - 1, 1)) * (724 - 96);
              const y =
                236 - ((value - minimum) / range) * (236 - 20);
              return (
                <circle
                  key={`${item.label}-${years[index]}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={item.color}
                >
                  <title>
                    {`Year ${years[index]} · ${item.label}: ${CURRENCY.format(value)}`}
                  </title>
                </circle>
              );
            })}
          </g>
        ))}
        {labelIndexes.map((index) => (
          <text
            key={`${title}-year-${index}`}
            x={96 + (index / Math.max(years.length - 1, 1)) * (724 - 96)}
            y="260"
            textAnchor="middle"
            className="fill-[#806D76] text-xs"
          >
            Year {years[index]}
          </text>
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B6375]">
        {series.map((item) => (
          <li key={`${title}-${item.label}`} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-5"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  min,
  max,
  step,
  help,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  help: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-3 text-sm font-medium text-[#493841]"
      >
        <span>{label}</span>
        <span className="shrink-0 text-xs font-normal text-[#806D76]">
          {unit}
        </span>
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={`${id}-help`}
        onChange={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;
          onChange(Number.isNaN(nextValue) ? 0 : nextValue);
        }}
        className="mt-2 w-full rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[#493841] shadow-sm outline-none transition focus:border-[#A45573] focus:ring-2 focus:ring-[#A45573]/20"
      />
      <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-[#806D76]">
        {help}
      </p>
    </div>
  );
}

function SelectField({
  id,
  label,
  help,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#493841]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 w-full rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[#493841] shadow-sm outline-none transition focus:border-[#A45573] focus:ring-2 focus:ring-[#A45573]/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p id={`${id}-help`} className="mt-1 text-xs leading-relaxed text-[#806D76]">
        {help}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "pink" | "green" | "neutral";
}) {
  const valueColor =
    accent === "pink"
      ? "text-[#A45573]"
      : accent === "green"
        ? "text-[#365B47]"
        : "text-[#493841]";

  return (
    <article className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl">
      <h3 className="text-sm font-medium text-[#806D76]">{label}</h3>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-[#806D76]">{detail}</p>
    </article>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
      <h2 className="text-lg font-semibold text-[#493841]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function exportAnnualCsv(rows: DashboardYear[]): void {
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

export default function InvestmentComparison() {
  const [mode, setMode] = useState<ComparisonMode>("fair");
  const [startingCapital, setStartingCapital] = useState(50_000);
  const [monthlyBudget, setMonthlyBudget] = useState(1_500);
  const [firstMonthlyAllocation, setFirstMonthlyAllocation] =
    useState<MonthlyAllocation>("offset");
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [property, setProperty] = useState(INITIAL_PROPERTY);
  const [savedScenarioName, setSavedScenarioName] = useState("My scenario");
  const [savedScenarioMessage, setSavedScenarioMessage] = useState("");

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
    [
      firstMonthlyAllocation,
      monthlyBudget,
      property,
      startingCapital,
      stocks,
    ],
  );

  const calculation = useMemo(() => {
    try {
      if (mode === "fair") {
        const comparison = calculateFairComparison(fairInput);
        return { mode, fair: comparison, custom: null, error: null };
      }

      const comparison = calculateCustomComparison({ stocks, property });
      return { mode, fair: null, custom: comparison, error: null };
    } catch (error) {
      if (error instanceof RangeError) {
        return { mode, fair: null, custom: null, error: error.message };
      }
      throw error;
    }
  }, [
    fairInput,
    mode,
    property,
    stocks,
  ]);

  const scenarioAnalysis = useMemo(
    () =>
      mode === "fair" && !calculation.error
        ? calculateFairScenarioAnalysis(fairInput)
        : null,
    [calculation.error, fairInput, mode],
  );

  const years = useMemo(() => {
    if (calculation.fair) {
      return toFairDashboardRows(calculation.fair);
    }
    if (calculation.custom) {
      return toCustomDashboardRows(calculation.custom);
    }
    return [];
  }, [calculation]);

  const finalYear = years.at(-1);
  const fairFeasible = calculation.fair?.propertyAndStocks.feasible ?? true;
  const propertyYear = calculation.fair?.propertyAndStocks.annual.at(-1)
    ?? calculation.custom?.property.annual.at(-1);
  const propertyMonth = calculation.fair?.propertyAndStocks.monthly.at(-1)
    ?? calculation.custom?.property.monthly.at(-1);
  const mortgagePayoffMonth =
    calculation.fair?.propertyAndStocks.mortgagePayoffMonth ??
    calculation.custom?.property.mortgagePayoffMonth ??
    null;
  const latestOutOfPocket =
    calculation.custom?.property.monthly.at(-1)?.outOfPocket ??
    (calculation.fair?.propertyAndStocks.feasible ? 0 : null);
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
    setMode("fair");
    setStartingCapital(50_000);
    setMonthlyBudget(1_500);
    setFirstMonthlyAllocation("offset");
    setStocks(INITIAL_STOCKS);
    setProperty(INITIAL_PROPERTY);
  }

  function saveScenario() {
    try {
      window.localStorage.setItem(
        SAVED_SCENARIO_KEY,
        serializeSavedScenario({
          name: savedScenarioName.trim() || "Saved scenario",
          mode,
          startingCapital,
          monthlyBudget,
          firstMonthlyAllocation,
          stocks,
          property,
        }),
      );
      setSavedScenarioMessage("Scenario saved in this browser.");
    } catch {
      setSavedScenarioMessage(
        "Could not save this scenario. Check browser storage settings.",
      );
    }
  }

  function loadScenario() {
    try {
      const serialized = window.localStorage.getItem(SAVED_SCENARIO_KEY);
      if (serialized === null) {
        setSavedScenarioMessage("There is no saved scenario in this browser.");
        return;
      }
      const saved = parseSavedScenario(serialized);
      if (saved === null) {
        setSavedScenarioMessage(
          "The saved scenario is invalid or unsupported. Save a new scenario to replace it.",
        );
        return;
      }
      setMode(saved.mode);
      setStartingCapital(saved.startingCapital);
      setMonthlyBudget(saved.monthlyBudget);
      setFirstMonthlyAllocation(saved.firstMonthlyAllocation);
      setStocks(saved.stocks);
      setProperty(saved.property);
      setSavedScenarioName(saved.name);
      setSavedScenarioMessage(`Loaded "${saved.name}".`);
    } catch {
      setSavedScenarioMessage(
        "Could not load the saved scenario. Check browser storage settings.",
      );
    }
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

  return (
    <motion.section
      className="mx-auto max-w-7xl px-6 pb-20 pt-4"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A45573]">
          stocks vs property · comparison dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#493841] sm:text-5xl">
          compare your investment paths
        </h1>
        <p className="mt-4 text-lg text-[#6B6375]">
          Compare a stocks-only plan with a rental property and shares, including
          the mortgage, offset account and the cash each path uses.
        </p>
      </header>

      <form
        aria-label="Investment comparison assumptions"
        onSubmit={(event) => event.preventDefault()}
        className="mt-8 space-y-5"
      >
        <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#493841]">
                Comparison setup
              </h2>
              <p className="mt-1 text-sm text-[#806D76]">
                Amounts are in AUD. Results update as assumptions change.
              </p>
            </div>
            <button
              type="button"
              onClick={resetInputs}
              className="rounded-full border border-[#A45573]/30 px-4 py-2 text-sm font-medium text-[#8F4561] transition hover:bg-[#A45573]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A45573]"
            >
              Reset assumptions
            </button>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-[#493841]">
              Comparison mode
            </legend>
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/80 bg-white/65 px-4 py-3 text-sm text-[#493841]">
                <input
                  type="radio"
                  name="comparison-mode"
                  value="fair"
                  checked={mode === "fair"}
                  onChange={() => setMode("fair")}
                  className="accent-[#A45573]"
                />
                Compare fairly
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/80 bg-white/65 px-4 py-3 text-sm text-[#493841]">
                <input
                  type="radio"
                  name="comparison-mode"
                  value="custom"
                  checked={mode === "custom"}
                  onChange={() => setMode("custom")}
                  className="accent-[#A45573]"
                />
                Custom
              </label>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#806D76]">
              {mode === "fair"
                ? "Both strategies use the same starting capital, monthly cash budget, horizon and inflation assumption."
                : "Set each strategy independently. Different contributions or timing can make outcomes less comparable."}
            </p>
          </fieldset>

          <div className="mt-5 grid gap-3 rounded-2xl bg-white/40 p-4 sm:grid-cols-[minmax(12rem,1fr)_auto_auto] sm:items-end">
            <div>
              <label
                htmlFor="saved-scenario-name"
                className="block text-sm font-medium text-[#493841]"
              >
                Browser-saved scenario
              </label>
              <input
                id="saved-scenario-name"
                type="text"
                maxLength={60}
                value={savedScenarioName}
                onChange={(event) =>
                  setSavedScenarioName(event.currentTarget.value)
                }
                className="mt-2 w-full rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[#493841] shadow-sm outline-none focus:border-[#A45573] focus:ring-2 focus:ring-[#A45573]/20"
              />
            </div>
            <button
              type="button"
              onClick={saveScenario}
              className="rounded-full border border-[#A45573]/30 px-4 py-3 text-sm font-medium text-[#8F4561] transition hover:bg-[#A45573]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A45573]"
            >
              Save current
            </button>
            <button
              type="button"
              onClick={loadScenario}
              className="rounded-full border border-[#527D60]/30 px-4 py-3 text-sm font-medium text-[#365B47] transition hover:bg-[#527D60]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#527D60]"
            >
              Load saved
            </button>
            <p
              aria-live="polite"
              className="text-xs leading-relaxed text-[#806D76] sm:col-span-3"
            >
              {savedScenarioMessage ||
                "One named scenario is stored locally in this browser; it is not uploaded."}
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {mode === "fair" && (
              <>
                <NumberField
                  id="starting-capital"
                  label="Starting available capital"
                  unit="AUD"
                  min={0}
                  step={1_000}
                  value={startingCapital}
                  help="Shared initial funds for both strategies."
                  onChange={setStartingCapital}
                />
                <NumberField
                  id="monthly-budget"
                  label="Monthly external cash budget"
                  unit="AUD / month"
                  min={0}
                  step={100}
                  value={monthlyBudget}
                  help="The same new cash is available to each strategy each month."
                  onChange={setMonthlyBudget}
                />
              </>
            )}
            <NumberField
              id="projection-years"
              label="Projection horizon"
              unit="years"
              min={1}
              max={50}
              step={1}
              value={stocks.years}
              help="Choose between 1 and 50 whole years."
              onChange={updateProjectionYears}
            />
            <NumberField
              id="inflation"
              label="Inflation assumption"
              unit="% / year"
              min={-99.99}
              step={0.1}
              value={stocks.inflationRate * 100}
              help="Used to show estimated values in today's dollars."
              onChange={updateInflation}
            />
          </div>
          {mode === "fair" && (
            <p className="mt-4 rounded-xl bg-white/45 p-4 text-xs leading-relaxed text-[#6B6375]">
              Starting cash left uninvested: stocks{" "}
              {CURRENCY.format(startingCapital - stocks.initialInvestment)};
              property{" "}
              {CURRENCY.format(startingCapital - propertyInitialAllocation)}.
              Uninvested monthly stocks budget:{" "}
              {CURRENCY.format(monthlyBudget - stocks.monthlyContribution)}.
              Property starting allocations include the deposit, upfront costs,
              initial offset and initial shares.
            </p>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold text-[#493841]">
              Stocks-only strategy
            </h2>
            <p className="mt-1 text-sm text-[#806D76]">
              {mode === "fair"
                ? "Uninvested shared cash stays in the stocks strategy as cash."
                : "These contributions are independent of the property strategy."}
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="stocks-initial"
                label="Initial stock investment"
                unit="AUD"
                min={0}
                step={1_000}
                value={stocks.initialInvestment}
                help={
                  mode === "fair"
                    ? "Cannot exceed starting capital; the remainder stays as cash."
                    : "Amount invested at the start."
                }
                onChange={(value) => updateStock("initialInvestment", value)}
              />
              <NumberField
                id="stocks-monthly"
                label="Monthly stock contribution"
                unit="AUD / month"
                min={0}
                step={50}
                value={stocks.monthlyContribution}
                help={
                  mode === "fair"
                    ? "Cannot exceed the shared budget; the remainder stays as cash."
                    : "Added at the end of each month."
                }
                onChange={(value) => updateStock("monthlyContribution", value)}
              />
              <NumberField
                id="stocks-return"
                label="Expected annual total return"
                unit="% / year"
                min={-100}
                step={0.1}
                value={stocks.annualReturnRate * 100}
                help="A constant assumption, not a forecast."
                onChange={(value) =>
                  updateStockRate("annualReturnRate", value)
                }
              />
              <NumberField
                id="stocks-fees"
                label="Annual investment fees"
                unit="% / year"
                min={0}
                max={99.99}
                step={0.01}
                value={stocks.annualFeeRate * 100}
                help="Applied proportionally across each month."
                onChange={(value) => updateStockRate("annualFeeRate", value)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold text-[#493841]">
              Property purchase and mortgage
            </h2>
            <p className="mt-1 text-sm text-[#806D76]">
              The loan is purchase price minus deposit plus financed costs.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="purchase-price"
                label="Purchase price"
                unit="AUD"
                min={1}
                step={10_000}
                value={property.purchasePrice}
                help="The property's starting market value."
                onChange={(value) => updateProperty("purchasePrice", value)}
              />
              <NumberField
                id="property-deposit"
                label="Deposit"
                unit="AUD"
                min={0}
                step={1_000}
                value={property.deposit}
                help="Must not exceed the purchase price."
                onChange={(value) => updateProperty("deposit", value)}
              />
              <NumberField
                id="purchase-costs"
                label="Upfront purchase costs"
                unit="AUD"
                min={0}
                step={500}
                value={property.upfrontPurchaseCosts}
                help="Initial cash costs, such as legal or transaction costs."
                onChange={(value) =>
                  updateProperty("upfrontPurchaseCosts", value)
                }
              />
              <NumberField
                id="financed-purchase-costs"
                label="Financed purchase costs"
                unit="AUD"
                min={0}
                step={500}
                value={property.financedPurchaseCosts}
                help="Added to the mortgage principal."
                onChange={(value) =>
                  updateProperty("financedPurchaseCosts", value)
                }
              />
              <NumberField
                id="mortgage-rate"
                label="Mortgage interest rate"
                unit="% / year"
                min={0}
                step={0.1}
                value={property.annualMortgageRate * 100}
                help="Fixed annual rate; interest is approximated monthly."
                onChange={(value) =>
                  updateProperty("annualMortgageRate", value / 100)
                }
              />
              <NumberField
                id="mortgage-term"
                label="Mortgage term"
                unit="years"
                min={1}
                max={50}
                step={1}
                value={property.mortgageTermYears}
                help="Choose a whole number from 1 to 50 years."
                onChange={(value) =>
                  updateProperty("mortgageTermYears", value)
                }
              />
              <NumberField
                id="extra-repayment"
                label="Extra mortgage repayment"
                unit="AUD / month"
                min={0}
                step={50}
                value={property.extraMonthlyRepayment}
                help="In Fair mode, this is capped by cash remaining after required costs."
                onChange={(value) =>
                  updateProperty("extraMonthlyRepayment", value)
                }
              />
              <NumberField
                id="property-growth"
                label="Property growth"
                unit="% / year"
                min={-100}
                step={0.1}
                value={property.annualPropertyGrowthRate * 100}
                help="A constant annual assumption."
                onChange={(value) =>
                  updateProperty("annualPropertyGrowthRate", value / 100)
                }
              />
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold text-[#493841]">
              Rental income and costs
            </h2>
            <p className="mt-1 text-sm text-[#806D76]">
              Operating expenses are annual amounts spread evenly across months.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="monthly-rent"
                label="Monthly gross rent"
                unit="AUD / month"
                min={0}
                step={50}
                value={property.monthlyGrossRent}
                help="Entered before vacancy and property management."
                onChange={(value) => updateProperty("monthlyGrossRent", value)}
              />
              <NumberField
                id="rental-growth"
                label="Annual rental growth"
                unit="% / year"
                min={-100}
                step={0.1}
                value={property.annualRentalGrowthRate * 100}
                help="Applied at the start of each projection year."
                onChange={(value) =>
                  updateProperty("annualRentalGrowthRate", value / 100)
                }
              />
              <NumberField
                id="vacancy-weeks"
                label="Vacancy"
                unit="weeks / year"
                min={0}
                max={52}
                step={0.5}
                value={property.vacancyWeeksPerYear}
                help="Applied as an annual reduction to scheduled rent."
                onChange={(value) =>
                  updateProperty("vacancyWeeksPerYear", value)
                }
              />
              <NumberField
                id="management-rate"
                label="Property management"
                unit="% of rent"
                min={0}
                max={100}
                step={0.1}
                value={property.propertyManagementRate * 100}
                help="Charged on rent collected after vacancy."
                onChange={(value) =>
                  updateProperty("propertyManagementRate", value / 100)
                }
              />
              {(
                [
                  ["strata", "Strata / owners corporation"],
                  ["councilRates", "Council rates"],
                  ["waterRates", "Water rates"],
                  ["insurance", "Insurance"],
                  ["maintenance", "Maintenance"],
                  ["other", "Other costs"],
                ] as const
              ).map(([key, label]) => (
                <NumberField
                  key={key}
                  id={`expense-${key}`}
                  label={label}
                  unit="AUD / year"
                  min={0}
                  step={100}
                  value={property.annualExpenses[key]}
                  help="Included as an ongoing operating expense."
                  onChange={(value) => updateExpense(key, value)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <h2 className="text-xl font-semibold text-[#493841]">
              Offset and property-side shares
            </h2>
            <p className="mt-1 text-sm text-[#806D76]">
              Fair mode counts initial offset cash and shares toward starting
              capital. Monthly targets are limited by available cash.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <NumberField
                id="initial-offset"
                label="Initial offset cash"
                unit="AUD"
                min={0}
                step={500}
                value={property.offset.initialBalance}
                help="A separate asset; it reduces interest, not principal."
                onChange={(value) => updateOffset("initialBalance", value)}
              />
              <NumberField
                id="monthly-offset-deposit"
                label="Monthly offset deposit target"
                unit="AUD / month"
                min={0}
                step={50}
                value={property.offset.monthlyDeposit}
                help="Applied before monthly interest when funds allow."
                onChange={(value) => updateOffset("monthlyDeposit", value)}
              />
              <NumberField
                id="monthly-offset-withdrawal"
                label="Monthly offset withdrawal"
                unit="AUD / month"
                min={0}
                step={50}
                value={property.offset.monthlyWithdrawal}
                help="Transferred to cash before that month's interest."
                onChange={(value) => updateOffset("monthlyWithdrawal", value)}
              />
              <NumberField
                id="property-shares-initial"
                label="Initial property-side shares"
                unit="AUD"
                min={0}
                step={500}
                value={property.propertyShares.initialInvestment}
                help="Invested at the start of the property strategy."
                onChange={(value) =>
                  updatePropertyShares("initialInvestment", value)
                }
              />
              <NumberField
                id="property-shares-monthly"
                label="Monthly property-side shares target"
                unit="AUD / month"
                min={0}
                step={50}
                value={property.propertyShares.monthlyContribution}
                help="Funded from cash remaining after required costs."
                onChange={(value) =>
                  updatePropertyShares("monthlyContribution", value)
                }
              />
              <NumberField
                id="property-shares-return"
                label="Property-side share return"
                unit="% / year"
                min={-100}
                step={0.1}
                value={property.propertyShares.annualReturnRate * 100}
                help="Can differ from the stocks-only assumption."
                onChange={(value) =>
                  updatePropertyShareRate("annualReturnRate", value)
                }
              />
              <NumberField
                id="property-shares-fees"
                label="Property-side share fees"
                unit="% / year"
                min={0}
                max={99.99}
                step={0.01}
                value={property.propertyShares.annualFeeRate * 100}
                help="Applied proportionally across each month."
                onChange={(value) =>
                  updatePropertyShareRate("annualFeeRate", value)
                }
              />
              {mode === "fair" && (
                <SelectField
                  id="monthly-priority"
                  label="Fund this monthly target first"
                  help="When cash is limited, this target is funded before the other."
                  value={firstMonthlyAllocation}
                  options={[
                    { value: "offset", label: "Offset deposits" },
                    { value: "stocks", label: "Property-side shares" },
                  ]}
                  onChange={(value) => {
                    if (value === "offset" || value === "stocks") {
                      setFirstMonthlyAllocation(value);
                    }
                  }}
                />
              )}
              <SelectField
                id="rental-surplus-allocation"
                label="Rental surplus allocation"
                help="Where remaining cash goes while a mortgage remains."
                value={property.rentalSurplusAllocation}
                options={[
                  { value: "offset", label: "Offset" },
                  { value: "stocks", label: "Property-side shares" },
                  { value: "cash", label: "Retained cash" },
                ]}
                onChange={(value) => {
                  if (isSurplusAllocation(value)) {
                    updateProperty("rentalSurplusAllocation", value);
                  }
                }}
              />
              <SelectField
                id="post-payoff-allocation"
                label="Post-payoff allocation"
                help="Where remaining cash goes after the mortgage is repaid."
                value={property.postPayoffAllocation}
                options={[
                  { value: "offset", label: "Offset / cash" },
                  { value: "stocks", label: "Property-side shares" },
                  { value: "cash", label: "Retained cash" },
                ]}
                onChange={(value) => {
                  if (isSurplusAllocation(value)) {
                    updateProperty("postPayoffAllocation", value);
                  }
                }}
              />
            </div>
          </section>
        </div>
      </form>

      <section
        aria-labelledby="results-heading"
        className="mt-10 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A45573]">
              {mode === "fair" ? "shared-budget view" : "independent scenarios"}
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
                  )}; available{" "}
                  {CURRENCY.format(
                    calculation.fair.propertyAndStocks.fundingShortfall
                      .availableCash,
                  )}; shortfall{" "}
                  {CURRENCY.format(
                    calculation.fair.propertyAndStocks.fundingShortfall.amount,
                  )}
                  . No unmodeled funds are added, and property results stop at
                  the last fully funded month.
                </p>
              </div>
            )}
            {calculation.custom?.warning && (
              <p
                role="status"
                className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950"
              >
                {calculation.custom.warning} Stocks-only external cash:{" "}
                {CURRENCY.format(
                  calculation.custom.stocksExternalCashContributed,
                )}
                . Property strategy external cash:{" "}
                {CURRENCY.format(
                  calculation.custom.propertyExternalCashContributed,
                )}
                .
              </p>
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

            {finalYear && (fairFeasible || calculation.custom) && (
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
                          finalYear.propertyNetWorth -
                            finalYear.stocksNetWorth,
                        )
                  }
                  detail={
                    mode === "fair"
                      ? "Property strategy minus stocks-only"
                      : "Custom inputs may not be comparable"
                  }
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
                    calculation.fair
                      ? calculation.fair.propertyAndStocks.totalInterestSaved
                      : propertyYear?.cumulativeInterestSaved ?? null,
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
                  detail={
                    mode === "fair"
                      ? "Fair mode stops rather than auto-funding a gap"
                      : "Funding beyond modeled retained cash"
                  }
                />
              </section>
            )}

            {scenarioAnalysis && (
              <section
                aria-labelledby="scenario-analysis-heading"
                className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7"
              >
                <h3
                  id="scenario-analysis-heading"
                  className="text-xl font-semibold text-[#493841]"
                >
                  Fair-mode sensitivity scenarios
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#806D76]">
                  Illustrative fixed-rate cases around your current assumptions:
                  stock return and property growth vary by 2 percentage points,
                  rent growth by 1 point, and mortgage rate by 1 point in the
                  opposite direction. These are not forecasts or time-varying
                  rate simulations.
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Downside, base, and upside sensitivity results using
                      current fair-mode inputs
                    </caption>
                    <thead>
                      <tr className="border-b border-[#E8DDE3] text-xs uppercase tracking-wide text-[#806D76]">
                        {[
                          "Scenario",
                          "Stock return",
                          "Property growth",
                          "Mortgage rate",
                          "Rental growth",
                          "Stocks net worth",
                          "Property + shares",
                        ].map((heading) => (
                          <th key={heading} scope="col" className="px-3 py-3">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioAnalysis.rows.map((scenario) => {
                        const adjustments = scenario.adjustment;
                        const sign = (value: number) =>
                          value > 0 ? "+" : value < 0 ? "−" : "";
                        return (
                          <tr
                            key={scenario.key}
                            className="border-b border-[#E8DDE3]/70 last:border-0"
                          >
                            <th
                              scope="row"
                              className="whitespace-nowrap px-3 py-3 font-medium text-[#493841]"
                            >
                              {scenario.label}
                              {!scenario.feasible && " · infeasible"}
                            </th>
                            <td className="whitespace-nowrap px-3 py-3">
                              {sign(adjustments.annualStockReturn)}
                              {(adjustments.annualStockReturn * 100).toFixed(0)}
                              pp
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {sign(adjustments.annualPropertyGrowth)}
                              {(adjustments.annualPropertyGrowth * 100).toFixed(0)}
                              pp
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {sign(adjustments.annualMortgageRate)}
                              {(adjustments.annualMortgageRate * 100).toFixed(0)}
                              pp
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {sign(adjustments.annualRentalGrowth)}
                              {(adjustments.annualRentalGrowth * 100).toFixed(0)}
                              pp
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {CURRENCY.format(scenario.stocksNetWorth)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              {formatCurrency(scenario.propertyNetWorth)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <div className="grid gap-5 xl:grid-cols-2">
              <ChartPanel title="Net worth comparison">
                <LineChart
                  title="Annual net worth comparison"
                  description="Stocks-only and property-plus-shares net worth by year. The property series stops where a fair-mode funding shortfall occurs."
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

      <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-relaxed text-[#806D76]">
        Illustrative projections only; assumptions are not forecasts or
        guarantees and this tool does not provide financial advice. Returns and
        property growth are modeled as constant. Tax, sale costs, transaction
        costs beyond the entered purchase costs, and individual lending
        suitability are not modeled.
      </p>
    </motion.section>
  );
}
