import { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export const StackScreenWithSearchBar: NativeStackNavigationOptions = {
  headerLargeTitle: true,
  headerTitleStyle: {
    fontSize: 32, // Adjust to your desired large title size
    fontWeight: "bold",
    color: "#fff",
  },
  headerLargeStyle: {
    backgroundColor: "#000",
  },
  headerLargeTitleStyle: {
    color: "#fff",
    fontSize: 38,
  },
  navigationBarHidden: false,
  headerStyle: {
    backgroundColor: "#000",
  },
  headerTintColor: "#fff",
  headerBlurEffect: "prominent",
  headerShadowVisible: false,
};
