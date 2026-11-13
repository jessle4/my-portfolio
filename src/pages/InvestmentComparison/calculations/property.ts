import {
  calculateMortgageSchedule,
  type MortgageInput,
} from "./mortgage";

export interface PropertyExpenses {
  strata: number;
  councilRates: number;
  waterRates: number;
  insurance: number;
  maintenance: number;
  other: number;
}

export interface PropertyInput {
  purchasePrice: number;
  deposit: number;
  upfrontPurchaseCosts: number;
  financedPurchaseCosts: number;
  annualMortgageRate: number;
  mortgageTermYears: number;
  extraMonthlyRepayment: number;
  annualPropertyGrowthRate: number;
  monthlyGrossRent: number;
  annualRentalGrowthRate: number;
  vacancyWeeksPerYear: number;
  propertyManagementRate: number;
  annualExpenses: PropertyExpenses;
  projectionYears: number;
}

export interface PropertyMonth {
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
  principalRepaid: number;
  cashFlow: number;
  retainedCashBalance: number;
  outOfPocket: number;
  cumulativeCashFlow: number;
  cumulativeOutOfPocket: number;
}

export interface PropertyYear {
  year: number;
  propertyValue: number;
  loanBalance: number;
  propertyEquity: number;
  grossRent: number;
  vacancyAllowance: number;
  rentReceived: number;
  operatingExpenses: number;
  propertyManagementFee: number;
  mortgagePayments: number;
  mortgageInterest: number;
  principalRepaid: number;
  cashFlow: number;
  retainedCashBalance: number;
  cumulativeCashFlow: number;
  cumulativeOutOfPocket: number;
}

export interface PropertyProjection {
  loanPrincipal: number;
  initialCashRequired: number;
  scheduledMonthlyMortgagePayment: number;
  mortgagePayoffMonth: number | null;
  monthly: PropertyMonth[];
  annual: PropertyYear[];
}

const MAX_PROJECTION_YEARS = 50;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

function validateNonNegative(name: string, value: number): void {
  assertFinite(name, value);
  if (value < 0) {
    throw new RangeError(`${name} cannot be negative.`);
  }
}

export function calculatePropertyProjection(
  input: PropertyInput,
): PropertyProjection {
  const {
    purchasePrice,
    deposit,
    upfrontPurchaseCosts,
    financedPurchaseCosts,
    annualMortgageRate,
    mortgageTermYears,
    extraMonthlyRepayment,
    annualPropertyGrowthRate,
    monthlyGrossRent,
    annualRentalGrowthRate,
    vacancyWeeksPerYear,
    propertyManagementRate,
    annualExpenses,
    projectionYears,
  } = input;

  validateNonNegative("Purchase price", purchasePrice);
  if (purchasePrice === 0) {
    throw new RangeError("Purchase price must be greater than zero.");
  }
  validateNonNegative("Deposit", deposit);
  if (deposit > purchasePrice) {
    throw new RangeError("Deposit cannot exceed the purchase price.");
  }
  validateNonNegative("Upfront purchase costs", upfrontPurchaseCosts);
  validateNonNegative("Financed purchase costs", financedPurchaseCosts);
  validateNonNegative("Monthly gross rent", monthlyGrossRent);
  validateNonNegative("Annual mortgage rate", annualMortgageRate);
  validateNonNegative("Extra monthly repayment", extraMonthlyRepayment);

  assertFinite("Annual property growth rate", annualPropertyGrowthRate);
  assertFinite("Annual rental growth rate", annualRentalGrowthRate);
  if (annualPropertyGrowthRate < -1 || annualRentalGrowthRate < -1) {
    throw new RangeError("Annual growth rates cannot be below -100%.");
  }

  assertFinite("Vacancy weeks per year", vacancyWeeksPerYear);
  if (vacancyWeeksPerYear < 0 || vacancyWeeksPerYear > 52) {
    throw new RangeError("Vacancy must be between 0 and 52 weeks per year.");
  }

  assertFinite(
    "Property management rate",
    propertyManagementRate,
  );
  if (propertyManagementRate < 0 || propertyManagementRate > 1) {
    throw new RangeError(
      "Property management rate must be between 0% and 100%.",
    );
  }

  const expenseValues = Object.values(annualExpenses);
  for (const [index, amount] of expenseValues.entries()) {
    validateNonNegative(`Annual operating expense ${index + 1}`, amount);
  }
  const totalAnnualExpenses = expenseValues.reduce(
    (total, amount) => total + amount,
    0,
  );
  assertFinite("Total annual operating expenses", totalAnnualExpenses);

  if (
    !Number.isInteger(projectionYears) ||
    projectionYears < 1 ||
    projectionYears > MAX_PROJECTION_YEARS
  ) {
    throw new RangeError(
      `Projection years must be a whole number from 1 to ${MAX_PROJECTION_YEARS}.`,
    );
  }

  const loanPrincipal =
    purchasePrice - deposit + financedPurchaseCosts;
  const initialCashRequired = deposit + upfrontPurchaseCosts;
  assertFinite("Loan principal", loanPrincipal);
  assertFinite("Initial cash required", initialCashRequired);

  const mortgageInput: MortgageInput = {
    principal: loanPrincipal,
    annualInterestRate: annualMortgageRate,
    termYears: mortgageTermYears,
    extraMonthlyRepayment,
  };
  const mortgage = calculateMortgageSchedule(mortgageInput);
  const monthlyPropertyGrowthFactor = Math.pow(
    1 + annualPropertyGrowthRate,
    1 / 12,
  );
  const fixedMonthlyExpenses = totalAnnualExpenses / 12;
  const monthly: PropertyMonth[] = [];
  const annual: PropertyYear[] = [];

  let propertyValue = purchasePrice;
  let retainedCashBalance = 0;
  let cumulativeCashFlow = 0;
  let cumulativeOutOfPocket = 0;

  for (let month = 1; month <= projectionYears * 12; month += 1) {
    const year = Math.ceil(month / 12);
    propertyValue *= monthlyPropertyGrowthFactor;

    const grossRent =
      monthlyGrossRent *
      Math.pow(1 + annualRentalGrowthRate, Math.floor((month - 1) / 12));
    const vacancyAllowance = grossRent * (vacancyWeeksPerYear / 52);
    const rentReceived = grossRent - vacancyAllowance;
    const propertyManagementFee =
      rentReceived * propertyManagementRate;
    const mortgageMonth = mortgage.months[month - 1];
    const mortgagePayment = mortgageMonth?.payment ?? 0;
    const mortgageInterest = mortgageMonth?.interest ?? 0;
    const principalRepaid = mortgageMonth?.principalPaid ?? 0;
    const cashFlow =
      rentReceived -
      fixedMonthlyExpenses -
      propertyManagementFee -
      mortgagePayment;
    const cashAvailable = retainedCashBalance + cashFlow;
    const outOfPocket = Math.max(0, -cashAvailable);
    retainedCashBalance = Math.max(0, cashAvailable);
    cumulativeCashFlow += cashFlow;
    cumulativeOutOfPocket += outOfPocket;

    const valuesToCheck = [
      propertyValue,
      grossRent,
      vacancyAllowance,
      rentReceived,
      propertyManagementFee,
      cashFlow,
      retainedCashBalance,
      cumulativeCashFlow,
      cumulativeOutOfPocket,
    ];
    if (valuesToCheck.some((value) => !Number.isFinite(value))) {
      throw new RangeError("The property projection exceeds the numeric range.");
    }

    monthly.push({
      month,
      year,
      propertyValue,
      loanBalance: mortgageMonth?.closingBalance ?? 0,
      propertyEquity: propertyValue - (mortgageMonth?.closingBalance ?? 0),
      grossRent,
      vacancyAllowance,
      rentReceived,
      operatingExpenses: fixedMonthlyExpenses,
      propertyManagementFee,
      mortgagePayment,
      mortgageInterest,
      principalRepaid,
      cashFlow,
      retainedCashBalance,
      outOfPocket,
      cumulativeCashFlow,
      cumulativeOutOfPocket,
    });

    if (month % 12 === 0) {
      const yearMonths = monthly.slice(month - 12, month);
      const finalMonth = yearMonths.at(-1);
      if (!finalMonth) {
        throw new Error("Missing monthly property results for annual summary.");
      }

      const sum = (selectValue: (result: PropertyMonth) => number) =>
        yearMonths.reduce((total, result) => total + selectValue(result), 0);

      annual.push({
        year,
        propertyValue: finalMonth.propertyValue,
        loanBalance: finalMonth.loanBalance,
        propertyEquity: finalMonth.propertyEquity,
        grossRent: sum((result) => result.grossRent),
        vacancyAllowance: sum((result) => result.vacancyAllowance),
        rentReceived: sum((result) => result.rentReceived),
        operatingExpenses: sum((result) => result.operatingExpenses),
        propertyManagementFee: sum((result) => result.propertyManagementFee),
        mortgagePayments: sum((result) => result.mortgagePayment),
        mortgageInterest: sum((result) => result.mortgageInterest),
        principalRepaid: sum((result) => result.principalRepaid),
        cashFlow: sum((result) => result.cashFlow),
        retainedCashBalance: finalMonth.retainedCashBalance,
        cumulativeCashFlow: finalMonth.cumulativeCashFlow,
        cumulativeOutOfPocket: finalMonth.cumulativeOutOfPocket,
      });
    }
  }

  return {
    loanPrincipal,
    initialCashRequired,
    scheduledMonthlyMortgagePayment: mortgage.scheduledMonthlyPayment,
    mortgagePayoffMonth: mortgage.payoffMonth,
    monthly,
    annual,
  };
}
