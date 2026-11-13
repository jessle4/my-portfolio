export default function NumberField({
  id,
  label,
  unit,
  value,
  min,
  max,
  step,
  help,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max?: number;
  step: number;
  help: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-3 text-sm font-medium text-[#493841]"
      >
        <span>{label}</span>
        <span className="shrink-0 text-xs font-normal text-[#806D76]">
          {unit}
        </span>
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={`${id}-help`}
        onChange={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;
          onChange(Number.isNaN(nextValue) ? 0 : nextValue);
        }}
        className="mt-2 w-full rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[#493841] shadow-sm outline-none transition focus:border-[#A45573] focus:ring-2 focus:ring-[#A45573]/20"
      />
      <p
        id={`${id}-help`}
        className="mt-1 text-xs leading-relaxed text-[#806D76]"
      >
        {help}
      </p>
    </div>
  );
}
