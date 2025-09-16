// usePlayerBackground.ts
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import type { ImageColorsResult } from "react-native-image-colors";
import { getColors } from "react-native-image-colors";

const DEFAULT_COLOR = "#000000";

const pickColorFromResult = (colors: ImageColorsResult) => {
  if (!colors) return DEFAULT_COLOR;

  // android has: dominant, average, vibrant, darkVibrant, ...
  if (colors.platform === "android") {
    return (
      (colors as any).dominant ??
      (colors as any).vibrant ??
      (colors as any).average ??
      DEFAULT_COLOR
    );
  }

  // ios has: background, detail, primary, secondary
  if (colors.platform === "ios") {
    return (
      (colors as any).background ?? (colors as any).primary ?? DEFAULT_COLOR
    );
  }

  // web: hex is available
  if (colors.platform === "web") {
    return (colors as any).hex ?? DEFAULT_COLOR;
  }

  // fallback
  return (
    (colors as any).dominant ??
    (colors as any).background ??
    (colors as any).hex ??
    DEFAULT_COLOR
  );
};

const usePlayerBackground = (imageUrl?: string) => {
  const [currentColor, setCurrentColor] = useState<string>(DEFAULT_COLOR);
  const prevColorRef = useRef<string>(DEFAULT_COLOR);
  const anim = useRef(new Animated.Value(1)).current; // 1 => showing currentColor

  useEffect(() => {
    if (!imageUrl) return;

    let mounted = true;

    getColors(imageUrl, { fallback: DEFAULT_COLOR, cache: true, key: imageUrl })
      .then((colors: ImageColorsResult) => {
        if (!mounted) return;

        const newColor = pickColorFromResult(colors);
        console.log(
          "[usePlayerBackground] colors",
          colors.platform,
          colors,
          " -> picked:",
          newColor
        );

        if (!newColor || newColor === currentColor) {
          // nothing to do
          return;
        }

        // prepare animation from previous -> new
        prevColorRef.current = currentColor;
        setCurrentColor(newColor);

        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false, // color interpolation requires JS driver
        }).start();
      })
      .catch((err) => {
        console.warn("[usePlayerBackground] getColors failed:", err);
        // leave currentColor as-is (fallback)
      });

    return () => {
      mounted = false;
    };
  }, [imageUrl]);

  // Interpolate between prevColorRef.current and currentColor
  const animatedColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevColorRef.current, currentColor],
  });

  // return both the animated color (for Animated.View) and plain currentColor for logging/debugging
  return { animatedColor, currentColor, prevColor: prevColorRef.current };
};

export default usePlayerBackground;
