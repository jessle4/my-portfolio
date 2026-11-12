export interface MortgageInput {
  principal: number;
  annualInterestRate: number;
  termYears: number;
  extraMonthlyRepayment: number;
}

export interface MortgageMonth {
  month: number;
  openingBalance: number;
  interestBearingBalance: number;
  scheduledPayment: number;
  payment: number;
  interest: number;
  principalPaid: number;
  closingBalance: number;
}

export interface MortgageProjection {
  scheduledMonthlyPayment: number;
  payoffMonth: number | null;
  months: MortgageMonth[];
}

export interface MortgageInstallmentInput {
  openingBalance: number;
  annualInterestRate: number;
  scheduledPayment: number;
  extraMonthlyRepayment: number;
  offsetBalance: number;
  isFinalPayment: boolean;
}

export interface MortgageInstallment {
  interestBearingBalance: number;
  payment: number;
  interest: number;
  principalPaid: number;
  closingBalance: number;
}

const MAX_TERM_YEARS = 50;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

export function calculateMortgageInstallment(
  input: MortgageInstallmentInput,
): MortgageInstallment {
  const {
    openingBalance,
    annualInterestRate,
    scheduledPayment,
    extraMonthlyRepayment,
    offsetBalance,
    isFinalPayment,
  } = input;

  assertFinite("Opening mortgage balance", openingBalance);
  assertFinite("Annual interest rate", annualInterestRate);
  assertFinite("Scheduled payment", scheduledPayment);
  assertFinite("Extra monthly repayment", extraMonthlyRepayment);
  assertFinite("Offset balance", offsetBalance);

  if (
    openingBalance < 0 ||
    annualInterestRate < 0 ||
    scheduledPayment < 0 ||
    extraMonthlyRepayment < 0 ||
    offsetBalance < 0
  ) {
    throw new RangeError("Mortgage installment amounts and rates cannot be negative.");
  }

  const monthlyRate = annualInterestRate / 12;
  const interestBearingBalance = Math.max(0, openingBalance - offsetBalance);
  const interest = interestBearingBalance * monthlyRate;
  const totalDue = openingBalance + interest;
  assertFinite("Monthly mortgage interest", interest);
  assertFinite("Total mortgage amount due", totalDue);

  const plannedPayment = scheduledPayment + extraMonthlyRepayment;
  const payment = isFinalPayment
    ? totalDue
    : Math.min(plannedPayment, totalDue);
  assertFinite("Monthly mortgage payment", payment);

  if (payment < interest) {
    throw new RangeError("Mortgage payment must cover the monthly interest.");
  }

  const principalPaid = Math.min(openingBalance, payment - interest);
  const closingBalance = Math.max(0, openingBalance - principalPaid);

  return {
    interestBearingBalance,
    payment,
    interest,
    principalPaid,
    closingBalance,
  };
}

export function calculateMortgageSchedule(
  input: MortgageInput,
): MortgageProjection {
  const { principal, annualInterestRate, termYears, extraMonthlyRepayment } =
    input;

  assertFinite("Loan principal", principal);
  assertFinite("Annual interest rate", annualInterestRate);
  assertFinite("Extra monthly repayment", extraMonthlyRepayment);

  if (principal < 0) {
    throw new RangeError("Loan principal cannot be negative.");
  }
  if (annualInterestRate < 0) {
    throw new RangeError("Annual interest rate cannot be negative.");
  }
  if (extraMonthlyRepayment < 0) {
    throw new RangeError("Extra monthly repayment cannot be negative.");
  }
  if (
    !Number.isInteger(termYears) ||
    termYears < 1 ||
    termYears > MAX_TERM_YEARS
  ) {
    throw new RangeError(
      `Mortgage term must be a whole number from 1 to ${MAX_TERM_YEARS} years.`,
    );
  }

  if (principal === 0) {
    return {
      scheduledMonthlyPayment: 0,
      payoffMonth: 0,
      months: [],
    };
  }

  const termMonths = termYears * 12;
  const monthlyRate = annualInterestRate / 12;
  const scheduledMonthlyPayment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate) /
        -Math.expm1(-termMonths * Math.log1p(monthlyRate));

  assertFinite("Scheduled monthly payment", scheduledMonthlyPayment);

  const months: MortgageMonth[] = [];
  let balance = principal;
  let payoffMonth: number | null = null;

  for (let month = 1; month <= termMonths && balance > 0; month += 1) {
    const openingBalance = balance;
    const installment = calculateMortgageInstallment({
      openingBalance,
      annualInterestRate,
      scheduledPayment: scheduledMonthlyPayment,
      extraMonthlyRepayment,
      offsetBalance: 0,
      isFinalPayment: month === termMonths,
    });
    balance = installment.closingBalance;

    months.push({
      month,
      openingBalance,
      interestBearingBalance: installment.interestBearingBalance,
      scheduledPayment: scheduledMonthlyPayment,
      payment: installment.payment,
      interest: installment.interest,
      principalPaid: installment.principalPaid,
      closingBalance: balance,
    });

    if (balance === 0) {
      payoffMonth = month;
    }
  }

  return {
    scheduledMonthlyPayment,
    payoffMonth,
    months,
  };
}
