import { useColorScheme } from "react-native";

interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  text: string;
  icon: string;
  textMuted: string;
  maximumTrackTintColor: string;
  minimumTrackTintColor: string;
}

export function useColors(): ColorPalette {
  const colorScheme = useColorScheme(); // 'light' or 'dark'

  // Define the colors based on the color scheme
  const lightColors: ColorPalette = {
    primary: "#2563eb",
    secondary: "#3b82f6",
    background: "#f9fafb",
    foreground: "#1f2937",
    text: "#000",
    icon: "#000",
    textMuted: "#6b7280",
    maximumTrackTintColor: "rgba(0,0,0,0.3)",
    minimumTrackTintColor: "rgba(0,0,0,0.5)",
  };

  const darkColors: ColorPalette = {
    primary: "#fc3c44",
    secondary: "#f472b6",
    background: "#000",
    foreground: "#fff",
    text: "#fff",
    icon: "#fff",
    textMuted: "#9ca3af",
    maximumTrackTintColor: "rgba(255,255,255,0.4)",
    minimumTrackTintColor: "rgba(255,255,255,0.6)",
  };

  return colorScheme === "dark" ? darkColors : lightColors;
}

export const fontSize = {
  xs: 12,
  sm: 16,
  base: 20,
  lg: 24,
};

export const screenPadding = {
  horizontal: 24,
};
