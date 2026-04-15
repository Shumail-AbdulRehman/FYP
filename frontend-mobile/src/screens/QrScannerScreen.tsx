import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button } from "../components/Button";
import { client } from "../api/client";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "QrScanner">;

const extractQrToken = (raw: string) => {
  try {
    const url = new URL(raw);
    return url.searchParams.get("qrToken") || raw.trim();
  } catch {
    return raw.trim();
  }
};

export function QrScannerScreen({ navigation, route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanEnabled, setIsScanEnabled] = useState(true);

  const handleScanned = async (rawValue: string) => {
    if (!isScanEnabled || isSubmitting) {
      return;
    }

    try {
      setIsScanEnabled(false);
      setIsSubmitting(true);

      await client.post(
        `/task-instance/${route.params.taskId}/start`,
        undefined,
        {
          params: {
            qrToken: extractQrToken(rawValue),
          },
        }
      );

      Alert.alert("Task started", `${route.params.taskTitle} is now in progress.`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Start failed", error?.response?.data?.message ?? "Unable to start task.");
      setIsScanEnabled(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission) {
    return <View style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Camera access is required</Text>
        <Text style={styles.permissionCopy}>
          The mobile app uses your camera to scan the QR code attached to the task location or template.
        </Text>
        <Button label="Allow Camera" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={
          isScanEnabled
            ? ({ data }) => {
                void handleScanned(data);
              }
            : undefined
        }
      />

      <View style={styles.overlay}>
        <Text style={styles.kicker}>Scan QR</Text>
        <Text style={styles.title}>{route.params.taskTitle}</Text>
        <Text style={styles.copy}>
          Hold the code inside the frame. The app will start the task as soon as the QR token matches.
        </Text>

        <View style={styles.frame} />

        {!isScanEnabled ? (
          <Button label="Scan Again" onPress={() => setIsScanEnabled(true)} variant="secondary" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111",
  },
  centered: {
    flex: 1,
    backgroundColor: "#111",
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: "#f4f0e8",
    padding: 24,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 16,
  },
  permissionTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: "#17231f",
  },
  permissionCopy: {
    color: "#5e6d66",
    lineHeight: 21,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 18, 16, 0.40)",
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  kicker: {
    color: "#c1ece1",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#fffaf2",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },
  copy: {
    color: "#d4e8e2",
    lineHeight: 21,
  },
  frame: {
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#e8f4f1",
    backgroundColor: "transparent",
    marginVertical: 10,
  },
});
