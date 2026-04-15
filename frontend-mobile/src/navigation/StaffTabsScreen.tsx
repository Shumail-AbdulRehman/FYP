import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreen } from "../screens/HomeScreen";
import { TasksScreen } from "../screens/TasksScreen";
import type { RootStackParamList, StaffTabId, TaskInstance } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "StaffTabs">;

const tabs: Array<{
  id: StaffTabId;
  label: string;
}> = [
  { id: "Shift", label: "Shift" },
  { id: "Tasks", label: "Tasks" },
];

export function StaffTabsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<StaffTabId>("Shift");
  const [refreshToken, setRefreshToken] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshToken((value) => value + 1);
    }, [])
  );

  const tabBarInset = Math.max(insets.bottom, 12);
  const contentBottomInset = tabBarInset + 112;

  const handleStartTask = (task: TaskInstance) => {
    navigation.navigate("QrScanner", {
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const handleCompleteTask = (task: TaskInstance) => {
    navigation.navigate("CompleteTask", {
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  return (
    <View style={styles.shell}>
      <View style={styles.screenArea}>
        {activeTab === "Shift" ? (
          <HomeScreen
            bottomInset={contentBottomInset}
            isActive
            onOpenTasksTab={() => setActiveTab("Tasks")}
            refreshToken={refreshToken}
            topInset={insets.top}
          />
        ) : (
          <TasksScreen
            bottomInset={contentBottomInset}
            isActive
            onCompleteTask={handleCompleteTask}
            onStartTask={handleStartTask}
            refreshToken={refreshToken}
            topInset={insets.top}
          />
        )}
      </View>

      <View style={[styles.tabBarWrap, { paddingBottom: tabBarInset }]}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}
              >
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#f4f0e8",
  },
  screenArea: {
    flex: 1,
  },
  tabBarWrap: {
    position: "absolute",
    right: 18,
    bottom: 0,
    left: 18,
  },
  tabBar: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#d4c9b5",
    backgroundColor: "#fffaf0",
    padding: 10,
    shadowColor: "#14211d",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4ede1",
  },
  tabButtonActive: {
    backgroundColor: "#1d4f45",
  },
  tabLabel: {
    color: "#5f6d67",
    fontSize: 13,
    fontWeight: "800",
  },
  tabLabelActive: {
    color: "#f7f5ef",
  },
});
