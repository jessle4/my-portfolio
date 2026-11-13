import type { ChartSeries } from "../pages/InvestmentComparison/InvestmentComparison.types";
import { CURRENCY, COMPACT_CURRENCY } from "../utils/formatters";
import { buildPath } from "../utils/chartPath";

export default function LineChart({
  title,
  description,
  years,
  series,
}: {
  title: string;
  description: string;
  years: number[];
  series: ChartSeries[];
}) {
  const chartId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const values = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );

  if (values.length === 0) {
    return (
      <p className="rounded-xl bg-white/45 p-4 text-sm text-[#806D76]">
        No funded property projection is available for this chart.
      </p>
    );
  }

  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const range = maximum - minimum || 1;
  const ticks = Array.from(
    { length: 5 },
    (_, index) => minimum + (range * index) / 4,
  );
  const labelIndexes = [
    ...new Set([
      0,
      Math.floor((years.length - 1) / 2),
      Math.max(years.length - 1, 0),
    ]),
  ];

  return (
    <div>
      <svg
        viewBox="0 0 760 270"
        role="img"
        aria-labelledby={`${chartId}-title ${chartId}-description`}
        className="h-auto w-full overflow-visible"
      >
        <title id={`${chartId}-title`}>{title}</title>
        <desc id={`${chartId}-description`}>{description}</desc>
        {ticks.map((value, index) => {
          const y = 236 - (index / 4) * (236 - 20);
          return (
            <g key={`${title}-tick-${index}`}>
              <line
                x1="96"
                x2="724"
                y1={y}
                y2={y}
                stroke="#E8DDE3"
                strokeDasharray="4 6"
              />
              <text
                x="86"
                y={y + 4}
                textAnchor="end"
                className="fill-[#806D76] text-[11px]"
              >
                {COMPACT_CURRENCY.format(value)}
              </text>
            </g>
          );
        })}
        {series.map((item) => (
          <g key={item.label}>
            <path
              d={buildPath(item.values, years.length, minimum, maximum)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {item.values.map((value, index) => {
              if (value === null) {
                return null;
              }
              const x =
                96 + (index / Math.max(years.length - 1, 1)) * (724 - 96);
              const y = 236 - ((value - minimum) / range) * (236 - 20);
              return (
                <circle
                  key={`${item.label}-${years[index]}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={item.color}
                >
                  <title>
                    {`Year ${years[index]} · ${item.label}: ${CURRENCY.format(value)}`}
                  </title>
                </circle>
              );
            })}
          </g>
        ))}
        {labelIndexes.map((index) => (
          <text
            key={`${title}-year-${index}`}
            x={96 + (index / Math.max(years.length - 1, 1)) * (724 - 96)}
            y="260"
            textAnchor="middle"
            className="fill-[#806D76] text-xs"
          >
            Year {years[index]}
          </text>
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B6375]">
        {series.map((item) => (
          <li
            key={`${title}-${item.label}`}
            className="inline-flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className="h-0.5 w-5"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
