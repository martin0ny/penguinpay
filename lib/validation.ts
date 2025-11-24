export type CountryCode = "KE" | "NG" | "TZ" | "UG";
export type CurrencyCode = "KES" | "NGN" | "TZS" | "UGX";

export type CountryMeta = {
  name: string;
  currency: CurrencyCode;
  prefix: string;
  digits: number;
};

export const COUNTRY_META: Record<CountryCode, CountryMeta> = {
  KE: { name: "Kenya",    currency: "KES", prefix: "+254", digits: 9 },
  NG: { name: "Nigeria",  currency: "NGN", prefix: "+234", digits: 7 },
  TZ: { name: "Tanzania", currency: "TZS", prefix: "+255", digits: 9 },
  UG: { name: "Uganda",   currency: "UGX", prefix: "+256", digits: 7 },
};

export type AmountValidation =
  | { ok: true; error: null; value: number }
  | { ok: false; error: string; value?: undefined };

export function validateAmount(raw: string): AmountValidation {
  if (!raw) {
    return { ok: false, error: "Amount is required" };
  }
  if (!/^\d+$/.test(raw)) {
    return { ok: false, error: "Amount must be a whole number" };
  }
  const value = parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Amount must be greater than zero" };
  }
  return { ok: true, error: null, value };
}

export type PhoneValidation =
  | { ok: true; error: null; sanitized: string }
  | { ok: false; error: string; sanitized?: undefined };

export function validatePhone(
  localPart: string,
  country: CountryCode
): PhoneValidation {
  const meta = COUNTRY_META[country];
  const sanitized = localPart.replace(/\D/g, "");
  if (sanitized.length === 0) {
    return { ok: false, error: "Phone number is required" };
  }
  if (sanitized.length !== meta.digits) {
    return {
      ok: false,
      error: `Phone number must have ${meta.digits} digits after the prefix`,
    };
  }
  return { ok: true, error: null, sanitized };
}
