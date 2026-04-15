import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { API_BASE_URL } from "../config";
import { useAuth } from "../auth/AuthContext";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Email and password are both required.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Unable to sign in.";

      const detail =
        !error?.response && API_BASE_URL.startsWith("http://")
          ? `${message}\n\nCurrent API URL: ${API_BASE_URL}\nIf this is a physical device, make sure the backend is reachable on the same network.`
          : message;

      Alert.alert("Login failed", detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Staff Mobile</Text>
        <Text style={styles.title}>Sign in and work the shift from your phone.</Text>
        <Text style={styles.subtitle}>
          QR start, live attendance, and proof uploads are wired to the existing backend.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="staff@cleanops.com"
            placeholderTextColor="#847d72"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#847d72"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <Button label="Sign In" onPress={handleLogin} loading={loading} />

        <Text style={styles.hint}>API base URL: {API_BASE_URL}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f0e8",
    padding: 24,
    justifyContent: "center",
    gap: 28,
  },
  hero: {
    gap: 10,
  },
  kicker: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#d9ebe5",
    color: "#146356",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: "#17231f",
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#566660",
    maxWidth: 320,
  },
  card: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#dcd2bf",
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#384a42",
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7ccb7",
    backgroundColor: "#f7f3ea",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#17231f",
  },
  hint: {
    color: "#7b7469",
    fontSize: 12,
  },
});
