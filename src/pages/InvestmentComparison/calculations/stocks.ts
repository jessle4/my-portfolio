export interface StockInvestmentInput {
  initialInvestment: number;
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
  inflationRate: number;
  years: number;
}

export interface StockInvestmentYear {
  year: number;
  nominalBalance: number;
  inflationAdjustedBalance: number;
  cumulativeContributions: number;
  cumulativeFees: number;
  netGrowth: number;
}

export interface StockInvestmentMonthInput {
  startingBalance: number;
  monthlyContribution: number;
  annualReturnRate: number;
  annualFeeRate: number;
}

export interface StockInvestmentMonth {
  endingBalance: number;
  fee: number;
}

const MAX_PROJECTION_YEARS = 50;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number.`);
  }
}

function applyMonthlyInvestment(
  startingBalance: number,
  monthlyContribution: number,
  monthlyGrowthFactor: number,
  monthlyFeeFactor: number,
): StockInvestmentMonth {
  const balanceAfterGrowth = startingBalance * monthlyGrowthFactor;
  const fee = balanceAfterGrowth * (1 - monthlyFeeFactor);
  const endingBalance = balanceAfterGrowth - fee + monthlyContribution;

  if (!Number.isFinite(endingBalance) || !Number.isFinite(fee)) {
    throw new RangeError("The projection exceeds the supported numeric range.");
  }

  return { endingBalance, fee };
}

export function calculateStockInvestmentMonth(
  input: StockInvestmentMonthInput,
): StockInvestmentMonth {
  const {
    startingBalance,
    monthlyContribution,
    annualReturnRate,
    annualFeeRate,
  } = input;

  assertFinite("Starting balance", startingBalance);
  assertFinite("Monthly contribution", monthlyContribution);
  assertFinite("Annual return rate", annualReturnRate);
  assertFinite("Annual fee rate", annualFeeRate);

  if (startingBalance < 0 || monthlyContribution < 0) {
    throw new RangeError("Investment amounts cannot be negative.");
  }
  if (annualReturnRate < -1) {
    throw new RangeError("Annual return rate cannot be below -100%.");
  }
  if (annualFeeRate < 0 || annualFeeRate >= 1) {
    throw new RangeError("Annual fee rate must be at least 0% and below 100%.");
  }

  return applyMonthlyInvestment(
    startingBalance,
    monthlyContribution,
    Math.pow(1 + annualReturnRate, 1 / 12),
    Math.pow(1 - annualFeeRate, 1 / 12),
  );
}

export function calculateStockInvestmentProjection(
  input: StockInvestmentInput,
): StockInvestmentYear[] {
  const {
    initialInvestment,
    monthlyContribution,
    annualReturnRate,
    annualFeeRate,
    inflationRate,
    years,
  } = input;

  assertFinite("Initial investment", initialInvestment);
  assertFinite("Monthly contribution", monthlyContribution);
  assertFinite("Annual return rate", annualReturnRate);
  assertFinite("Annual fee rate", annualFeeRate);
  assertFinite("Inflation rate", inflationRate);

  if (initialInvestment < 0 || monthlyContribution < 0) {
    throw new RangeError("Investment amounts cannot be negative.");
  }
  if (annualReturnRate < -1) {
    throw new RangeError("Annual return rate cannot be below -100%.");
  }
  if (annualFeeRate < 0 || annualFeeRate >= 1) {
    throw new RangeError("Annual fee rate must be at least 0% and below 100%.");
  }
  if (inflationRate <= -1) {
    throw new RangeError("Inflation rate must be above -100%.");
  }
  if (!Number.isInteger(years) || years < 1 || years > MAX_PROJECTION_YEARS) {
    throw new RangeError(
      `Projection years must be a whole number from 1 to ${MAX_PROJECTION_YEARS}.`,
    );
  }

  const monthlyGrowthFactor = Math.pow(1 + annualReturnRate, 1 / 12);
  const monthlyFeeFactor = Math.pow(1 - annualFeeRate, 1 / 12);
  let balance = initialInvestment;
  let cumulativeContributions = initialInvestment;
  let cumulativeFees = 0;
  const projection: StockInvestmentYear[] = [];

  for (let month = 1; month <= years * 12; month += 1) {
    const monthlyResult = applyMonthlyInvestment(
      balance,
      monthlyContribution,
      monthlyGrowthFactor,
      monthlyFeeFactor,
    );

    cumulativeFees += monthlyResult.fee;
    balance = monthlyResult.endingBalance;
    cumulativeContributions += monthlyContribution;

    if (
      !Number.isFinite(balance) ||
      !Number.isFinite(cumulativeContributions) ||
      !Number.isFinite(cumulativeFees)
    ) {
      throw new RangeError("The projection exceeds the supported numeric range.");
    }

    if (month % 12 === 0) {
      const year = month / 12;
      const inflationFactor = Math.pow(1 + inflationRate, year);
      const inflationAdjustedBalance = balance / inflationFactor;

      if (!Number.isFinite(inflationAdjustedBalance)) {
        throw new RangeError("The projection exceeds the supported numeric range.");
      }

      projection.push({
        year,
        nominalBalance: balance,
        inflationAdjustedBalance,
        cumulativeContributions,
        cumulativeFees,
        netGrowth: balance - cumulativeContributions,
      });
    }
  }

  return projection;
}
