Business Requirements Document (BRD)
Stocks vs Property — Investment Comparison Simulator
Status: Draft 1.0
Product: Personal portfolio interactive project
Platform: React, TypeScript, Tailwind CSS, Motion
Primary users: Australian retail investors exploring hypothetical long-term investment outcomes
Purpose: Educational scenario modelling, not personal financial advice

1. Executive summary
   Create a responsive, interactive calculator that compares two strategies over a user-selected investment horizon:

- Strategy A — Stocks only: Invest available starting capital and make ongoing contributions to a diversified stock portfolio.
- Strategy B — Property + Stocks: Purchase a rental property, finance it with a mortgage, receive rental income, pay property expenses, maintain an offset account, and invest surplus funds into stocks at the same time.
  The application must visualise annual net worth, property equity, outstanding debt, stock portfolio value, rental cash flow, and the effect of mortgage payoff. Users should be able to switch between a Compare Fairly mode and a flexible Custom mode.

2. Goals and non-goals
   Goals
1. Make compounding, leverage, mortgage amortisation and rental cash flow understandable.
1. Compare investments using consistent assumptions and transparent accounting.
1. Show the opportunity cost of committing capital and monthly cash to a property.
1. Show how offset balances and mortgage payoff affect interest and retained rental income.
1. Offer year-by-year visualisations and downloadable results.
1. Keep all inputs editable, results reproducible and assumptions visible.
   Non-goals for MVP

- Predicting real market returns or property prices.
- Providing personalised financial advice or investment recommendations.
- Live brokerage, mortgage, property-listing or bank integrations.
- Fully accurate individual Australian tax returns.
- Automated property valuation.

3. Target user journeys
1. Stocks-only projection: Enter starting capital, monthly investment and annual return; inspect annual accumulated value.
1. Rental property projection: Enter purchase price, deposit, loan rate, rent, expenses and offset; inspect loan payoff, cash flow and equity.
1. Combined investing: Own a rental property while making stock investments, including redirecting surplus rental income after payoff.
1. Fair comparison: Enter a shared initial capital and shared monthly external cash budget; compare strategies without silently injecting extra money into either one.
1. Sensitivity analysis: Change interest rates, stock returns, property growth or rent and observe outcomes.
1. Page design and information architecture
   The page should match the portfolio's soft, modern design, using pastel pink/sage accents, glass cards, rounded controls and responsive charts.
   Suggested layout
   ┌──────────────────────────────────────────────────────────────────┐
   │ investing, visualised ✧ │
   │ Stocks vs Property — What could your money grow into? │
   ├──────────────────────────────────────────────────────────────────┤
   │ [ Compare Fairly: ON ● ] [ Scenario: Base ▼ ] [ Reset ] │
   │ Shared capital [$50,000] Monthly cash [$1,500] Years [30] │
   ├────────────────────────────┬─────────────────────────────────────┤
   │ STOCKS ONLY │ PROPERTY + STOCKS │
   │ Initial investment │ Purchase price / deposit / costs │
   │ Monthly contribution │ Rate / term / rent / expenses │
   │ Annual return / fees │ Offset / stock contributions │
   ├────────────────────────────┴─────────────────────────────────────┤
   │ Net worth: Stocks [$...] Property + Stocks [$...] │
   │ [ Interactive net-worth comparison chart ] │
   ├────────────────────────────┬─────────────────────────────────────┤
   │ Mortgage balance / equity │ Rental cash flow / payoff marker │
   ├────────────────────────────┴─────────────────────────────────────┤
   │ Property-side stock portfolio / yearly breakdown / CSV export │
   │ Assumptions, limitations, methodology and disclaimer │
   └──────────────────────────────────────────────────────────────────┘
   On mobile, the two strategy input panels should stack vertically; charts should remain legible and support tooltips.
1. Business requirements
   ID Requirement Priority
   BR-01 Model stocks-only and property-plus-stocks over a configurable horizon Must
   BR-02 Accept initial capital, monthly contributions and expected stock returns Must
   BR-03 Calculate monthly compounding and annual portfolio balances Must
   BR-04 Calculate property acquisition costs, mortgage schedule and equity Must
   BR-05 Calculate rent, vacancy, recurring expenses and monthly cash flow Must
   BR-06 Model offset account contributions, withdrawals and interest savings Must
   BR-07 Show cash flow and stock-investment opportunities after mortgage payoff Must
   BR-08 Allow stock investing concurrently with property ownership Must
   BR-09 Provide annual charts, summary metrics and downloadable breakdown Must
   BR-10 Provide a Compare Fairly toggle with budget-conserving allocation rules Must
   BR-11 Show assumptions, cash shortfalls and feasibility warnings Must
   BR-12 Model rent growth, property growth, vacancy and optional extra repayments Should
   BR-13 Include optional Australian tax, inflation and sale-cost modelling Should
   BR-14 Save/share scenarios and compare pessimistic/base/optimistic cases Could

1. Functional requirements and input fields
   6.1 Shared scenario controls
   Field Type Example Validation
   Compare Fairly Toggle On On/Off
   Investment horizon Integer years 30 1–50
   Starting available capital AUD $50,000 ≥ 0
   Monthly external cash budget AUD/month $1,500 ≥ 0
   Inflation assumption %/year 2.5% Explicit bounds
   Scenario preset Select Base Optional

6.2 Stocks-only inputs
Field Example Notes
Initial stock investment $50,000 Auto-allocated in fair mode
Monthly stock contribution $1,500 Auto-allocated in fair mode
Expected annual total return 7% Specify nominal/effective convention
Annual investment fees 0.2% Applied consistently
Dividends reinvested Yes Return model must avoid double-counting dividends

Outputs: annual stock value, cumulative external contributions, growth, fees, nominal and inflation-adjusted balances.
6.3 Property purchase and mortgage inputs
Field Example Notes
Purchase price $500,000 Positive amount
Deposit $50,000 Must not exceed purchase price
Stamp duty / legal / purchase costs User entered Initial cash outflow
Lenders mortgage insurance Optional Include if financed or paid upfront
Loan principal Derived Price minus deposit plus financed costs
Mortgage rate 6.0% p.a. Fixed for MVP; variable later
Loan term 30 years Principal & interest for MVP
Property growth 3% p.a. May be negative
Extra mortgage repayments $0/month Subject to budget constraints

Outputs: required repayment, principal repaid, interest paid, outstanding loan, estimated payoff month, property value and equity.
6.4 Rental income and property expenses
Field Example Notes
Monthly gross rent $2,200 Specify gross before deductions
Annual rental growth 3% Applied at consistent intervals
Vacancy 2 weeks/year Reduce effective rent
Strata / owners corporation $4,500/year Annual expense
Council rates $1,500/year Annual expense
Water rates $900/year Annual expense
Insurance $700/year Annual expense
Property management 7% of collected rent Avoid applying to vacant periods
Maintenance $1,500/year Annual reserve/expense
Other expenses User entered Optional

Outputs: effective rent collected, expenses, mortgage payments, cash-flow surplus/shortfall, annual cash flow and cumulative cash out-of-pocket.
6.5 Offset account
Field Example Notes
Initial offset cash $10,000 Counts toward starting capital in fair mode
Monthly offset deposits $300 Budget-constrained in fair mode
Monthly offset withdrawals $0 Cannot exceed available offset cash
Interest calculation Daily or monthly approximation MVP uses documented monthly approximation

Outputs: offset balance, interest-bearing mortgage balance, cumulative interest saved, payoff-date change and offset cash included in net worth.
6.6 Stock investing alongside property
Field Example Notes
Initial property-side stock investment $5,000 Counts toward starting capital in fair mode
Monthly property-side stock contribution $500 Residual after required cash obligations in fair mode
Stock annual return / fees 7% / 0.2% Can mirror or differ from Strategy A
Post-payoff allocation Stocks / offset / cash Redirect freed-up cash explicitly
Positive rental surplus allocation Stocks / offset / cash No implicit reinvestment

Outputs: property-side stock portfolio, total invested, growth and contribution history. 7. Compare Fairly toggle — critical specification
7.1 Behaviour when ON (default)
Both strategies must use the same starting available capital, the same external monthly cash budget, the same investment horizon, and consistent inflation assumptions. Property financing is allowed but the borrowed amount must be visible and included as debt. The application must not silently assume that one strategy receives additional external money.

Strategy A — Stocks only

- Allocate starting capital to stocks, unless the user explicitly chooses to retain cash.
- Invest the shared monthly external cash budget in stocks.
- Apply investment returns and fees each month.
  Strategy B — Property + Stocks
- Allocate starting capital among property deposit, upfront acquisition costs, initial offset cash, initial stocks and any unallocated cash.
- Enforce: deposit + upfrontCosts + initialOffset + initialStocks + retainedCash <= startingCapital.
- Receive rent as an internal cash inflow (not additional external contribution).
- Pay property expenses and required mortgage payments from rent plus the shared external cash budget.
- Allocate remaining available cash to stocks, offset or retained cash according to user-defined priorities.
- Do not invest cash already used for mortgage payments, expenses or offset deposits.
- Carry forward unspent cash and offset cash in net worth.
- On mortgage payoff, stop required mortgage payments and allocate freed cash using the chosen rule.
  Budget conservation: for each month, cash inflows, cash outflows and ending cash balances must reconcile. A strategy with insufficient cash to meet mandatory payments must show a visible funding shortfall / infeasible scenario, not quietly allow negative cash or inject extra funds.

Fairness nuance: equal external contributions do not make the risk or liquidity identical. The UI must explain leverage, concentration, transaction costs and liquidity differences. A comparison should report ending net worth, cash flow, invested external capital and risk caveats, rather than automatically declaring a winner.
7.2 Behaviour when OFF (Custom mode)

- Allow separate initial stock investments, property deposit, offset cash and monthly contribution amounts.
- Allow monthly external contributions to differ between strategies.
- Display each strategy's total external cash invested prominently.
- Show a warning when comparing outcomes with different capital contributions.
- Continue enforcing valid cash accounting within each strategy; never double-count funds.
  7.3 Suggested interface copy
  Compare Fairly — “Use the same starting cash and monthly out-of-pocket budget for both strategies.”

Custom mode — “Set each strategy independently. Results may reflect different amounts of money contributed.”
7.4 Acceptance tests for fair comparison

1. With identical starting capital and no property purchase, both strategies produce identical stock outcomes when assumptions match.
2. Initial property allocations cannot exceed shared starting capital.
3. Offset deposits reduce available cash and increase offset assets by the same amount.
4. Rent received cannot be counted both as invested surplus and as retained cash.
5. Negative rental cash flow consumes monthly budget before any stock contribution.
6. A mandatory payment shortfall is explicitly flagged and not auto-funded.
7. After mortgage payoff, no further scheduled mortgage payments occur.
8. In Custom mode, the dashboard shows unequal external contribution totals and warns about comparability.
9. Calculation rules
   8.1 Stocks
   Use monthly time steps. If r_annual is an effective annual growth rate, monthly growth is:

r_monthly = (1 + r_annual)^(1/12) - 1

Document whether fees are applied before or after investment growth and whether contributions occur at the start or end of each month. Use one convention consistently (recommend end-of-month contributions).

stockEnd = stockStart \* (1 + r_monthly_net) + contribution

Negative returns must be supported within valid mathematical bounds.
8.2 Mortgage
For a fixed-rate principal-and-interest loan:

monthlyRate = annualMortgageRate / 12

scheduledPayment = principal \* monthlyRate / (1 - (1 + monthlyRate)^(-termMonths))

For a zero-interest loan: scheduledPayment = principal / termMonths.

Each month:

1. interestBearingBalance = max(0, loanStart - offsetBalance).
2. interest = interestBearingBalance \* monthlyRate (documented monthly approximation).
3. actualPayment = min(scheduledPayment + extraPayment, loanStart + interest).
4. principalPaid = actualPayment - interest.
5. loanEnd = max(0, loanStart - principalPaid).
   Offset cash is not deducted from principal; it is a separate asset. If the offset exceeds the loan, interest is zero but loan principal remains until repaid. Model offset deposit/withdrawal timing consistently.
   8.3 Property value and equity
   propertyValueEnd = propertyValueStart \* (1 + monthlyPropertyGrowth)

propertyEquity = propertyValueEnd - loanEnd

Show property equity separately from offset cash and stocks.
8.4 Rental cash flow
effectiveRent = scheduledRent - vacancyAllowance

operatingCashFlow = effectiveRent - propertyOperatingExpenses

cashFlowAfterDebtService = operatingCashFlow - mortgagePayment

Mortgage principal is a cash outflow but also increases equity; mortgage interest is a financing cost. Do not treat principal repayment as an economic loss when calculating net worth.

After loan payoff, mortgagePayment = 0, but operating costs and potential taxes remain.
8.5 Net worth
Stocks only: stockPortfolio + retainedCash - anyModelledLiabilities

Property + Stocks: propertyValue - outstandingMortgage + propertySideStocks + offsetCash + retainedCash - otherModelledLiabilities

Report nominal net worth and optionally inflation-adjusted net worth. If selling costs or taxes are not included, label the result before selling costs and taxes.
8.6 Simulation and reconciliation
Run a deterministic month-by-month simulation for both strategies. Record monthly cash flow and balances; aggregate snapshots at each year-end. Validate these invariants:

- Loan balance never negative.
- Offset cash and retained cash never negative unless explicitly modelling debt.
- External contributions are recorded once.
- Assets and liabilities are not double-counted.
- Starting capital allocation reconciles.
- Every monthly cash ledger reconciles to opening cash + inflows − outflows = closing cash.

9. Dashboard outputs
   Summary cards

- Final stocks-only net worth.
- Final property-plus-stocks net worth.
- Difference between strategies (nominal and optional real dollars).
- Property equity, property-side stocks and offset cash.
- Property cash-flow status (positive/negative) and monthly out-of-pocket amount.
- Mortgage payoff year and interest saved by offset.
- Total external contributions per strategy.
  Charts

1. Net-worth comparison: Stocks only vs Property + Stocks by year.
2. Mortgage and equity: Outstanding loan, property equity and offset balance.
3. Rental cash flow: Monthly/annual cash-flow surplus or shortfall, with break-even and payoff markers.
4. Property-side stock growth: Contributions vs investment gains while owning property.
5. Net-worth composition: Property equity, offset, stocks and cash stacked by year (optional).
   Yearly breakdown
   Columns: year, stock-only value, property value, mortgage balance, offset, property equity, property-side stock value, rent received, property expenses, mortgage payments, net rental cash flow, cumulative external contributions and total net worth.

Provide CSV export in MVP if practical. 10. Advanced assumptions and disclosures
Potential later enhancements:

- Australian stamp duty by state, LMI, land tax, sale agent fees and legal costs.
- Income tax on net rental income, deductions, depreciation and negative gearing.
- Capital gains tax on realisation; discount eligibility depends on circumstances.
- Dividend income and franking credits.
- Interest-rate changes, rent growth, vacancy shocks and special strata levies.
- Property appreciation and stock returns as scenario ranges rather than guaranteed outcomes.
- Sensitivity heatmap and breakeven analysis.
  Include an always-visible educational disclaimer: “Illustrative projections only. Assumptions are not forecasts. Tax treatment and borrowing suitability depend on individual circumstances. This tool does not provide financial advice.”

11. Non-functional requirements

- Responsive design, keyboard accessibility, accessible labels and readable chart alternatives.
- Immediate recalculation for ordinary inputs; debounce only where needed.
- Deterministic results from identical inputs.
- Pure calculation functions separated from UI components.
- No sensitive personal or financial account information required.
- No backend needed for MVP; local storage for saved scenarios if implemented.
- Clear error states for invalid inputs and infeasible funding.
- Unit tests for calculation boundaries and regression fixtures.

12. Proposed code architecture
    src/pages/InvestmentComparison/
    InvestmentComparison.tsx
    InvestmentComparison.types.ts
    InvestmentComparison.defaults.ts
    components/
    SharedBudget.tsx
    FairComparisonToggle.tsx
    StocksInputs.tsx
    PropertyInputs.tsx
    OffsetInputs.tsx
    ComparisonSummary.tsx
    WealthChart.tsx
    CashFlowChart.tsx
    YearlyBreakdown.tsx
    calculations/
    stocks.ts
    mortgage.ts
    property.ts
    cashLedger.ts
    simulate.ts
    compare.ts
    tests/
    stocks.test.ts
    mortgage.test.ts
    fairComparison.test.ts
    simulate.test.ts
    Recommended packages: recharts, lucide-react, zod, and vitest; reuse existing React, TypeScript, Tailwind and Motion.
13. Delivery milestones
    M1 — Stocks engine and UI

- Stocks inputs, monthly compound-growth engine, annual chart, unit tests.
  M2 — Mortgage and property engine
- Loan amortisation, rent and expenses, property value/equity, cash flow, unit tests.
  M3 — Offset and combined investing
- Offset account, interest savings, stock investing alongside property, payoff behaviour.
  M4 — Compare Fairly
- Shared budgets, cash allocation, cash ledger reconciliation, shortfall detection, Custom mode.
  M5 — Dashboard and polish
- Comparison charts, summary cards, yearly breakdown, responsive styling, accessibility, validation and documentation.
  M6 — Optional advanced features
- Taxes, inflation, variable rates, scenarios, saving and exports.

14. Definition of done

- All Must requirements implemented or explicitly documented as deferred.
- npm run build, lint and tests pass.
- Financial logic tested against independent examples and boundary cases.
- Fair mode passes the eight acceptance tests in §7.4.
- No silent funding injections, cash double-counting or negative mortgage balances.
- Charts and summary values agree with the yearly breakdown.
- User can understand assumptions and see when scenarios are infeasible.
- Page works on mobile and desktop.
  Implementation Guide — Ralph Wiggum Loop with GitHub Copilot CLI
  A. What a Ralph loop means
  A Ralph Wiggum loop is an iterative agent workflow: repeatedly provide the coding agent with the task, project state and feedback; have it make a small change; run checks; and repeat until explicit acceptance criteria are met. The term is used for several community implementations, so there is no single universal Copilot CLI command called ralph.

For this project, prefer a supervised, bounded loop. Do not let the agent run unlimited iterations or change unrelated portfolio files.
B. Set up the repository
From your portfolio root:
mkdir -p docs
cp investment-comparison-brd.md docs/investment-comparison-brd.md
npm install recharts lucide-react zod
npm install -D vitest
Commit the BRD before coding:
git checkout -b feature/investment-comparison
git add docs/investment-comparison-brd.md
git commit -m "docs: add investment comparison BRD"
Create a tracking file docs/investment-comparison-progress.md with milestone checkboxes and current blockers. The agent should update this file at the end of each iteration.
C. Start a supervised Ralph-style iteration in Copilot CLI
Run copilot from the portfolio root. Paste the following prompt. Use it once per iteration, reviewing the result before requesting another iteration:
You are implementing docs/investment-comparison-brd.md in my existing
React + TypeScript + Tailwind portfolio.

Follow a bounded Ralph-style development loop:

1. Read the BRD and docs/investment-comparison-progress.md.
2. Choose the earliest incomplete milestone (M1 through M5).
3. Implement only one small, testable slice of that milestone.
4. Add or update Vitest tests for all financial calculations changed.
5. Run available tests, lint, and build; fix failures caused by this slice.
6. Update the progress file with files changed, tests run, results,
   remaining tasks, and any assumptions.
7. Stop and give me a concise summary. Do not begin the next slice.

Hard constraints:

- Preserve the existing Home and Experience pages and their aurora themes.
- Keep calculations in pure TypeScript functions, separate from React.
- No silent cash injections, double counting, or negative loan balances.
- Compare Fairly must use equal starting capital and external monthly budget.
- Mark infeasible scenarios rather than pretending they are funded.
- Do not invent financial formulas; document assumptions and edge cases.
- Do not install new packages without explaining why.
- Do not commit or push unless I explicitly approve.
- Do not claim completion if checks fail.

Start with the first unfinished slice and stop after verifying it.
At the end of the iteration, inspect the diff and results. Then tell Copilot:
Continue the next Ralph iteration using the BRD and progress file.
Implement one small testable slice, run checks, update progress, then stop.
Repeat until the Definition of Done is satisfied.
D. Optional automation
You can automate repeated invocations using a wrapper script only after confirming the installed Copilot CLI version's documented non-interactive flags and approval controls. Do not assume a --prompt, --allow-all-tools, or /ralph option exists on every version. Inspect copilot --help first. Keep a maximum iteration count, command timeouts, a restricted file scope and an explicit stop condition based on test results plus human review.

A safer first approach is the manual loop above: one prompt, one implementation slice, one review.
E. Suggested iteration order

1. Define types, default inputs and validated return conventions.
2. Implement and test stock compounding.
3. Build stocks-only input controls and chart.
4. Implement and test zero-interest and ordinary mortgage amortisation.
5. Implement rent, expenses and vacancy cash flow.
6. Implement offset and early payoff behaviour.
7. Implement property-side stocks.
8. Implement the shared cash ledger and Compare Fairly allocation.
9. Implement infeasible funding warnings and Custom mode.
10. Build summary cards, comparison charts and yearly table.
11. Run cross-checks, accessibility checks and responsive polish.
    F. Independent numerical checks
    Before accepting agent-written code, verify at least:

- Stocks: zero growth means ending = initial + monthlyContribution \* months.
- Stocks: no contributions means standard compound growth.
- Mortgage: zero rate yields principal divided by number of payments.
- Mortgage: final payment does not exceed remaining principal plus interest.
- Offset: increasing offset cannot increase mortgage interest under otherwise identical assumptions.
- Offset: moving $1 from cash to offset changes allocation, not net worth at that instant.
- Fairness: external capital and monthly cash budgets match between strategies.
- Cash: no dollar is simultaneously spent on mortgage, offset and stocks.
- Property: after payoff, principal and interest payments are zero, but expenses continue.
- Yearly totals: charts, cards and tables all derive from the same simulation result.
  G. Recommended agent guardrails
- Run on a dedicated feature branch and keep commits small.
- Review changes to package.json, routing and configuration.
- Require tests before marking any financial milestone complete.
- Cap iteration count and token spend; check Copilot usage and billing separately.
- Never allow the agent to execute destructive commands or push to production without approval.
- Prefer deterministic test fixtures over checking a graph by eye.
  Success condition: a polished portfolio page whose calculations are independently testable, whose cash flows reconcile, and whose fair comparison is genuinely comparable—not merely two attractive lines on a chart.
