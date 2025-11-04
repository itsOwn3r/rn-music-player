import LoadingScreen from "@/components/LoadingScreen";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function NotificationRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    // 🚫 Do nothing if we're already on the Playing screen
    if (pathname !== "/Playing") {
      router.dismissTo("/Playing");
    }
  }, [pathname]);

  return (
    <View className="size-full flex-1 bg-black">
      <LoadingScreen />
    </View>
  );
}
