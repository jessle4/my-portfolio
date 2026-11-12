# Investment Comparison — Implementation Progress

## Milestone status

- [x] M1 — Stocks engine and UI.
- [x] M2 — Mortgage and property engine.
- [x] M3 — Offset and combined investing.
- [x] M4 — Compare Fairly.
- [x] M5 — Dashboard and polish.
- [x] M6 — Scenario analysis and browser-saved assumptions.

## Completed slice: M1 stock calculator

**Completed**

- Added the pure TypeScript `calculateStockInvestmentProjection` function in `src/pages/InvestmentComparison/calculations/stocks.ts`.
- Added annual snapshots for nominal balance, inflation-adjusted balance, cumulative contributions, cumulative fees, and net growth.
- Compounds an effective annual return monthly, applies the equivalent monthly fee to the post-growth balance, and adds fixed contributions at month end.
- Validates finite inputs, non-negative investments, supported return/fee/inflation ranges, a 1–50 year horizon, and numeric overflow.
- Added Vitest coverage in `src/pages/InvestmentComparison/calculations/stocks.test.ts` and an `npm test` script. Vitest was added as a development dependency because the project did not have it.
- Added the stocks-only calculator page in `src/pages/InvestmentComparison/InvestmentComparison.tsx`, connected it to the existing `/investment-comparison` route, and added an Investing navigation link.
- Added editable assumptions, live summary cards, a nominal/inflation-adjusted annual chart, and an accessible annual breakdown table.
- Kept the existing aurora selection behavior; the new route uses the existing pink theme.

**Verification**

- `npm test` — passed, 18 tests.
- `npm run build` — passed.
- `npm run lint` and a targeted ESLint invocation were attempted but stalled without output; they were stopped. Lint status remains unverified.

## Completed slice: M2 mortgage and property engine

**Completed**

- Added `calculateMortgageSchedule` in `src/pages/InvestmentComparison/calculations/mortgage.ts` for fixed-rate principal-and-interest loans, zero-rate loans, extra repayments, payoff timing, and a final payment capped at the remaining amount due.
- Added `calculatePropertyProjection` in `src/pages/InvestmentComparison/calculations/property.ts` for purchase/deposit/financed costs, property value and equity, rent, vacancy, operating costs, management fees, mortgage cash flow, annual summaries, retained rental cash, and out-of-pocket shortfalls.
- Exposed monthly and year-end mortgage/property results so later milestones can add offset handling and the combined portfolio without duplicating this simulation.
- Added mortgage and property boundary/regression tests.

**Model assumptions**

- Mortgage interest uses the BRD's monthly approximation (annual rate / 12); repayments are fixed principal-and-interest, with optional fixed monthly extra repayments.
- Property growth is compounded monthly from the effective annual growth rate. Rent growth is applied at the start of each projection year; vacancy is spread evenly through the year.
- Fixed operating costs are entered as annual amounts and divided evenly by 12. The management fee applies only to rent collected after vacancy.
- Positive rental cash flow accumulates as unallocated retained cash and can cover later shortfalls before external out-of-pocket funding is counted. Offset accounts, tax, and stock investing alongside property remain out of scope for M2.

**Verification**

- `npm test` — passed, 39 tests across 3 files.
- `npm run build` — passed.

## Completed slice: M3 offset and combined investing

**Completed**

- Extended the mortgage installment calculation to apply offset interest savings without reducing mortgage principal by the offset balance.
- Added `calculateCombinedPropertyProjection` in `src/pages/InvestmentComparison/calculations/combined.ts` for offset balances and transactions, mortgage-interest savings and payoff timing, concurrent property-side share investing, and year-by-year combined results.
- Applies recurring offset deposits and withdrawals before monthly interest. Positive rental surplus is routed after debt service to the selected offset, shares, or retained-cash destination; the post-payoff destination is independently configurable.
- Keeps offset cash, retained cash, property equity, and shares distinct in net worth. Rental surplus redirected to offset or shares is not also counted as retained cash or external contribution.
- Rejects offset withdrawals greater than the available opening balance plus that month's deposit, and validates the visible projection horizon.
- Continues the property and mortgage simulation through the loan term to estimate payoff timing and lifetime interest savings, while reporting property-side stock results only through the requested projection horizon.
- Added focused tests for baseline mortgage compatibility, offset timing, surplus routing, post-payoff investing, external-vs-internal contributions, and invalid inputs.

**Model assumptions**

- Offset monthly deposits and withdrawals take effect before that month's interest calculation. Rental surplus is allocated after that month's debt service; surplus routed to offset therefore reduces interest beginning the following month.
- Scheduled mortgage payments continue after the offset reduces interest; offset cash remains a separate asset and does not directly reduce principal.
- If the requested projection is shorter than the mortgage term, offset and rental assumptions are continued through the term solely to estimate mortgage payoff and total interest saved. The displayed monthly and annual share balances stop at the requested horizon.
- This milestone models configurable allocations but does not enforce a shared monthly cash budget; that constraint belongs to M4.

**Verification**

- `npm test` — passed, 49 tests across 4 files.
- `npm run build` — passed.
- `git diff --check` — passed.
- Targeted ESLint did not complete and remains unverified.

## Completed slice: M4 Compare Fairly

**Completed**

- Added `calculateFairComparison` in `src/pages/InvestmentComparison/calculations/fairComparison.ts` to compare stocks-only and property-plus-stocks using the same starting capital, monthly external cash budget, projection horizon, and inflation assumption.
- Constrains stock-only contributions to shared available capital/budget. Uninvested amounts remain cash and are included in net worth.
- Validates the property starting allocation (deposit, purchase costs, initial offset and initial shares) against shared capital; any remainder stays as cash.
- Reconciles property cash monthly from opening retained cash, the shared external budget, rent, and explicit offset withdrawals. Operating expenses and scheduled mortgage payments are funded first; optional extra repayments, offset deposits and property-side stock contributions use only remaining funds.
- Applies a configurable offset/share allocation order, with residual rental or budget surplus routed to offset, shares or cash; a separate destination applies after payoff.
- Stops the property projection at the first required-payment shortfall and reports the available funds, required funds and gap. It does not inject funds or fabricate later results.
- Compares offset interest against a no-offset schedule using the same actual extra repayments.
- Added `calculateCustomComparison` in `src/pages/InvestmentComparison/calculations/customComparison.ts` to run independent M1/M3 assumptions, expose each strategy's external contributions and warn when totals or contribution timing differ.
- Added tests for shared external cash, capital-allocation limits, ledger reconciliation, capped discretionary allocations, shortfalls, rent-surplus accounting, payoff routing, no-offset interest comparisons, and Custom-mode contribution warnings.

**Model assumptions**

- Stocks-only starts with the configured portion of shared capital invested and retains any remainder as cash; its monthly stock contribution cannot exceed the shared budget, and any unused budget remains cash.
- Property-side recurring offset and stock allocations are targets, reduced as needed to fit after mandatory expenses and mortgage payments. Extra repayments are optional and limited to remaining cash after those targets.
- The property ledger treats rent as internal cash, offset withdrawals as transfers, and only starting capital plus the fixed monthly budget as external contributions. An infeasible projection terminates at the first shortfall; its displayed rows include only fully funded months.
- Custom mode requires a shared projection horizon, permits unequal assumptions/contribution schedules, and flags comparability differences without forcing equal budgets.

**Verification**

- `npm test` — passed, 60 tests across 6 files.
- `npm run build` — passed.
- `git diff --check` — passed.
- Targeted ESLint did not complete and remains unverified.

## Completed slice: M5 dashboard and polish

**Completed**

- Replaced the stocks-only page with a dashboard offering Fair and Custom comparison modes while retaining the `/investment-comparison` route and existing site navigation/background behavior.
- Added editable shared assumptions and stock, property, mortgage, rental, offset, and property-side stock inputs.
- Added comparison summary cards, four chart panels, a year-by-year breakdown table, and CSV export.
- Added Fair-mode capital allocation preview and property feasibility, payoff, and out-of-pocket summaries. Custom mode shows comparability warnings when the scenarios use different cash contributions or timing.
- Included property management fees in required property cash, monthly cash flow, annual reporting, and cash-ledger reconciliation. Adjusted the default rent so the default Fair scenario remains feasible with management fees modeled.
- Added accessible chart titles/descriptions and responsive dashboard layout.

**Verification**

- `npm test` — passed, 62 tests across 6 files.
- `npm run build` — passed.
- `git diff --check` — passed.
- The `/investment-comparison` route and its component module returned HTTP 200 in the development server smoke check.
- Targeted ESLint did not complete and remains unverified.

## Completed slice: M6 optional scenario features

**Completed**

- Added Fair-mode downside, base, and upside sensitivity cases, varying stock returns and property growth by 2 percentage points, rental growth by 1 point, and the fixed mortgage rate by 1 point in the opposite direction. Boundary cases are clipped to valid model ranges; infeasible property cases are labeled.
- Added one named browser-local saved scenario with restore support for both Fair and Custom inputs. The page reports storage failures and invalid saved data, and does not upload assumptions.
- Kept the existing inflation-adjusted values and annual CSV export as part of the completed M5 dashboard.
- Updated the dashboard description to reflect that it now includes scenario analysis.

**Explicitly deferred**

- Tax, deductions, capital-gains treatment, and sale-cost estimates are not modeled; a clear disclaimer remains. Individual Australian tax treatment depends on circumstances and needs separate validation before inclusion in projected cash flows.
- Mortgage-rate sensitivity compares distinct fixed-rate cases; it does not simulate a time-varying rate schedule.
- Scenario storage is a single local browser save, not cloud sync or shareable links.

**Verification**

- `npm test` — passed, 66 tests across 8 files.
- `npm run build` — passed.
- `git diff --check` — passed.
- `npm run lint` and targeted ESLint both stalled without output; lint remains unverified.

## Next milestones

- No additional milestone is currently defined.

## Scope and preservation notes

- The requested `docs/investment-comparison-brd.md` path was not present. This slice follows the available detailed BRD at `docs/requirements/investment-comparison-calculator-brd.md`.
- The dashboard covers M1–M6's implemented comparison and scenario features. Tax modeling and true variable mortgage-rate schedules are explicitly deferred.
- Existing Home and Experience pages and the aurora background component were preserved.
- Preserve the pre-existing uncommitted change in `src/pages/Home.tsx`.
- No commits or pushes have been made.
