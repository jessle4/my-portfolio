import { CURRENCY } from "../utils/formatters";
import NumberField from "../components/NumberField";
import SelectField from "../components/SelectField";
import type { SurplusAllocation } from "../pages/InvestmentComparison/calculations/combined";
import type { InvestmentComparisonModel } from "../pages/InvestmentComparison/hooks/useInvestmentComparison";

function isSurplusAllocation(value: string): value is SurplusAllocation {
  return value === "offset" || value === "stocks" || value === "cash";
}

export default function AssumptionsForm({
  model,
}: {
  model: InvestmentComparisonModel;
}) {
  const {
    startingCapital,
    setStartingCapital,
    monthlyBudget,
    setMonthlyBudget,
    firstMonthlyAllocation,
    setFirstMonthlyAllocation,
    stocks,
    property,
    propertyInitialAllocation,
    resetInputs,
    updateStock,
    updateProperty,
    updateStockRate,
    updatePropertyShareRate,
    updateInflation,
    updateExpense,
    updateOffset,
    updatePropertyShares,
    updateProjectionYears,
  } = model;
  return (
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

        <p className="mt-5 text-xs leading-relaxed text-[#806D76]">
          Both strategies use the same starting capital, monthly cash budget,
          horizon and inflation assumption.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
            label="Monthly contribution"
            unit="AUD / month"
            min={0}
            step={100}
            value={monthlyBudget}
            help="The same new cash is available to each strategy each month."
            onChange={setMonthlyBudget}
          />
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
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
          <h2 className="text-xl font-semibold text-[#493841]">
            Stocks-only strategy
          </h2>
          <p className="mt-1 text-sm text-[#806D76]">
            Uninvested shared cash stays in the stocks strategy as cash.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <NumberField
              id="stocks-initial"
              label="Initial stock investment"
              unit="AUD"
              min={0}
              step={1_000}
              value={stocks.initialInvestment}
              help="Cannot exceed starting capital; the remainder stays as cash."
              onChange={(value) => updateStock("initialInvestment", value)}
            />
            <NumberField
              id="stocks-monthly"
              label="Monthly stock contribution"
              unit="AUD / month"
              min={0}
              step={50}
              value={stocks.monthlyContribution}
              help="Cannot exceed the shared budget; the remainder stays as cash."
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
              onChange={(value) => updateStockRate("annualReturnRate", value)}
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
              onChange={(value) => updateProperty("mortgageTermYears", value)}
            />
            <NumberField
              id="extra-repayment"
              label="Extra mortgage repayment"
              unit="AUD / month"
              min={0}
              step={50}
              value={property.extraMonthlyRepayment}
              help="Capped by cash remaining after required costs."
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
              onChange={(value) => updateProperty("vacancyWeeksPerYear", value)}
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
            Initial offset cash and shares count toward starting capital.
            Monthly targets are limited by available cash.
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
  );
}
