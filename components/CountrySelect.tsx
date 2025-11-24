/*
This component is intentionally tiny but opinionated.
Instead of a generic dropdown, I use pill-style buttons so it's
obvious which countries the product currently supports. It also looks nicer in a demo.
*/
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { COUNTRY_META, CountryCode } from "../lib/validation";

type Props = {
  // Currently selected corridor
  value: CountryCode;
  // I keep this stateless and push the selection up via onChange
  onChange: (country: CountryCode) => void;
};

export const CountrySelect: React.FC<Props> = ({ value, onChange }) => {
  /*I derive the list of countries from the shared COUNTRY_META map so I don't
  have to duplicate config in multiple places.*/
  const countries = Object.keys(COUNTRY_META) as CountryCode[];

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm text-text-main-light dark:text-text-main-dark">
        Recipient country
      </Text>

      {/* I went for a 2-column, wrap-able layout instead of a horizontal scroll.
          It scales okay to a handful of markets and feels more "tapable" on mobile. */}
      <View className="flex-row flex-wrap gap-2">
        {countries.map((code) => {
          const meta = COUNTRY_META[code];
          const active = code === value;

          const containerClasses = [
            "flex-[0.48] px-3 py-2 rounded-xl border",
            active
              ? "bg-primary border-primary"
              : "bg-card-bg-light dark:bg-card-bg-dark border-input-border-light dark:border-input-border-dark",
          ].join(" ");

          const nameClasses = [
            "text-center text-xs",
            active
              ? "text-white font-semibold"
              : "text-text-main-light dark:text-text-main-dark",
          ].join(" ");

          const currencyClasses = [
            "mt-0.5 text-center text-[10px]",
            active
              ? "text-white/80"
              : "text-text-soft-light dark:text-text-soft-dark",
          ].join(" ");

          return (
            <TouchableOpacity
              key={code}
              onPress={() => onChange(code)}
              activeOpacity={0.8}
              className={containerClasses}
            >
              <Text className={nameClasses} numberOfLines={1}>
                {meta.name}
              </Text>
              {/* I keep the country name as the main label and show the currency below.
                 "I'm reminding the user which payout currency they're targeting." */}
              <Text className={currencyClasses}>{meta.currency}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};