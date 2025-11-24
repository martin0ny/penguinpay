# PenguinPay – Mobile FX Remittance Demo

PenguinPay is a small React Native mobile app that simulates sending money from the US to East African countries.
I built it as an interview demo to show how I think about:

- **End-to-end UX** (from form → confirmation → history)
- **Clean state management** with Zustand
- **Realtime FX conversion** using a live API
- **Practical mobile patterns** (validation, confirmation sheets, “quick amount” chips, optimistic UI, etc.)

---

## ✨ High‑Level Overview

**Core idea:** A lightweight cross‑border remittance flow where a sender in the US can:

1. Enter **recipient details** (name, country, phone)
2. Enter an **amount in USD**
3. See **live converted amount** in the recipient’s local currency
4. Review and **confirm** the transaction in a bottom “sheet” style overlay
5. See **recent transfers** in a simple local history panel

All of this runs fully on‑device with a single screen (`SendTransactionScreen`), and a couple of lightweight
shared stores/hooks.

---

## 🧱 Tech Stack

- **React Native** (TypeScript)
- **NativeWind** + Tailwind classes for styling
- **Zustand** for global state:
  - `useExchangeStore` – FX rates
  - `useTransactionsStore` – local transaction history
- **Open Exchange Rates** for FX data (via `EXPO_PUBLIC_OXR_APP_ID`)
- **React Native core components only** (no heavy UI kits) to keep dependencies lean and understandable

---

## 📁 Project Structure (Relevant Bits)

```text
src/
  screens/
    SendTransactionScreen.tsx      # Main flow: form + FX preview + review + history
  components/
    CountrySelect.tsx              # Country pills (Kenya, Nigeria, Tanzania, Uganda)
    PrimaryButton.tsx              # Reusable CTA
    TextField.tsx                  # Label + text input + error message
  hooks/
    useFxRates.ts                  # Hook to fetch & read FX rates from the store
  lib/
    validation.ts                  # Country metadata + amount/phone validation helpers
    formatters.ts                  # Currency formatting helpers
  store/
    useExchangeStore.ts            # FX rates store backed by Open Exchange Rates
    useTransactionsStore.ts        # In‑memory “ledger” of recent transfers
App.tsx                            # Entry point; wires SafeArea + SendTransactionScreen
tailwind.config.js                 # Theme + NativeWind config (primary/danger colours)
```

---

## 🌍 Countries & Validation Rules

All static country metadata lives in `src/lib/validation.ts`:

- Supported countries:
  - **Kenya** (KES, `+254`)
  - **Nigeria** (NGN, `+234`)
  - **Tanzania** (TZS, `+255`)
  - **Uganda** (UGX, `+256`)
- Per‑country metadata:
  - Local dialling prefix
  - Expected number of digits *after* the prefix
  - Display currency code

### Amount validation

Implemented via `validateAmount(raw: string)`:

- Required – empty string is not allowed
- Must be a **whole number** (no decimals, only digits)
- Must be strictly greater than zero
- Returns a typed result so the screen can cleanly branch on `.ok`:

```ts
type AmountValidation =
  | { ok: true; error: null; value: number }
  | { ok: false; error: string };
```

### Phone validation

Implemented via `validatePhone(localPart, country)`:

- Strips non‑digits
- Requires at least 1 digit
- Requires exactly `meta.digits` digits after the prefix for the chosen country
- Returns `{ ok, error, sanitized }`, so the UI can build a full phone number like:
  `+254` + `sanitized`

The screen uses these helpers to show inline field messages *and* to aggregate
validations into a single `Alert` when the user taps “Send” with invalid data.

---

## 💱 FX Rates & Formatting

### Exchange store (`useExchangeStore`)

I keep FX logic in a dedicated Zustand store instead of calling `fetch` directly
from the screen. This keeps the UI focused on rendering and interaction.

The store exposes:

- `rates: Partial<Record<CurrencyCode, number>>`
- `loading: boolean`
- `error: string | null`
- `fetchRates: () => Promise<void>`

Behaviour:

- Reads the API key from `process.env.EXPO_PUBLIC_OXR_APP_ID`
- Calls the Open Exchange Rates `latest.json` endpoint
- Extracts and caches only the currencies we care about: `KES`, `NGN`, `TZS`, `UGX`
- Avoids refetching if rates already exist
- Propagates errors as a simple string for the UI

### `useFxRates` hook

A tiny hook in `src/hooks/useFxRates.ts` wires the store into the component tree:

- Subscribes to `rates`, `loading`, `error` and `fetchRates`
- Calls `fetchRates()` in a `useEffect` on first mount
- Returns `{ rates, loading, error }` to the screen

### Currency formatting

In `src/lib/formatters.ts` I format the converted amount as:

- A number multiplied by the current rate
- Rounded to 2 decimals
- Displayed with standard `toLocaleString` formatting (e.g. `145,337.98` instead of `145337.98`)

The “Est. receive” card shows the converted amount and currency, and the FX card
also shows:

```text
1 USD ≈ {rate} {CURRENCY}
```
---

## ⚙️ Environment & Setup

### 1. Install dependencies

```bash
npm install
```

### 3. Run the app

```bash
# iOS
npm run ios

# Android
npm run android
```

(Or the equivalent yarn commands if you prefer Yarn.)

---

## ⏱ Further improvements

Since this is an interview demo and not a production banking app, I intentionally
made some trade‑offs to keep the scope reasonable. These are worth calling out
explicitly if you’re walking someone through the code:

1. **No persistence layer yet**
   - Transaction history is stored only in memory via Zustand.
   - On app reload, history is cleared.
   - In a real system, I’d plug this into AsyncStorage or a backend API.

2. **Happy‑path API handling**
   - The FX store handles network failure with a simple string error and a graceful UI message.
   - I don’t do retries, exponential backoff, or rate‑limit handling.
   - For an actual production client, I’d want more robust error semantics and logging.

3. **Single‑screen experience**
   - Everything happens on one screen to make the demo easy to read in a short interview.
   - A real app would likely split “Send”, “History”, and “Transfer details” into separate routes.

4. **Minimal accessibility work**
   - I’ve kept font sizes and colours sensible for a dark theme.
   - I haven’t done full screen reader labelling, large‑text scaling tests, or haptic feedback tuning yet.

5. **No automated tests in this demo**
   - Given time constraints, I focused on the UX flow and clean separation of concerns.
   - For a production app I’d add:
     - Unit tests around `validateAmount`, `validatePhone`, and formatters
     - A few component tests for the send flow and history store

6. **FX provider locked to Open Exchange Rates**
   - Right now the store is hard‑wired to the Open Exchange Rates API shape.
   - In a real codebase, I’d abstract this behind an interface so I can swap providers or attach mocks more easily.

These compromises are deliberate: they keep the codebase small enough to grok quickly
in an interview, while still showing how I think about structure, UX, and data flow.

---