import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/auth/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f4f0e8",
    card: "#f4f0e8",
    text: "#17231f",
    border: "#d8d1c2",
    primary: "#146356",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
