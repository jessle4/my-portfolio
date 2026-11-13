import { motion } from "motion/react";
import { useInvestmentComparison } from "./hooks/useInvestmentComparison";
import AssumptionsForm from "../../sections/AssumptionsForm";
import ResultsSection from "../../sections/ResultsSection";

export default function InvestmentComparison() {
  const model = useInvestmentComparison();
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
          Compare a stocks-only plan with a rental property and shares,
          including the mortgage, offset account and the cash each path uses.
        </p>
      </header>

      <AssumptionsForm model={model} />
      <ResultsSection model={model} />
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
