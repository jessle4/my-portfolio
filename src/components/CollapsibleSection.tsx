import { useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  description,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-3xl border border-white/70 bg-white/55 shadow-sm backdrop-blur-xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-7"
      >
        <div>
          <h2 className="text-lg font-semibold text-[#493841]">{title}</h2>
          <p className="mt-1 text-sm text-[#806D76]">{description}</p>
        </div>
        <span aria-hidden="true" className="text-xl text-[#A45573]">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="border-t border-white/70 p-5 sm:p-7">{children}</div>
      )}
    </section>
  );
}
