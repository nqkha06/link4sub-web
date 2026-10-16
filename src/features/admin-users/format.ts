export function formatDateTime(
  value: Date | string | number | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(value));
  } catch {
    return "";
  }
}

export function formatUsd(value: string | number, locale: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `$${value}`;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
