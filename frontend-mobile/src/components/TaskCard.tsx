import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { formatTaskWindow } from "../utils/format";
import type { TaskInstance } from "../types";

type TaskCardProps = {
  task: TaskInstance;
  onStart?: () => void;
  onComplete?: () => void;
};

export function TaskCard({ task, onStart, onComplete }: TaskCardProps) {
  const statusTone = statusStyles[task.status] ?? statusStyles.PENDING;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.subtitle}>
            {task.template?.location?.name ?? "Assigned location"}
          </Text>
        </View>

        <View style={[styles.badge, statusTone.badge]}>
          <Text style={[styles.badgeText, statusTone.label]}>{task.status}</Text>
        </View>
      </View>

      <Text style={styles.window}>{formatTaskWindow(task.shiftStart, task.shiftEnd)}</Text>

      {task.status === "PENDING" && onStart ? (
        <Button label="Scan QR To Start" onPress={onStart} style={styles.button} />
      ) : null}

      {task.status === "IN_PROGRESS" && onComplete ? (
        <Button
          label="Upload Proof And Complete"
          onPress={onComplete}
          variant="secondary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#dfd4c2",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17231f",
  },
  subtitle: {
    color: "#5f6d67",
    fontSize: 13,
  },
  window: {
    color: "#33453d",
    fontSize: 14,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  button: {
    marginTop: 2,
  },
});

const statusStyles = {
  PENDING: StyleSheet.create({
    badge: { backgroundColor: "#efe0b6" },
    label: { color: "#77540f" },
  }),
  IN_PROGRESS: StyleSheet.create({
    badge: { backgroundColor: "#cde8e3" },
    label: { color: "#0d5f52" },
  }),
  COMPLETED: StyleSheet.create({
    badge: { backgroundColor: "#d8e9ca" },
    label: { color: "#355f1c" },
  }),
  MISSED: StyleSheet.create({
    badge: { backgroundColor: "#f4d3d0" },
    label: { color: "#842f29" },
  }),
  CANCELLED: StyleSheet.create({
    badge: { backgroundColor: "#e6e3de" },
    label: { color: "#665f54" },
  }),
  NOT_COMPLETED_INTIME: StyleSheet.create({
    badge: { backgroundColor: "#ead8f3" },
    label: { color: "#693387" },
  }),
};
