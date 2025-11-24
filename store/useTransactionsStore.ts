import { create } from "zustand";
import type { CountryCode, CurrencyCode } from "../lib/validation";

export type Transaction = {
  id: string;
  createdAt: number; // timestamp (ms)
  recipientName: string;
  country: CountryCode;
  currency: CurrencyCode;
  phone: string;
  usdAmount: number;
  localAmount: string;
  fxRate: number;
};

type TxState = {
  items: Transaction[];
  add: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  clear: () => void;
};

export const useTransactionsStore = create<TxState>((set) => ({
  items: [],
  add(txInput) {
    const tx: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      ...txInput,
    };

    // Keep the last 5, newest first
    set((state) => ({
      items: [tx, ...state.items].slice(0, 5),
    }));
  },
  clear() {
    set({ items: [] });
  },
}));