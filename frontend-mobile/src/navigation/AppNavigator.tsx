import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import { StaffTabsScreen } from "./StaffTabsScreen";
import { CompleteTaskScreen } from "../screens/CompleteTaskScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { QrScannerScreen } from "../screens/QrScannerScreen";
import type { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" color="#146356" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f4f0e8",
        },
        headerTitleStyle: {
          color: "#17231f",
          fontWeight: "800",
        },
        contentStyle: {
          backgroundColor: "#f4f0e8",
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="StaffTabs"
            component={StaffTabsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="QrScanner" component={QrScannerScreen} options={{ title: "Scan Task QR" }} />
          <Stack.Screen
            name="CompleteTask"
            component={CompleteTaskScreen}
            options={{ title: "Complete Task" }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Staff Login", headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f0e8",
  },
});
