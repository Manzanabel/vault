const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

// Built once: Intl.NumberFormat construction is costly and this runs for every row.
const formatters = UNITS.map(
  (unit) =>
    new Intl.NumberFormat(undefined, {
      style: "unit",
      unit,
      unitDisplay: "short",
      maximumFractionDigits: 1,
    }),
);

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }

  return formatters[unit].format(value);
}
