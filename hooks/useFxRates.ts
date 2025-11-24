import { useEffect } from "react";
import { useExchangeStore } from "../store/useExchangeStore";

/**
 * Small helper hook I wrote so that screens don't need
 * to know about Zustand directly. They just call useFxRates()
 * and get back a clean { rates, loading, error } object.
 *
 * In my head this is the "FX gateway" for the UI.
 */
export function useFxRates() {
  /*I keep everything in a central exchange store so I can
  easily reuse rates across multiple screens later.*/
  const rates = useExchangeStore((s) => s.rates);
  const loading = useExchangeStore((s) => s.loading);
  const error = useExchangeStore((s) => s.error);
  const fetchRates = useExchangeStore((s) => s.fetchRates);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);
  return { rates, loading, error };
}