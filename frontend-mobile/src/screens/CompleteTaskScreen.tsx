import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { uploadFormData } from "../api/client";
import { Button } from "../components/Button";
import { createImagePart } from "../utils/upload";
import type { RootStackParamList } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "CompleteTask">;

export function CompleteTaskScreen({ navigation, route }: Props) {
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Photos required", "Allow photo library access to attach task proof images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImages(result.assets.slice(0, 5));
    }
  };

  const submitCompletion = async () => {
    if (!selectedImages.length) {
      Alert.alert("Images required", "Select at least one proof image before completing the task.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      selectedImages.forEach((image, index) => {
        formData.append(
          "images",
          createImagePart(
            image.uri,
            image.fileName ?? `proof-${index + 1}.jpg`,
            image.mimeType
          )
        );
      });

      await uploadFormData(`/task-instance/${route.params.taskId}/complete`, formData);

      Alert.alert("Task completed", `${route.params.taskTitle} was completed successfully.`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Completion failed", error?.response?.data?.message ?? "Unable to complete task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{route.params.taskTitle}</Text>
      <Text style={styles.copy}>
        Upload up to 5 proof images. The backend will store their Cloudinary URLs on the task instance.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Selected images</Text>
        {selectedImages.length ? (
          selectedImages.map((image) => (
            <View key={image.uri} style={styles.imageRow}>
              <Text numberOfLines={1} style={styles.imageName}>
                {image.fileName ?? image.uri.split("/").pop() ?? "Selected image"}
              </Text>
              <Text style={styles.imageMeta}>{Math.round((image.fileSize ?? 0) / 1024)} KB</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No proof images selected yet.</Text>
        )}
      </View>

      <Button label="Choose Proof Images" onPress={() => void pickImages()} variant="secondary" />
      <Button label="Complete Task" onPress={() => void submitCompletion()} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  heading: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: "#17231f",
  },
  copy: {
    color: "#5e6d66",
    lineHeight: 21,
  },
  panel: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#ddd3c1",
    gap: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17231f",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#f7f1e5",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  imageName: {
    flex: 1,
    color: "#22342e",
    fontWeight: "600",
  },
  imageMeta: {
    color: "#6f756d",
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    color: "#72796f",
    lineHeight: 21,
  },
});
