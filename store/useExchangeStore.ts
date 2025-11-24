import { create } from "zustand";
import type { CurrencyCode } from "../lib/validation";

// I keep FX rates in a simple map keyed by currency code.
// Using Partial here lets me gradually fill it as needed.
type RatesMap = Partial<Record<CurrencyCode, number>>;

type ExchangeState = {
  rates: RatesMap;
  loading: boolean;
  error: string | null;
  fetchRates: () => Promise<void>;
};

/**
 * Tiny FX service built on top of Zustand.
 *
 * Instead of letting every screen call fetch() directly,
 * I centralise all currency logic here so I can:
 * - reuse live rates across multiple screens,
 * - control when/how often I hit the API,
 * - and keep React components focused on UI.
 */
export const useExchangeStore = create<ExchangeState>((set, get) => ({
  // At startup I assume we don't have any rates yet.
  rates: {},
  loading: false,
  error: null,

  /**
   * Fetches latest FX rates from Open Exchange Rates.
   *
   * In practice this is called once when the first screen
   * mounts (via useFxRates). If I already have data,
   * I short-circuit to avoid spamming the API.
   */
  async fetchRates() {
    // Simple guard: if we already have something cached,
    // I don't refetch. For a real app I'd probably add a time to leave.
    if (Object.keys(get().rates).length > 0) return;

    try {
      set({ loading: true, error: null });

      // I added the API key here so it's easier for you to run
      // the demo locally without having to register and create new appId.'
      // In a real app you'd probably use a secure way to store this.'
      const appId = "b51a52cf095e41f9a09b8f4912f3c473";
      if (!appId) {
        throw new Error("Missing EXPO_PUBLIC_OXR_APP_ID");
      }

      const res = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${appId}`
      );

      if (!res.ok) {
        throw new Error(`Rates fetch failed with status ${res.status}`);
      }

      const json = await res.json();
      const rawRates: Record<string, number> = json.rates || {};

      /*In a real app I would use a more robust currency library.'
      for an improvement, I should reduce duplication and possibly
      use COUNTRY_META in validations.ts to populate the rates*/
      set({
        rates: {
          KES: rawRates["KES"],
          NGN: rawRates["NGN"],
          TZS: rawRates["TZS"],
          UGX: rawRates["UGX"],
        },
        loading: false,
        error: null,
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err?.message || "Unable to fetch rates",
      });
    }
  },
}));