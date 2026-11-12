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

export type SurplusAllocation = "offset" | "stocks" | "cash";

export interface OffsetAccountInput {
  initialBalance: number;
  monthlyDeposit: number;
  monthlyWithdrawal: number;
}

export interface PropertyShareInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  inflationRate: number;
}

export interface CombinedPropertyInput extends PropertyInput {
  offset: OffsetAccountInput;
  propertyShares: PropertyShareInput;
  rentalSurplusAllocation: SurplusAllocation;
  postPayoffAllocation: SurplusAllocation;
}

export interface CombinedPropertyMonth {
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
  mortgageInterest: number;
  interestBearingMortgageBalance: number;
  principalRepaid: number;
  openingOffsetBalance: number;
  offsetBalanceForInterest: number;
  offsetDeposit: number;
  offsetWithdrawal: number;
  rentalSurplusToOffset: number;
  offsetBalance: number;
  interestSaved: number;
  cumulativeInterestSaved: number;
  cashFlow: number;
  retainedCashBalance: number;
  outOfPocket: number;
  cumulativeCashFlow: number;
  cumulativeOutOfPocket: number;
  propertySideStockContribution: number;
  rentalSurplusInvestedInStocks: number;
  propertySideStockBalance: number;
  cumulativeStockContributions: number;
  cumulativeExternalStockContributions: number;
  cumulativeStockFees: number;
  cumulativeRentalSurplusInvestedInStocks: number;
  stockNetGrowth: number;
  inflationAdjustedStockBalance: number;
  cumulativeExternalCash: number;
  netWorth: number;
  inflationAdjustedNetWorth: number;
}

export interface CombinedPropertyYear
  extends Omit<CombinedPropertyMonth, "month" | "mortgagePayment"> {
  mortgagePayments: number;
}

export interface CombinedPropertyProjection {
  loanPrincipal: number;
  initialCashRequired: number;
  initialOffsetBalance: number;
  initialPropertySideStockInvestment: number;
  scheduledMonthlyMortgagePayment: number;
  baselineMortgagePayoffMonth: number | null;
  mortgagePayoffMonth: number | null;
  totalInterestSavedOverLoan: number;
  monthly: CombinedPropertyMonth[];
  annual: CombinedPropertyYear[];
}

const MAX_PROJECTION_YEARS = 50;

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

function assertAllocation(value: string): asserts value is SurplusAllocation {
  if (value !== "offset" && value !== "stocks" && value !== "cash") {
    throw new RangeError("Surplus allocation must be offset, stocks, or cash.");
  }
}

function annualSum(
  months: CombinedPropertyMonth[],
  selectValue: (month: CombinedPropertyMonth) => number,
): number {
  return months.reduce((total, month) => total + selectValue(month), 0);
}

function calculateExternalCash(
  property: PropertyInput,
  offset: OffsetAccountInput,
  cumulativeOffsetDeposits: number,
  cumulativeExternalStockContributions: number,
  cumulativeOutOfPocket: number,
): number {
  return (
    property.deposit +
    property.upfrontPurchaseCosts +
    offset.initialBalance +
    cumulativeOffsetDeposits +
    cumulativeExternalStockContributions +
    cumulativeOutOfPocket
  );
}

export function calculateCombinedPropertyProjection(
  input: CombinedPropertyInput,
): CombinedPropertyProjection {
  const {
    offset,
    propertyShares,
    rentalSurplusAllocation,
    postPayoffAllocation,
    ...propertyInput
  } = input;

  assertNonNegative("Initial offset balance", offset.initialBalance);
  assertNonNegative("Monthly offset deposit", offset.monthlyDeposit);
  assertNonNegative("Monthly offset withdrawal", offset.monthlyWithdrawal);
  assertNonNegative(
    "Initial property-side stock investment",
    propertyShares.initialInvestment,
  );
  assertNonNegative(
    "Monthly property-side stock contribution",
    propertyShares.monthlyContribution,
  );
  assertFinite("Property-side stock return", propertyShares.annualReturnRate);
  assertFinite("Property-side stock fee", propertyShares.annualFeeRate);
  assertFinite("Inflation rate", propertyShares.inflationRate);
  if (propertyShares.inflationRate <= -1) {
    throw new RangeError("Inflation rate must be above -100%.");
  }
  assertAllocation(rentalSurplusAllocation);
  assertAllocation(postPayoffAllocation);

  if (
    !Number.isInteger(propertyInput.projectionYears) ||
    propertyInput.projectionYears < 1 ||
    propertyInput.projectionYears > MAX_PROJECTION_YEARS
  ) {
    throw new RangeError(
      `Projection years must be a whole number from 1 to ${MAX_PROJECTION_YEARS}.`,
    );
  }

  const calculatedLoanPrincipal =
    propertyInput.purchasePrice -
    propertyInput.deposit +
    propertyInput.financedPurchaseCosts;
  const simulationYears =
    calculatedLoanPrincipal > 0
      ? Math.max(propertyInput.projectionYears, propertyInput.mortgageTermYears)
      : propertyInput.projectionYears;
  const baseProjection = calculatePropertyProjection({
    ...propertyInput,
    projectionYears: simulationYears,
  });
  const totalMonths = simulationYears * 12;
  const visibleMonths = propertyInput.projectionYears * 12;
  const monthly: CombinedPropertyMonth[] = [];
  const annual: CombinedPropertyYear[] = [];

  let loanBalance = baseProjection.loanPrincipal;
  let offsetBalance = offset.initialBalance;
  let retainedCashBalance = 0;
  let propertySideStockBalance = propertyShares.initialInvestment;
  let cumulativeInterestSaved = 0;
  let cumulativeCashFlow = 0;
  let cumulativeOutOfPocket = 0;
  let cumulativeStockContributions = propertyShares.initialInvestment;
  let cumulativeExternalStockContributions =
    propertyShares.initialInvestment;
  let cumulativeStockFees = 0;
  let cumulativeRentalSurplusInvestedInStocks = 0;
  let cumulativeOffsetDeposits = 0;
  let mortgagePayoffMonth = loanBalance === 0 ? 0 : null;

  for (let month = 1; month <= totalMonths; month += 1) {
    const baseMonth = baseProjection.monthly[month - 1];
    if (!baseMonth) {
      throw new Error("Missing monthly property results for combined projection.");
    }

    const openingOffsetBalance = offsetBalance;
    const availableOffsetBalance = openingOffsetBalance + offset.monthlyDeposit;
    if (offset.monthlyWithdrawal > availableOffsetBalance) {
      throw new RangeError(
        `Offset withdrawal exceeds available balance in month ${month}.`,
      );
    }
    const offsetBalanceForInterest =
      availableOffsetBalance - offset.monthlyWithdrawal;
    const mortgageInstallment: MortgageInstallment =
      calculateMortgageInstallment({
        openingBalance: loanBalance,
        annualInterestRate: propertyInput.annualMortgageRate,
        scheduledPayment: baseProjection.scheduledMonthlyMortgagePayment,
        extraMonthlyRepayment: propertyInput.extraMonthlyRepayment,
        offsetBalance: offsetBalanceForInterest,
        isFinalPayment:
          month === propertyInput.mortgageTermYears * 12,
      });
    const interestSaved =
      baseMonth.mortgageInterest - mortgageInstallment.interest;
    cumulativeInterestSaved += interestSaved;
    loanBalance = mortgageInstallment.closingBalance;
    if (loanBalance === 0 && mortgagePayoffMonth === null) {
      mortgagePayoffMonth = month;
    }

    const cashFlow =
      baseMonth.rentReceived -
      baseMonth.operatingExpenses -
      baseMonth.propertyManagementFee -
      mortgageInstallment.payment;
    const allocation =
      loanBalance === 0
        ? postPayoffAllocation
        : rentalSurplusAllocation;
    const rentalSurplus = Math.max(0, cashFlow);
    const rentalSurplusToOffset =
      allocation === "offset" ? rentalSurplus : 0;
    const rentalSurplusInvestedInStocks =
      allocation === "stocks" ? rentalSurplus : 0;
    let outOfPocket = 0;
    if (cashFlow > 0) {
      if (allocation === "cash") {
        retainedCashBalance += cashFlow;
      }
    } else if (cashFlow < 0) {
      const cashAvailable = retainedCashBalance + cashFlow;
      outOfPocket = Math.max(0, -cashAvailable);
      retainedCashBalance = Math.max(0, cashAvailable);
    }

    cumulativeCashFlow += cashFlow;
    cumulativeOutOfPocket += outOfPocket;
    offsetBalance = offsetBalanceForInterest + rentalSurplusToOffset;
    cumulativeOffsetDeposits += offset.monthlyDeposit;

    const propertySideStockContribution =
      propertyShares.monthlyContribution +
      rentalSurplusInvestedInStocks;
    if (month <= visibleMonths) {
      const stockMonth: StockInvestmentMonth =
        calculateStockInvestmentMonth({
          startingBalance: propertySideStockBalance,
          monthlyContribution: propertySideStockContribution,
          annualReturnRate: propertyShares.annualReturnRate,
          annualFeeRate: propertyShares.annualFeeRate,
        });
      propertySideStockBalance = stockMonth.endingBalance;
      cumulativeStockContributions += propertySideStockContribution;
      cumulativeExternalStockContributions +=
        propertyShares.monthlyContribution;
      cumulativeStockFees += stockMonth.fee;
      cumulativeRentalSurplusInvestedInStocks +=
        rentalSurplusInvestedInStocks;
    }

    const year = Math.ceil(month / 12);
    const inflationFactor = Math.pow(1 + propertyShares.inflationRate, year);
    const propertyEquity = baseMonth.propertyValue - loanBalance;
    const netWorth =
      propertyEquity +
      offsetBalance +
      retainedCashBalance +
      propertySideStockBalance;
    const inflationAdjustedStockBalance =
      propertySideStockBalance / inflationFactor;
    const inflationAdjustedNetWorth = netWorth / inflationFactor;
    const cumulativeExternalCash = calculateExternalCash(
      propertyInput,
      offset,
      cumulativeOffsetDeposits,
      cumulativeExternalStockContributions,
      cumulativeOutOfPocket,
    );

    const checkedValues = [
      offsetBalanceForInterest,
      offsetBalance,
      cumulativeInterestSaved,
      cumulativeCashFlow,
      cumulativeOutOfPocket,
      cumulativeStockContributions,
      cumulativeExternalStockContributions,
      cumulativeStockFees,
      cumulativeRentalSurplusInvestedInStocks,
      cumulativeExternalCash,
      propertyEquity,
      netWorth,
      inflationAdjustedStockBalance,
      inflationAdjustedNetWorth,
    ];
    if (checkedValues.some((value) => !Number.isFinite(value))) {
      throw new RangeError("The combined projection exceeds the numeric range.");
    }

    if (month <= visibleMonths) {
      monthly.push({
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
        mortgageInterest: mortgageInstallment.interest,
        interestBearingMortgageBalance:
          mortgageInstallment.interestBearingBalance,
        principalRepaid: mortgageInstallment.principalPaid,
        openingOffsetBalance,
        offsetBalanceForInterest,
        offsetDeposit: offset.monthlyDeposit,
        offsetWithdrawal: offset.monthlyWithdrawal,
        rentalSurplusToOffset,
        offsetBalance,
        interestSaved,
        cumulativeInterestSaved,
        cashFlow,
        retainedCashBalance,
        outOfPocket,
        cumulativeCashFlow,
        cumulativeOutOfPocket,
        propertySideStockContribution,
        rentalSurplusInvestedInStocks,
        propertySideStockBalance,
        cumulativeStockContributions,
        cumulativeExternalStockContributions,
        cumulativeStockFees,
        cumulativeRentalSurplusInvestedInStocks,
        stockNetGrowth:
          propertySideStockBalance - cumulativeStockContributions,
        inflationAdjustedStockBalance,
        cumulativeExternalCash,
        netWorth,
        inflationAdjustedNetWorth,
      });
    }

    if (month <= visibleMonths && month % 12 === 0) {
      const yearMonths = monthly.slice(month - 12, month);
      const finalMonth = yearMonths.at(-1);
      if (!finalMonth) {
        throw new Error("Missing monthly results for annual summary.");
      }

      annual.push({
        year,
        propertyValue: finalMonth.propertyValue,
        loanBalance: finalMonth.loanBalance,
        propertyEquity: finalMonth.propertyEquity,
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
        mortgagePayments: annualSum(
          yearMonths,
          (result) => result.mortgagePayment,
        ),
        mortgageInterest: annualSum(
          yearMonths,
          (result) => result.mortgageInterest,
        ),
        interestBearingMortgageBalance:
          finalMonth.interestBearingMortgageBalance,
        principalRepaid: annualSum(
          yearMonths,
          (result) => result.principalRepaid,
        ),
        openingOffsetBalance: yearMonths[0].openingOffsetBalance,
        offsetBalanceForInterest: finalMonth.offsetBalanceForInterest,
        offsetDeposit: annualSum(yearMonths, (result) => result.offsetDeposit),
        offsetWithdrawal: annualSum(
          yearMonths,
          (result) => result.offsetWithdrawal,
        ),
        rentalSurplusToOffset: annualSum(
          yearMonths,
          (result) => result.rentalSurplusToOffset,
        ),
        offsetBalance: finalMonth.offsetBalance,
        interestSaved: annualSum(yearMonths, (result) => result.interestSaved),
        cumulativeInterestSaved: finalMonth.cumulativeInterestSaved,
        cashFlow: annualSum(yearMonths, (result) => result.cashFlow),
        retainedCashBalance: finalMonth.retainedCashBalance,
        outOfPocket: annualSum(yearMonths, (result) => result.outOfPocket),
        cumulativeCashFlow: finalMonth.cumulativeCashFlow,
        cumulativeOutOfPocket: finalMonth.cumulativeOutOfPocket,
        propertySideStockContribution: annualSum(
          yearMonths,
          (result) => result.propertySideStockContribution,
        ),
        rentalSurplusInvestedInStocks: annualSum(
          yearMonths,
          (result) => result.rentalSurplusInvestedInStocks,
        ),
        propertySideStockBalance: finalMonth.propertySideStockBalance,
        cumulativeStockContributions: finalMonth.cumulativeStockContributions,
        cumulativeExternalStockContributions:
          finalMonth.cumulativeExternalStockContributions,
        cumulativeStockFees: finalMonth.cumulativeStockFees,
        cumulativeRentalSurplusInvestedInStocks:
          finalMonth.cumulativeRentalSurplusInvestedInStocks,
        stockNetGrowth: finalMonth.stockNetGrowth,
        inflationAdjustedStockBalance:
          finalMonth.inflationAdjustedStockBalance,
        cumulativeExternalCash: finalMonth.cumulativeExternalCash,
        netWorth: finalMonth.netWorth,
        inflationAdjustedNetWorth: finalMonth.inflationAdjustedNetWorth,
      });
    }
  }

  return {
    loanPrincipal: baseProjection.loanPrincipal,
    initialCashRequired: baseProjection.initialCashRequired,
    initialOffsetBalance: offset.initialBalance,
    initialPropertySideStockInvestment: propertyShares.initialInvestment,
    scheduledMonthlyMortgagePayment:
      baseProjection.scheduledMonthlyMortgagePayment,
    baselineMortgagePayoffMonth: baseProjection.mortgagePayoffMonth,
    mortgagePayoffMonth,
    totalInterestSavedOverLoan: cumulativeInterestSaved,
    monthly,
    annual,
  };
}
