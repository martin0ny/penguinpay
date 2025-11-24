import React from "react";
import { Text, TouchableOpacity, ActivityIndicator } from "react-native";

type Props = {
  // I keep the button API tiny on purpose: just a label and a click handler.
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const PrimaryButton: React.FC<Props> = ({
                                                 title,
                                                 onPress,
                                                 disabled,
                                                 loading,
                                               }) => {
   /*My rule of thumb is: if we're loading, we implicitly treat the button
   as disabled too, it avoids double submissions and makes the UI feel
   more intentional.*/
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center rounded-xl py-3 ${
        isDisabled ? "bg-primary/60" : "bg-primary"
      }`}
    >
      {loading ? (
        // For the loading state I don't try to get fancy, a simple spinner
        // reads better than animating the label in this context.
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-base font-semibold text-white">{title}</Text>
      )}
    </TouchableOpacity>
  );
};