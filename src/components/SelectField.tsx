export default function SelectField({
  id,
  label,
  help,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#493841]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 w-full rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-[#493841] shadow-sm outline-none transition focus:border-[#A45573] focus:ring-2 focus:ring-[#A45573]/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p
        id={`${id}-help`}
        className="mt-1 text-xs leading-relaxed text-[#806D76]"
      >
        {help}
      </p>
    </div>
  );
}
