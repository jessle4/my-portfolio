import { describe, expect, it } from "vitest";
import { calculateMortgageSchedule } from "./mortgage";

describe("calculateMortgageSchedule", () => {
  it("calculates a fixed-rate principal-and-interest repayment schedule", () => {
    const projection = calculateMortgageSchedule({
      principal: 100_000,
      annualInterestRate: 0.06,
      termYears: 30,
      extraMonthlyRepayment: 0,
    });

    expect(projection.scheduledMonthlyPayment).toBeCloseTo(599.55, 2);
    expect(projection.months).toHaveLength(360);
    expect(projection.months[0].interest).toBeCloseTo(500, 10);
    expect(projection.months[0].principalPaid).toBeCloseTo(
      projection.scheduledMonthlyPayment - 500,
      10,
    );
    for (const month of projection.months) {
      expect(month.payment).toBeCloseTo(
        month.interest + month.principalPaid,
        8,
      );
      expect(month.payment).toBeLessThanOrEqual(
        month.openingBalance + month.interest,
      );
    }
    expect(projection.months.at(-1)?.closingBalance).toBe(0);
    expect(projection.payoffMonth).toBe(360);
  });

  it("amortizes a zero-interest loan evenly", () => {
    const projection = calculateMortgageSchedule({
      principal: 1_200,
      annualInterestRate: 0,
      termYears: 1,
      extraMonthlyRepayment: 0,
    });

    expect(projection.scheduledMonthlyPayment).toBe(100);
    expect(projection.months).toHaveLength(12);
    expect(projection.months.every((month) => month.interest === 0)).toBe(true);
    expect(projection.months.at(-1)?.closingBalance).toBe(0);
  });

  it("handles very small positive rates without an unstable payment formula", () => {
    const projection = calculateMortgageSchedule({
      principal: 12_000,
      annualInterestRate: 1e-14,
      termYears: 1,
      extraMonthlyRepayment: 0,
    });

    expect(projection.scheduledMonthlyPayment).toBeCloseTo(1_000, 8);
    expect(projection.payoffMonth).toBe(12);
  });

  it("applies extra repayments and caps the final payment at the amount due", () => {
    const projection = calculateMortgageSchedule({
      principal: 12_000,
      annualInterestRate: 0,
      termYears: 10,
      extraMonthlyRepayment: 10_000,
    });

    expect(projection.payoffMonth).toBe(2);
    expect(projection.months).toHaveLength(2);
    expect(projection.months[0].payment).toBe(10_100);
    expect(projection.months[1].payment).toBe(1_900);
    expect(projection.months[1].closingBalance).toBe(0);
  });

  it("returns an empty schedule for a fully funded purchase", () => {
    expect(
      calculateMortgageSchedule({
        principal: 0,
        annualInterestRate: 0.06,
        termYears: 30,
        extraMonthlyRepayment: 0,
      }),
    ).toEqual({
      scheduledMonthlyPayment: 0,
      payoffMonth: 0,
      months: [],
    });
  });

  it.each([
    ["negative principal", { principal: -1 }],
    ["negative rate", { annualInterestRate: -0.01 }],
    ["negative extra repayment", { extraMonthlyRepayment: -1 }],
    ["zero term", { termYears: 0 }],
    ["fractional term", { termYears: 1.5 }],
    ["term over 50 years", { termYears: 51 }],
  ])("rejects %s", (_description, overrides) => {
    expect(() =>
      calculateMortgageSchedule({
        principal: 100_000,
        annualInterestRate: 0.06,
        termYears: 30,
        extraMonthlyRepayment: 0,
        ...overrides,
      }),
    ).toThrow(RangeError);
  });

  it("rejects a schedule that exceeds the numeric range", () => {
    expect(() =>
      calculateMortgageSchedule({
        principal: Number.MAX_VALUE,
        annualInterestRate: 1e308,
        termYears: 1,
        extraMonthlyRepayment: 0,
      }),
    ).toThrow(RangeError);
  });
});
