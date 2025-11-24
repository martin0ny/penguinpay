// This is the main experience of the app: collecting details, validating them,
// doing the FX conversion and simulating a "send" with a small transaction history.
// I wanted it to feel like a focused, single-screen flow rather than a full-blown app.

import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { CountrySelect } from "../components/CountrySelect";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextField } from "../components/TextField";
import {
  COUNTRY_META,
  CountryCode,
  CurrencyCode,
  validateAmount,
  validatePhone,
} from "../lib/validation";
import { formatLocalAmount, formatShortTime } from "../lib/formatters";
import { useFxRates } from "../hooks/useFxRates";
import { useTransactionsStore } from "../store/useTransactionsStore";

// I keep the data I show in the confirmation sheet in a separate type.
// It’s basically a "snapshot" of the form at the time the user taps Send.
type ReviewData = {
  fullName: string;
  countryCode: CountryCode;
  phone: string;
  usdAmount: number;
  localAmount: string;
  currency: CurrencyCode;
  fxRate: number;
};

type Theme = "light" | "dark";

type Props = {
  colorScheme: Theme;
  onToggleTheme: () => void;
};

export const SendTransactionScreen: React.FC<Props> = ({
                                                         colorScheme,
                                                         onToggleTheme,
                                                       }) => {
  const isDark = colorScheme === "dark";

  // This hook encapsulates the FX fetching logic + loading/error state.
  // Under the hood it uses a zustand store so I can reuse rates on other screens later.
  const { rates, loading, error } = useFxRates();

  // Transaction history lives in a small zustand store.
  // For this demo I keep it in memory, but it could easily be swapped
  // to persistent storage or a backend.
  const transactions = useTransactionsStore((s) => s.items);
  const addTransaction = useTransactionsStore((s) => s.add);
  const clearHistory = useTransactionsStore((s) => s.clear);

  // Form state – I keep this local to the screen because it's tightly coupled
  // to this single flow.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState<CountryCode>("KE");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [usdAmount, setUsdAmount] = useState("");

  // I track "touched" state so that validation messages only show after the
  // user interacts or after they try to submit. That keeps the form from
  // shouting errors at them immediately.
  const [touchedFirstName, setTouchedFirstName] = useState(false);
  const [touchedLastName, setTouchedLastName] = useState(false);
  const [touchedPhone, setTouchedPhone] = useState(false);
  const [touchedAmount, setTouchedAmount] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // When review is non-null, I show the confirmation sheet at the bottom.
  const [review, setReview] = useState<ReviewData | null>(null);

  // This is separate from the FX loading state – it models the "sending" step,
  // so I can show a spinner on the confirm button.
  const [sending, setSending] = useState(false);

  // I use a transient "toast-like" message when a transfer is completed.
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const meta = COUNTRY_META[country];

  // I treat the first/last name as one validation unit.
  const nameValid =
    firstName.trim().length > 0 && lastName.trim().length > 0;

  const nameError =
    !nameValid && (touchedFirstName || touchedLastName || submitted)
      ? "Please enter first and last name"
      : null;

  const amountValidation = validateAmount(usdAmount);
  const amountError =
    !amountValidation.ok && (touchedAmount || submitted)
      ? amountValidation.error
      : null;

  const phoneValidation = validatePhone(phoneLocal, country);
  const phoneError =
    !phoneValidation.ok && (touchedPhone || submitted)
      ? phoneValidation.error
      : null;

  // I memoize the converted amount so I only recompute when the amount or rate changes.
  const localAmountText = useMemo(() => {
    if (!amountValidation.ok) return null;
    const rate = rates[meta.currency];
    return formatLocalAmount(amountValidation.value, rate);
  }, [amountValidation, rates, meta.currency]);

  // Single source of truth for whether the CTA should be enabled.
  const canSend =
    nameValid &&
    amountValidation.ok &&
    phoneValidation.ok &&
    !loading &&
    !error &&
    !sending;

  function handleSend() {
    // Once the user taps send, I consider the form "submitted" so all errors are visible.
    setSubmitted(true);
    setTouchedFirstName(true);
    setTouchedLastName(true);
    setTouchedPhone(true);
    setTouchedAmount(true);

    // If any field is invalid, I surface all relevant messages in one alert
    // rather than stopping at the first error.
    if (!nameValid || !amountValidation.ok || !phoneValidation.ok) {
      const messages = [
        !nameValid && "Please enter first and last name",
        !amountValidation.ok && amountValidation.error,
        !phoneValidation.ok && phoneValidation.error,
      ].filter(Boolean) as string[];

      Alert.alert("Check details", messages.join("\n"));
      return;
    }

    const rate = rates[meta.currency];
    if (!rate) {
      Alert.alert(
        "Rate unavailable",
        "Live rate for this currency is not available. Please try again."
      );
      return;
    }

    if (!localAmountText) {
      Alert.alert(
        "Unable to calculate",
        "Something went wrong while calculating the converted amount."
      );
      return;
    }

    const fullPhone = `${meta.prefix}${phoneValidation.sanitized}`;

    // Instead of sending immediately, I move into a "review" state and show
    // a confirmation sheet. This is where I’d plug in KYC/compliance checks in a real app.
    setReview({
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      countryCode: country,
      phone: fullPhone,
      usdAmount: amountValidation.value,
      localAmount: localAmountText,
      currency: meta.currency,
      fxRate: rate,
    });
  }

  function handleCancelReview() {
    setReview(null);
  }

  async function handleConfirmSend() {
    if (!review) return;

    try {
      setSending(true);

      /* I simulate a network call here. In a real system this would be where
         I call an API, handle errors and possibly show a "pending" state. */
      await new Promise((resolve) => setTimeout(resolve, 1400));

      /* Once "sent", I add it to a small in-memory history so I can
         show recent transfers at the bottom of the screen. */
      addTransaction({
        recipientName: review.fullName,
        country: review.countryCode,
        currency: review.currency,
        phone: review.phone,
        usdAmount: review.usdAmount,
        localAmount: review.localAmount,
        fxRate: review.fxRate,
      });

      // For feedback I show a short-lived banner instead of a blocking alert.
      setSentMessage(
        `Transfer sent: ${review.usdAmount} USD to ${review.fullName} (${review.currency} ${review.localAmount}).`
      );
      setTimeout(() => setSentMessage(null), 4000);

      /* After a successful send I reset the form to a clean state.
         I also reset the "touched" flags so validation only reappears as the user types. */
      setFirstName("");
      setLastName("");
      setCountry("KE");
      setPhoneLocal("");
      setUsdAmount("");
      setTouchedFirstName(false);
      setTouchedLastName(false);
      setTouchedPhone(false);
      setTouchedAmount(false);
      setSubmitted(false);
    } finally {
      setSending(false);
      setReview(null);
    }
  }

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${
        isDark ? "bg-app-bg-dark" : "bg-app-bg-light"
      }`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 px-4 pt-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar – I use this as a subtle "demo" badge and an indicator that FX is live*/}
        <View className="mb-4 flex-row items-center justify-between">
          <Text
            className={`text-xs tracking-wide ${
              isDark ? "text-text-soft-dark" : "text-text-soft-light"
            }`}
          >
            PenguinPay demo
          </Text>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={onToggleTheme}
              className={`rounded-full border px-3 py-1 ${
                isDark
                  ? "border-border-subtle-dark"
                  : "border-border-subtle-light"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                {isDark ? "Light mode" : "Dark mode"}
              </Text>
            </TouchableOpacity>

            <View className="rounded-full bg-success-soft px-3 py-1">
              <Text className="text-xs font-medium text-success">
                Live FX
              </Text>
            </View>
          </View>
        </View>

        {/* Success banner – instead of an alert, I wanted a softer, inline confirmation. */}
        {sentMessage && (
          <View className="mb-3 rounded-2xl border border-success-border bg-success-soft px-4 py-3">
            <Text className="mb-1 text-xs text-success-text">
              ✅ Transaction sent
            </Text>
            <Text
              className={`text-sm ${
                isDark ? "text-text-strong-dark" : "text-text-strong-light"
              }`}
            >
              {sentMessage}
            </Text>
          </View>
        )}

        <Text
          className={`mb-3 text-2xl font-semibold ${
            isDark ? "text-text-strong-dark" : "text-text-strong-light"
          }`}
        >
          Send money
        </Text>
        {/* FX summary card – this gives an at-a-glance snapshot of who I'm sending to
           and roughly how much they'll receive, even before I scroll. */}

        <View
          className={`mb-6 rounded-2xl border px-4 py-4 ${
            isDark
              ? "border-border-subtle-dark bg-card-bg-dark"
              : "border-border-subtle-light bg-card-bg-light"
          }`}
        >
          <Text
            className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
              isDark ? "text-text-soft-dark" : "text-text-soft-light"
            }`}
          >
            Sending to
          </Text>
          <Text
            className={`text-base ${
              isDark ? "text-text-strong-dark" : "text-text-strong-light"
            }`}
          >
            {firstName || lastName
              ? `${firstName || "First"} ${lastName || "name"}`
              : "Recipient name"}
          </Text>
          <Text
            className={`mb-1 text-xs ${
              isDark ? "text-text-soft-dark" : "text-text-soft-light"
            }`}
          >
            {COUNTRY_META[country].name} • {COUNTRY_META[country].currency}
          </Text>

          <View className="mt-3 flex-row justify-between">
            <View>
              <Text
                className={`mb-0.5 text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                Est. receive
              </Text>
              <Text
                className={`text-lg font-semibold ${
                  isDark ? "text-text-strong-dark" : "text-text-strong-light"
                }`}
              >
                {localAmountText
                  ? `${localAmountText} ${meta.currency}`
                  : "--"}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className={`mb-0.5 text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                FX rate
              </Text>
              <Text
                className={`text-xs ${
                  isDark ? "text-text-main-dark" : "text-text-main-light"
                }`}
              >
                1 USD ≈{" "}
                {rates[meta.currency]
                  ? rates[meta.currency].toFixed(2)
                  : "--"}{" "}
                {meta.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Form section – I split it into clear blocks so it’s easy to talk through:
           recipient details, phone, then amount. */}
        <Text
          className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
            isDark ? "text-text-main-dark" : "text-text-main-light"
          }`}
        >
          Recipient details
        </Text>

        {/* Name row */}
        <View className="mb-2 flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              onBlur={() => setTouchedFirstName(true)}
              placeholder="Jane"
              autoCapitalize="words"
              error={nameError}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              onBlur={() => setTouchedLastName(true)}
              placeholder="Doe"
              autoCapitalize="words"
              error={nameError}
            />
          </View>
        </View>

        {/* Country selector – this uses a custom component so I can style the
           corridors the way I want (pills instead of a dropdown). */}
        <CountrySelect value={country} onChange={setCountry} />

        {/* Phone */}
        <Text
          className={`mb-1 text-sm ${
            isDark ? "text-text-main-dark" : "text-text-main-light"
          }`}
        >
          Phone number
        </Text>
        <View className="mb-1 flex-row items-center">
          {/* I show the prefix separately so users don’t accidentally retype it. */}
          <View
            className={`rounded-l-lg border px-3 py-2 ${
              isDark
                ? "border-input-border-dark bg-input-bg-dark"
                : "border-input-border-light bg-input-bg-light"
            }`}
          >
            <Text
              className={
                isDark ? "text-text-strong-dark" : "text-text-strong-light"
              }
            >
              {meta.prefix}
            </Text>
          </View>
          <TextInput
            value={phoneLocal}
            onChangeText={(txt) =>
              setPhoneLocal(txt.replace(/[^\d]/g, ""))
            }
            onBlur={() => setTouchedPhone(true)}
            keyboardType="number-pad"
            placeholder={"".padStart(meta.digits, "0")}
            placeholderTextColor="#9ca3af"
            className={`flex-1 rounded-r-lg border border-l-0 px-3 py-2 ${
              isDark
                ? "border-input-border-dark bg-input-bg-dark text-text-strong-dark"
                : "border-input-border-light bg-input-bg-light text-text-strong-light"
            }`}
          />
        </View>
        {phoneError && (
          <Text className="mb-2 text-xs text-danger">{phoneError}</Text>
        )}

        {/* Amount */}
        <Text
          className={`mb-1 mt-4 text-xs font-semibold uppercase tracking-wide ${
            isDark ? "text-text-main-dark" : "text-text-main-light"
          }`}
        >
          Amount
        </Text>
        <TextField
          label="Amount in USD"
          value={usdAmount}
          onChangeText={(txt) =>
            setUsdAmount(txt.replace(/[^\d]/g, ""))
          }
          onBlur={() => setTouchedAmount(true)}
          keyboardType="number-pad"
          placeholder="50"
          error={amountError}
        />

        {/* Quick chips – I like these because they make it easy to demo “preset amounts”
           and they show how I think about micro-interactions. */}
        <View className="mb-4 flex-row gap-2">
          {[50, 100, 200].map((v) => {
            const active = usdAmount === String(v);
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setUsdAmount(String(v))}
                className={`rounded-lg border px-3 py-1.5 ${
                  active
                    ? "border-primary bg-primary"
                    : isDark
                      ? "border-input-border-dark bg-card-bg-dark"
                      : "border-input-border-light bg-card-bg-light"
                }`}
              >
                <Text
                  className={`text-xs ${
                    active
                      ? "font-semibold text-white"
                      : isDark
                        ? "text-text-main-dark"
                        : "text-text-main-light"
                  }`}
                >
                  ${v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Send button – I reuse the same component, but I swap labels based on
           the current state so the user always knows what’s happening. */}
        <PrimaryButton
          title={
            sending
              ? "Sending..."
              : loading
                ? "Fetching rates..."
                : "Send"
          }
          onPress={handleSend}
          loading={sending}
          // disabled={!canSend}
        />

        {/* Recent transfers – I added this to show that I’m thinking about state
           beyond a single screen and to mimic a lightweight activity feed. */}
        {transactions.length > 0 && (
          <>
            <View className="mb-2 mt-8 flex-row items-center justify-between">
              <Text
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? "text-text-main-dark" : "text-text-main-light"
                }`}
              >
                Recent transfers
              </Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text
                  className={`text-[11px] ${
                    isDark ? "text-text-soft-dark" : "text-text-soft-light"
                  }`}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>

            <View
              className={`mb-6 overflow-hidden rounded-2xl border ${
                isDark
                  ? "border-border-subtle-dark bg-card-bg-dark/80"
                  : "border-border-subtle-light bg-card-bg-light/80"
              }`}
            >
              {transactions.map((tx, index) => (
                <View
                  key={tx.id}
                  className={`px-4 py-3 ${
                    index < transactions.length - 1
                      ? isDark
                        ? "border-b border-border-subtle-dark"
                        : "border-b border-border-subtle-light"
                      : ""
                  }`}
                >
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text
                      className={`flex-1 text-sm font-medium ${
                        isDark
                          ? "text-text-strong-dark"
                          : "text-text-strong-light"
                      }`}
                      numberOfLines={1}
                    >
                      {tx.recipientName}
                    </Text>
                    <Text
                      className={`ml-3 text-[11px] ${
                        isDark
                          ? "text-text-soft-dark"
                          : "text-text-soft-light"
                      }`}
                    >
                      {formatShortTime(tx.createdAt)}
                    </Text>
                  </View>

                  <View className="flex-row items-end justify-between">
                    <View className="flex-1">
                      <Text
                        className={`text-[11px] ${
                          isDark
                            ? "text-text-soft-dark"
                            : "text-text-soft-light"
                        }`}
                      >
                        {COUNTRY_META[tx.country].name} • {tx.currency}
                      </Text>
                      <Text
                        className={`text-[11px] ${
                          isDark
                            ? "text-text-soft-dark"
                            : "text-text-soft-light"
                        }`}
                      >
                        {tx.phone}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-[11px] ${
                          isDark
                            ? "text-text-soft-dark"
                            : "text-text-soft-light"
                        }`}
                      >
                        You sent
                      </Text>
                      <Text
                        className={`text-sm font-semibold ${
                          isDark
                            ? "text-text-strong-dark"
                            : "text-text-strong-light"
                        }`}
                      >
                        {tx.usdAmount} USD
                      </Text>
                      <Text className="text-xs text-success">
                        {tx.localAmount} {tx.currency}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Spacer so the last item isn't hidden behind the home indicator */}
        <View className="h-10" />
      </ScrollView>

      {/* Review sheet overlay – I deliberately keep this super lightweight instead of
         pulling in a full modal library, just to show I can build my own micro-UX. */}
      {review && (
        <View className="absolute inset-x-0 bottom-0 px-4 pb-8">
          <View
            className={`rounded-3xl border px-4 py-4 ${
              isDark
                ? "border-border-subtle-dark bg-card-bg-dark"
                : "border-border-subtle-light bg-card-bg-light"
            }`}
          >
            <Text
              className={`mb-2 text-sm font-semibold ${
                isDark ? "text-text-strong-dark" : "text-text-strong-light"
              }`}
            >
              Confirm transfer
            </Text>
            <Text
              className={`mb-3 text-xs ${
                isDark ? "text-text-soft-dark" : "text-text-soft-light"
              }`}
            >
              Please review the details before sending.
            </Text>

            <View className="mb-3">
              <Text
                className={`text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                Recipient
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? "text-text-strong-dark" : "text-text-strong-light"
                }`}
              >
                {review.fullName}
              </Text>
              <Text
                className={`text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                {COUNTRY_META[review.countryCode].name} • {review.currency}
              </Text>
            </View>

            <View className="mb-3">
              <Text
                className={`text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                Phone number
              </Text>
              <Text
                className={`text-sm ${
                  isDark ? "text-text-strong-dark" : "text-text-strong-light"
                }`}
              >
                {review.phone}
              </Text>
            </View>

            <View className="mb-4 flex-row justify-between">
              <View>
                <Text
                  className={`text-xs ${
                    isDark ? "text-text-soft-dark" : "text-text-soft-light"
                  }`}
                >
                  You send
                </Text>
                <Text
                  className={`text-base font-semibold ${
                    isDark ? "text-text-strong-dark" : "text-text-strong-light"
                  }`}
                >
                  {review.usdAmount} USD
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className={`text-xs ${
                    isDark ? "text-text-soft-dark" : "text-text-soft-light"
                  }`}
                >
                  Recipient gets
                </Text>
                <Text
                  className={`text-base font-semibold ${
                    isDark ? "text-text-strong-dark" : "text-text-strong-light"
                  }`}
                >
                  {review.localAmount} {review.currency}
                </Text>
                <Text
                  className={`mt-0.5 text-[11px] ${
                    isDark ? "text-text-soft-dark" : "text-text-soft-light"
                  }`}
                >
                  Rate: 1 USD ≈ {review.fxRate.toFixed(2)} {review.currency}
                </Text>
              </View>
            </View>

            <PrimaryButton
              title={sending ? "Sending..." : "Confirm & send"}
              onPress={handleConfirmSend}
              loading={sending}
            />

            <TouchableOpacity
              onPress={handleCancelReview}
              disabled={sending}
              className="mt-3 items-center"
            >
              <Text
                className={`text-xs ${
                  isDark ? "text-text-soft-dark" : "text-text-soft-light"
                }`}
              >
                Cancel and edit details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};