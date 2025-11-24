import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

type Props = {
  label: string;
  error?: string | null;
} & TextInputProps;

export const TextField: React.FC<Props> = ({ label, error, ...inputProps }) => {
  const hasError = !!error;

  return (
    <View className="mb-3">
      <Text
        className={
          hasError
            ? "mb-1 text-sm text-danger"
            : "mb-1 text-sm text-text-main-light dark:text-text-main-dark"
        }
      >
        {label}
      </Text>

      <TextInput
        {...inputProps}
        placeholderTextColor="#9ca3af"
        className={[
          "rounded-lg px-3 py-2 border",
          "bg-input-bg-light dark:bg-input-bg-dark",
          hasError
            ? "border-danger"
            : "border-input-border-light dark:border-input-border-dark",
          "text-text-strong-light dark:text-text-strong-dark",
        ].join(" ")}
      />

      {hasError && (
        <Text className="mt-1 text-xs text-danger">
          {error}
        </Text>
      )}
    </View>
  );
};