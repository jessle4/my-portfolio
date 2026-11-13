import type { ReactNode } from "react";

export default function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-7">
      <h2 className="text-lg font-semibold text-[#493841]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
