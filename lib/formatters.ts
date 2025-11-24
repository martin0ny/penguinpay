export function formatLocalAmount(
  usdAmount: number,
  rate: number | undefined
): string | null {
  if (!rate || !Number.isFinite(rate) || !Number.isFinite(usdAmount)) {
    return null;
  }

  const converted = usdAmount * rate;

  // Try to use Intl if available (Hermes supports this)
  try {
    return converted.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    // Fallback: manual thousands separator
    const [intPart, fracPart] = converted.toFixed(2).split(".");
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${withCommas}.${fracPart}`;
  }
}

export function formatShortTime(timestamp: number): string {
  const d = new Date(timestamp);
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    const h = `${d.getHours()}`.padStart(2, "0");
    const m = `${d.getMinutes()}`.padStart(2, "0");
    return `${h}:${m}`;
  }
}
