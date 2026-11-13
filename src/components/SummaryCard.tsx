export default function SummaryCard({
  label,
  value,
  detail,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "pink" | "green" | "neutral";
}) {
  const valueColor =
    accent === "pink"
      ? "text-[#A45573]"
      : accent === "green"
        ? "text-[#365B47]"
        : "text-[#493841]";

  return (
    <article className="rounded-2xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl">
      <h3 className="text-sm font-medium text-[#806D76]">{label}</h3>
      <p className={`mt-2 text-2xl font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-[#806D76]">{detail}</p>
    </article>
  );
}
