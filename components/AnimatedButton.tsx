import { useEffect } from "react";
import { Text, TouchableWithoutFeedback } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const AnimatedButton = ({
  label,
  color,
  disabled,
  onPress,
}: {
  label: string;
  color: "green" | "cyan";
  disabled?: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
    shadowRadius: 30 * glow.value,
  }));

  const bgColor =
    color === "green"
      ? disabled
        ? "bg-gray-700"
        : "bg-green-600"
      : disabled
        ? "bg-gray-700"
        : "bg-cyan-600";

  const shadowColor =
    color === "green" ? "shadow-green-400/60" : "shadow-cyan-400/60";

  return (
    <TouchableWithoutFeedback
      onPressIn={() => (scale.value = withTiming(0.96, { duration: 100 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View
        className={`py-4 rounded-2xl items-center shadow-lg ${bgColor} ${shadowColor}`}
        style={animatedStyle}
      >
        <Text className="text-white text-base font-semibold tracking-wide">
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
