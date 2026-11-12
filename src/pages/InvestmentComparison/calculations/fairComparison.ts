import {
  calculateMortgageInstallment,
  type MortgageInstallment,
} from "./mortgage";
import {
  calculatePropertyProjection,
  type PropertyInput,
} from "./property";
import {
  calculateStockInvestmentMonth,
  type StockInvestmentMonth,
} from "./stocks";
import type {
  CombinedPropertyInput,
  SurplusAllocation,
} from "./combined";

type FairPropertyInput = Omit<CombinedPropertyInput, "projectionYears">;
type MonthlyAllocation = "offset" | "stocks";

export interface FairStockStrategyInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
}

export interface FairComparisonInput {
  startingCapital: number;
  monthlyExternalCashBudget: number;
  projectionYears: number;
  inflationRate: number;
  stocks: FairStockStrategyInput;
  property: FairPropertyInput;
  monthlyAllocationPriority?: MonthlyAllocation[];
}

export interface FairStocksMonth {
  month: number;
  year: number;
  stockBalance: number;
  cashBalance: number;
  stockContribution: number;
  cumulativeContributions: number;
  cumulativeFees: number;
  cumulativeExternalCash: number;
  netWorth: number;
  inflationAdjustedNetWorth: number;
}

export interface FairStocksYear
  extends Omit<FairStocksMonth, "month" | "stockContribution"> {}

export interface FairPropertyMonth {
  month: number;
  year: number;
  propertyValue: number;
  loanBalance: number;
  propertyEquity: number;
  grossRent: number;
  vacancyAllowance: number;
  rentReceived: number;
  operatingExpenses: number;
  propertyManagementFee: number;
  mortgagePayment: number;
  mortgageExtraPayment: number;
  mortgageInterest: number;
  interestSaved: number;
  openingOffsetBalance: number;
  offsetBalanceForInterest: number;
  offsetWithdrawal: number;
  offsetDeposit: number;
  rentalSurplusToOffset: number;
  offsetBalance: number;
  monthlyExternalCashBudget: number;
  openingRetainedCashBalance: number;
  cashAvailableBeforeAllocations: number;
  propertySideStockContribution: number;
  rentalSurplusInvestedInStocks: number;
  propertySideStockBalance: number;
  retainedCashBalance: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  cumulativeInterestSaved: number;
  cumulativeStockContributions: number;
  cumulativeStockFees: number;
  cumulativeExternalCash: number;
  netWorth: number;
  inflationAdjustedNetWorth: number;
}

export interface FairPropertyYear
  extends Omit<
    FairPropertyMonth,
    "month" | "mortgagePayment" | "cashAvailableBeforeAllocations"
  > {
  mortgagePayments: number;
}

export interface FairFundingShortfall {
  month: number;
  availableCash: number;
  requiredCash: number;
  amount: number;
}

export interface FairPropertyProjection {
  feasible: boolean;
  fundingShortfall: FairFundingShortfall | null;
  loanPrincipal: number;
  initialCashRequired: number;
  unallocatedStartingCash: number;
  scheduledMonthlyMortgagePayment: number;
  baselineMortgagePayoffMonth: number | null;
  mortgagePayoffMonth: number | null;
  totalInterestSaved: number;
  monthly: FairPropertyMonth[];
  annual: FairPropertyYear[];
}

export interface FairComparisonResult {
  startingCapital: number;
  monthlyExternalCashBudget: number;
  projectionYears: number;
  stocksOnly: {
    initialCashBalance: number;
    monthly: FairStocksMonth[];
    annual: FairStocksYear[];
  };
  propertyAndStocks: FairPropertyProjection;
}

const MAX_PROJECTION_YEARS = 50;
const CASH_TOLERANCE = 1e-8;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

function assertNonNegative(name: string, value: number): void {
  assertFinite(name, value);
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative.`);
  }
}

function validateStockStrategy(input: FairStockStrategyInput): void {
  assertNonNegative("Stocks initial investment", input.initialInvestment);
  assertNonNegative("Stocks monthly contribution", input.monthlyContribution);
  assertFinite("Stocks annual return rate", input.annualReturnRate);
  assertFinite("Stocks annual fee rate", input.annualFeeRate);
  if (input.annualReturnRate < -1) {
    throw new RangeError("Stocks annual return rate cannot be below -100%.");
  }
  if (input.annualFeeRate < 0 || input.annualFeeRate >= 1) {
    throw new RangeError(
      "Stocks annual fee rate must be at least 0% and below 100%.",
    );
  }
}

function validateMonthlyAllocationPriority(
  priority: MonthlyAllocation[],
): void {
  if (
    priority.length !== 2 ||
    new Set(priority).size !== 2 ||
    !priority.includes("offset") ||
    !priority.includes("stocks")
  ) {
    throw new RangeError(
      "Monthly allocation priority must include offset and stocks once each.",
    );
  }
}

function validateSurplusAllocation(value: string): void {
  if (value !== "offset" && value !== "stocks" && value !== "cash") {
    throw new RangeError("Surplus allocation must be offset, stocks, or cash.");
  }
}

function annualSum(
  months: FairPropertyMonth[],
  selectValue: (month: FairPropertyMonth) => number,
): number {
  return months.reduce((total, month) => total + selectValue(month), 0);
}

function createStockYears(
  months: FairStocksMonth[],
): FairStocksYear[] {
  const years: FairStocksYear[] = [];
  for (let month = 12; month <= months.length; month += 12) {
    const result = months[month - 1];
    if (!result) {
      throw new Error("Missing monthly stock results for annual summary.");
    }
    const { month: _month, stockContribution: _contribution, ...year } = result;
    years.push(year);
  }
  return years;
}

function createPropertyYears(
  months: FairPropertyMonth[],
): FairPropertyYear[] {
  const years: FairPropertyYear[] = [];
  for (let month = 12; month <= months.length; month += 12) {
    const yearMonths = months.slice(month - 12, month);
    const finalMonth = yearMonths.at(-1);
    if (!finalMonth) {
      throw new Error("Missing monthly property results for annual summary.");
    }
    const {
      month: _month,
      mortgagePayment: _mortgagePayment,
      cashAvailableBeforeAllocations: _cashAvailable,
      ...finalValues
    } = finalMonth;

    years.push({
      ...finalValues,
      mortgagePayments: annualSum(
        yearMonths,
        (result) => result.mortgagePayment,
      ),
      openingRetainedCashBalance:
        yearMonths[0].openingRetainedCashBalance,
      grossRent: annualSum(yearMonths, (result) => result.grossRent),
      vacancyAllowance: annualSum(
        yearMonths,
        (result) => result.vacancyAllowance,
      ),
      rentReceived: annualSum(yearMonths, (result) => result.rentReceived),
      operatingExpenses: annualSum(
        yearMonths,
        (result) => result.operatingExpenses,
      ),
      propertyManagementFee: annualSum(
        yearMonths,
        (result) => result.propertyManagementFee,
      ),
      mortgageExtraPayment: annualSum(
        yearMonths,
        (result) => result.mortgageExtraPayment,
      ),
      mortgageInterest: annualSum(
        yearMonths,
        (result) => result.mortgageInterest,
      ),
      interestSaved: annualSum(yearMonths, (result) => result.interestSaved),
      offsetWithdrawal: annualSum(
        yearMonths,
        (result) => result.offsetWithdrawal,
      ),
      openingOffsetBalance: yearMonths[0].openingOffsetBalance,
      offsetDeposit: annualSum(yearMonths, (result) => result.offsetDeposit),
      rentalSurplusToOffset: annualSum(
        yearMonths,
        (result) => result.rentalSurplusToOffset,
      ),
      monthlyExternalCashBudget: annualSum(
        yearMonths,
        (result) => result.monthlyExternalCashBudget,
      ),
      propertySideStockContribution: annualSum(
        yearMonths,
        (result) => result.propertySideStockContribution,
      ),
      cashFlow: annualSum(yearMonths, (result) => result.cashFlow),
      rentalSurplusInvestedInStocks: annualSum(
        yearMonths,
        (result) => result.rentalSurplusInvestedInStocks,
      ),
      cumulativeCashFlow: finalMonth.cumulativeCashFlow,
      cumulativeInterestSaved: finalMonth.cumulativeInterestSaved,
      cumulativeStockContributions: finalMonth.cumulativeStockContributions,
      cumulativeStockFees: finalMonth.cumulativeStockFees,
      cumulativeExternalCash: finalMonth.cumulativeExternalCash,
      netWorth: finalMonth.netWorth,
      inflationAdjustedNetWorth: finalMonth.inflationAdjustedNetWorth,
    });
  }
  return years;
}

export function calculateFairComparison(
  input: FairComparisonInput,
): FairComparisonResult {
  const {
    startingCapital,
    monthlyExternalCashBudget,
    projectionYears,
    inflationRate,
    stocks,
    property,
  } = input;
  const monthlyAllocationPriority =
    input.monthlyAllocationPriority ?? ["offset", "stocks"];

  assertNonNegative("Starting capital", startingCapital);
  assertNonNegative("Monthly external cash budget", monthlyExternalCashBudget);
  assertFinite("Inflation rate", inflationRate);
  if (inflationRate <= -1) {
    throw new RangeError("Inflation rate must be above -100%.");
  }
  if (
    !Number.isInteger(projectionYears) ||
    projectionYears < 1 ||
    projectionYears > MAX_PROJECTION_YEARS
  ) {
    throw new RangeError(
      `Projection years must be a whole number from 1 to ${MAX_PROJECTION_YEARS}.`,
    );
  }
  validateStockStrategy(stocks);
  validateMonthlyAllocationPriority(monthlyAllocationPriority);
  assertNonNegative(
    "Initial offset balance",
    property.offset.initialBalance,
  );
  assertNonNegative("Monthly offset deposit", property.offset.monthlyDeposit);
  assertNonNegative(
    "Monthly offset withdrawal",
    property.offset.monthlyWithdrawal,
  );
  assertNonNegative(
    "Property-side initial stock investment",
    property.propertyShares.initialInvestment,
  );
  assertNonNegative(
    "Property-side monthly stock contribution",
    property.propertyShares.monthlyContribution,
  );
  assertFinite(
    "Property-side stock return rate",
    property.propertyShares.annualReturnRate,
  );
  assertFinite(
    "Property-side stock fee rate",
    property.propertyShares.annualFeeRate,
  );
  assertFinite(
    "Property-side inflation rate",
    property.propertyShares.inflationRate,
  );
  if (property.propertyShares.annualReturnRate < -1) {
    throw new RangeError(
      "Property-side stock return rate cannot be below -100%.",
    );
  }
  if (
    property.propertyShares.annualFeeRate < 0 ||
    property.propertyShares.annualFeeRate >= 1
  ) {
    throw new RangeError(
      "Property-side stock fee rate must be at least 0% and below 100%.",
    );
  }
  if (property.propertyShares.inflationRate <= -1) {
    throw new RangeError("Inflation rate must be above -100%.");
  }
  validateSurplusAllocation(property.rentalSurplusAllocation);
  validateSurplusAllocation(property.postPayoffAllocation);
  if (stocks.initialInvestment > startingCapital) {
    throw new RangeError(
      "Stocks initial investment cannot exceed the shared starting capital.",
    );
  }
  if (stocks.monthlyContribution > monthlyExternalCashBudget) {
    throw new RangeError(
      "Stocks monthly contribution cannot exceed the shared monthly budget.",
    );
  }
  if (Math.abs(property.propertyShares.inflationRate - inflationRate) > 1e-12) {
    throw new RangeError(
      "Both strategies must use the same inflation assumption in fair mode.",
    );
  }

  const initialPropertyAllocations =
    property.deposit +
    property.upfrontPurchaseCosts +
    property.offset.initialBalance +
    property.propertyShares.initialInvestment;
  assertFinite("Initial property allocations", initialPropertyAllocations);
  if (initialPropertyAllocations > startingCapital) {
    throw new RangeError(
      "Initial property allocations cannot exceed the shared starting capital.",
    );
  }

  const propertyInput: PropertyInput = {
    purchasePrice: property.purchasePrice,
    deposit: property.deposit,
    upfrontPurchaseCosts: property.upfrontPurchaseCosts,
    financedPurchaseCosts: property.financedPurchaseCosts,
    annualMortgageRate: property.annualMortgageRate,
    mortgageTermYears: property.mortgageTermYears,
    extraMonthlyRepayment: property.extraMonthlyRepayment,
    annualPropertyGrowthRate: property.annualPropertyGrowthRate,
    monthlyGrossRent: property.monthlyGrossRent,
    annualRentalGrowthRate: property.annualRentalGrowthRate,
    vacancyWeeksPerYear: property.vacancyWeeksPerYear,
    propertyManagementRate: property.propertyManagementRate,
    annualExpenses: property.annualExpenses,
    projectionYears,
  };
  const basePropertyProjection =
    calculatePropertyProjection(propertyInput);
  const stockMonths: FairStocksMonth[] = [];
  const propertyMonths: FairPropertyMonth[] = [];
  const totalMonths = projectionYears * 12;

  let stockBalance = stocks.initialInvestment;
  let stockCashBalance = startingCapital - stocks.initialInvestment;
  let stockContributions = stocks.initialInvestment;
  let stockFees = 0;

  for (let month = 1; month <= totalMonths; month += 1) {
    const stockMonth: StockInvestmentMonth = calculateStockInvestmentMonth({
      startingBalance: stockBalance,
      monthlyContribution: stocks.monthlyContribution,
      annualReturnRate: stocks.annualReturnRate,
      annualFeeRate: stocks.annualFeeRate,
    });
    stockBalance = stockMonth.endingBalance;
    stockCashBalance +=
      monthlyExternalCashBudget - stocks.monthlyContribution;
    stockContributions += stocks.monthlyContribution;
    stockFees += stockMonth.fee;

    const year = Math.ceil(month / 12);
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const netWorth = stockBalance + stockCashBalance;
    const inflationAdjustedNetWorth = netWorth / inflationFactor;
    const cumulativeExternalCash =
      startingCapital + month * monthlyExternalCashBudget;
    const checkedValues = [
      stockBalance,
      stockCashBalance,
      stockContributions,
      stockFees,
      netWorth,
      inflationAdjustedNetWorth,
      cumulativeExternalCash,
    ];
    if (checkedValues.some((value) => !Number.isFinite(value))) {
      throw new RangeError("The fair comparison exceeds the numeric range.");
    }

    stockMonths.push({
      month,
      year,
      stockBalance,
      cashBalance: stockCashBalance,
      stockContribution: stocks.monthlyContribution,
      cumulativeContributions: stockContributions,
      cumulativeFees: stockFees,
      cumulativeExternalCash,
      netWorth,
      inflationAdjustedNetWorth,
    });
  }

  let loanBalance = basePropertyProjection.loanPrincipal;
  let baselineLoanBalance = basePropertyProjection.loanPrincipal;
  let offsetBalance = property.offset.initialBalance;
  let retainedCashBalance = startingCapital - initialPropertyAllocations;
  let propertyStockBalance = property.propertyShares.initialInvestment;
  let cumulativeCashFlow = 0;
  let cumulativeInterestSaved = 0;
  let cumulativeStockContributions =
    property.propertyShares.initialInvestment;
  let cumulativeStockFees = 0;
  let mortgagePayoffMonth = loanBalance === 0 ? 0 : null;
  let baselineMortgagePayoffMonth =
    baselineLoanBalance === 0 ? 0 : null;
  let fundingShortfall: FairFundingShortfall | null = null;

  for (let month = 1; month <= totalMonths; month += 1) {
    const baseMonth = basePropertyProjection.monthly[month - 1];
    if (!baseMonth) {
      throw new Error("Missing monthly property results for fair comparison.");
    }

    const openingOffsetBalance = offsetBalance;
    if (property.offset.monthlyWithdrawal > openingOffsetBalance) {
      throw new RangeError(
        `Offset withdrawal exceeds available balance in month ${month}.`,
      );
    }
    const offsetAfterWithdrawal =
      openingOffsetBalance - property.offset.monthlyWithdrawal;
    const cashAvailableBeforeAllocations =
      retainedCashBalance +
      monthlyExternalCashBudget +
      baseMonth.rentReceived +
      property.offset.monthlyWithdrawal;
    const isFinalPayment =
      month === property.mortgageTermYears * 12;
    const noOffsetDepositInstallment: MortgageInstallment =
      calculateMortgageInstallment({
        openingBalance: loanBalance,
        annualInterestRate: property.annualMortgageRate,
        scheduledPayment:
          basePropertyProjection.scheduledMonthlyMortgagePayment,
        extraMonthlyRepayment: 0,
        offsetBalance: offsetAfterWithdrawal,
        isFinalPayment,
      });
    const minimumRequiredCash =
      baseMonth.operatingExpenses +
      baseMonth.propertyManagementFee +
      noOffsetDepositInstallment.payment;

    if (cashAvailableBeforeAllocations + CASH_TOLERANCE < minimumRequiredCash) {
      fundingShortfall = {
        month,
        availableCash: cashAvailableBeforeAllocations,
        requiredCash: minimumRequiredCash,
        amount: minimumRequiredCash - cashAvailableBeforeAllocations,
      };
      break;
    }

    let remainingForAllocations = Math.max(
      0,
      cashAvailableBeforeAllocations - minimumRequiredCash,
    );
    let offsetDeposit = 0;
    let monthlyStockContribution = 0;
    for (const allocation of monthlyAllocationPriority) {
      if (allocation === "offset") {
        offsetDeposit = Math.min(
          property.offset.monthlyDeposit,
          remainingForAllocations,
        );
        remainingForAllocations -= offsetDeposit;
      } else {
        monthlyStockContribution = Math.min(
          property.propertyShares.monthlyContribution,
          remainingForAllocations,
        );
        remainingForAllocations -= monthlyStockContribution;
      }
    }

    const offsetBalanceForInterest = offsetAfterWithdrawal + offsetDeposit;
    const scheduledInstallment = calculateMortgageInstallment({
      openingBalance: loanBalance,
      annualInterestRate: property.annualMortgageRate,
      scheduledPayment:
        basePropertyProjection.scheduledMonthlyMortgagePayment,
      extraMonthlyRepayment: 0,
      offsetBalance: offsetBalanceForInterest,
      isFinalPayment,
    });
    const cashAfterScheduledCosts =
      cashAvailableBeforeAllocations -
      baseMonth.operatingExpenses -
      baseMonth.propertyManagementFee -
      offsetDeposit -
      scheduledInstallment.payment -
      monthlyStockContribution;
    const extraRepayment = Math.min(
      property.extraMonthlyRepayment,
      Math.max(0, cashAfterScheduledCosts),
    );
    const mortgageInstallment: MortgageInstallment =
      calculateMortgageInstallment({
        openingBalance: loanBalance,
        annualInterestRate: property.annualMortgageRate,
        scheduledPayment:
          basePropertyProjection.scheduledMonthlyMortgagePayment,
        extraMonthlyRepayment: extraRepayment,
        offsetBalance: offsetBalanceForInterest,
        isFinalPayment,
      });
    const mortgageExtraPayment = Math.max(
      0,
      mortgageInstallment.payment - scheduledInstallment.payment,
    );
    const baselineInstallment = calculateMortgageInstallment({
      openingBalance: baselineLoanBalance,
      annualInterestRate: property.annualMortgageRate,
      scheduledPayment:
        basePropertyProjection.scheduledMonthlyMortgagePayment,
      extraMonthlyRepayment: mortgageExtraPayment,
      offsetBalance: 0,
      isFinalPayment,
    });
    baselineLoanBalance = baselineInstallment.closingBalance;
    if (baselineLoanBalance === 0 && baselineMortgagePayoffMonth === null) {
      baselineMortgagePayoffMonth = month;
    }

    const cashFlow =
      baseMonth.rentReceived -
      baseMonth.operatingExpenses -
      baseMonth.propertyManagementFee -
      mortgageInstallment.payment;
    cumulativeCashFlow += cashFlow;
    loanBalance = mortgageInstallment.closingBalance;
    if (loanBalance === 0 && mortgagePayoffMonth === null) {
      mortgagePayoffMonth = month;
    }
    const allocation: SurplusAllocation =
      loanBalance === 0
        ? property.postPayoffAllocation
        : property.rentalSurplusAllocation;
    const remainingCash =
      cashAvailableBeforeAllocations -
      baseMonth.operatingExpenses -
      baseMonth.propertyManagementFee -
      mortgageInstallment.payment -
      offsetDeposit -
      monthlyStockContribution;
    if (remainingCash < -CASH_TOLERANCE) {
      throw new Error("The property cash ledger did not reconcile.");
    }
    const discretionaryCash = Math.max(0, remainingCash);
    const rentalSurplusToOffset =
      allocation === "offset" ? discretionaryCash : 0;
    const rentalSurplusInvestedInStocks =
      allocation === "stocks" ? discretionaryCash : 0;
    const propertySideStockContribution =
      monthlyStockContribution + rentalSurplusInvestedInStocks;
    const stockMonth = calculateStockInvestmentMonth({
      startingBalance: propertyStockBalance,
      monthlyContribution: propertySideStockContribution,
      annualReturnRate: property.propertyShares.annualReturnRate,
      annualFeeRate: property.propertyShares.annualFeeRate,
    });
    propertyStockBalance = stockMonth.endingBalance;
    cumulativeStockContributions += propertySideStockContribution;
    cumulativeStockFees += stockMonth.fee;

    offsetBalance =
      offsetBalanceForInterest + rentalSurplusToOffset;
    retainedCashBalance =
      allocation === "cash" ? discretionaryCash : 0;
    const interestSaved =
      baselineInstallment.interest - mortgageInstallment.interest;
    cumulativeInterestSaved += interestSaved;
    const propertyEquity = baseMonth.propertyValue - loanBalance;
    const netWorth =
      propertyEquity +
      offsetBalance +
      retainedCashBalance +
      propertyStockBalance;
    const year = Math.ceil(month / 12);
    const inflationFactor = Math.pow(1 + inflationRate, year);
    const inflationAdjustedNetWorth = netWorth / inflationFactor;
    const cumulativeExternalCash =
      startingCapital + month * monthlyExternalCashBudget;
    const checkedValues = [
      cashAvailableBeforeAllocations,
      offsetBalanceForInterest,
      offsetBalance,
      loanBalance,
      cashFlow,
      cumulativeCashFlow,
      cumulativeInterestSaved,
      propertyStockBalance,
      cumulativeStockContributions,
      cumulativeStockFees,
      retainedCashBalance,
      netWorth,
      inflationAdjustedNetWorth,
      cumulativeExternalCash,
    ];
    if (checkedValues.some((value) => !Number.isFinite(value))) {
      throw new RangeError("The fair comparison exceeds the numeric range.");
    }

    propertyMonths.push({
      month,
      year,
      propertyValue: baseMonth.propertyValue,
      loanBalance,
      propertyEquity,
      grossRent: baseMonth.grossRent,
      vacancyAllowance: baseMonth.vacancyAllowance,
      rentReceived: baseMonth.rentReceived,
      operatingExpenses: baseMonth.operatingExpenses,
      propertyManagementFee: baseMonth.propertyManagementFee,
      mortgagePayment: mortgageInstallment.payment,
      mortgageExtraPayment,
      mortgageInterest: mortgageInstallment.interest,
      interestSaved,
      openingOffsetBalance,
      offsetBalanceForInterest,
      offsetWithdrawal: property.offset.monthlyWithdrawal,
      offsetDeposit,
      rentalSurplusToOffset,
      offsetBalance,
      monthlyExternalCashBudget,
      openingRetainedCashBalance: retainedCashBalance,
      cashAvailableBeforeAllocations,
      propertySideStockContribution,
      rentalSurplusInvestedInStocks,
      propertySideStockBalance: propertyStockBalance,
      retainedCashBalance,
      cashFlow,
      cumulativeCashFlow,
      cumulativeInterestSaved,
      cumulativeStockContributions,
      cumulativeStockFees,
      cumulativeExternalCash,
      netWorth,
      inflationAdjustedNetWorth,
    });
  }

  return {
    startingCapital,
    monthlyExternalCashBudget,
    projectionYears,
    stocksOnly: {
      initialCashBalance: startingCapital - stocks.initialInvestment,
      monthly: stockMonths,
      annual: createStockYears(stockMonths),
    },
    propertyAndStocks: {
      feasible: fundingShortfall === null,
      fundingShortfall,
      loanPrincipal: basePropertyProjection.loanPrincipal,
      initialCashRequired: basePropertyProjection.initialCashRequired,
      unallocatedStartingCash: startingCapital - initialPropertyAllocations,
      scheduledMonthlyMortgagePayment:
        basePropertyProjection.scheduledMonthlyMortgagePayment,
      baselineMortgagePayoffMonth,
      mortgagePayoffMonth,
      totalInterestSaved: cumulativeInterestSaved,
      monthly: propertyMonths,
      annual: createPropertyYears(propertyMonths),
    },
  };
}
