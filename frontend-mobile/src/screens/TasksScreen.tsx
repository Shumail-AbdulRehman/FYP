import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { client } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { TaskCard } from "../components/TaskCard";
import type { ApiEnvelope, TaskInstance } from "../types";

type TasksScreenProps = {
  isActive: boolean;
  refreshToken: number;
  topInset: number;
  bottomInset: number;
  onStartTask: (task: TaskInstance) => void;
  onCompleteTask: (task: TaskInstance) => void;
};

export function TasksScreen({
  isActive,
  refreshToken,
  topInset,
  bottomInset,
  onStartTask,
  onCompleteTask,
}: TasksScreenProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async () => {
    if (!user) {
      return;
    }

    const response = await client.get<ApiEnvelope<TaskInstance[]>>(
      `/task-instance/staff/${user.id}/today`
    );

    setTasks(response.data.data);
  };

  useEffect(() => {
    if (!isActive || !user) {
      return;
    }

    void loadTasks().catch(() => undefined);
  }, [isActive, refreshToken, user?.id]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTasks();
    } catch (error: any) {
      Alert.alert("Task refresh failed", error?.response?.data?.message ?? "Unable to load tasks.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + 20,
          paddingBottom: bottomInset,
        },
      ]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Task Queue</Text>
        <Text style={styles.heading}>Today's assigned work</Text>
        <Text style={styles.copy}>
          Start pending tasks by scanning the matching QR code, then upload proof images after the
          work is complete.
        </Text>
      </View>

      {tasks.length ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStart={task.status === "PENDING" ? () => onStartTask(task) : undefined}
            onComplete={task.status === "IN_PROGRESS" ? () => onCompleteTask(task) : undefined}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tasks for today</Text>
          <Text style={styles.emptyCopy}>
            Your manager has not assigned any active task instances for this shift.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: "#183932",
    gap: 10,
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#d1e7df",
    color: "#0f5f53",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  heading: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: "#f7f5ef",
  },
  copy: {
    color: "#c7ddd7",
    lineHeight: 21,
  },
  emptyState: {
    borderRadius: 26,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#ddd3c1",
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17231f",
  },
  emptyCopy: {
    color: "#66756f",
    lineHeight: 21,
  },
});
