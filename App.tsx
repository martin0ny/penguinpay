import "./global.css";
import React, { useEffect, useState } from "react";
import { View, SafeAreaView, StatusBar } from "react-native";
import { colorScheme } from "nativewind";
import { SendTransactionScreen } from "./screens/SendTransactionScreen";

type Theme = "light" | "dark";

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");

  // Keep NativeWind's global colorScheme in sync so `dark:` classes work
  useEffect(() => {
    colorScheme.set(currentTheme);
  }, [currentTheme]);

  const isDark = currentTheme === "dark";

  const toggleTheme = () =>
    setCurrentTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    // Root wrapper owns the dark/light class and the global background
    <View
      className={
        isDark
          ? "dark flex-1 bg-app-bg-dark"
          : "flex-1 bg-app-bg-light"
      }
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#020617" : "#f9fafb"}
      />

      {/* SafeAreaView is transparent so it inherits the root bg */}
      <SafeAreaView className="flex-1 bg-transparent">
        <SendTransactionScreen
          colorScheme={currentTheme}
          onToggleTheme={toggleTheme}
        />
      </SafeAreaView>
    </View>
  );
}