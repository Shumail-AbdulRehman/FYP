import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { client, uploadFormData } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import type { ApiEnvelope, AttendanceRecord, TaskInstance } from "../types";
import {
  getCheckInOpenAt,
  getLateDeadline,
  getMinimumCheckoutAt,
  getRecommendedCheckoutAt,
  getRelevantAttendanceRecord,
  hasOpenCheckout,
} from "../utils/attendance";
import {
  formatAttendanceStatus,
  formatClockTime,
  formatShortDate,
  formatTaskWindow,
} from "../utils/format";
import { createImagePart } from "../utils/upload";

type AttendanceActionMode = "check-in" | "check-out";

type AttendanceViewModel = {
  statusLabel: string;
  tone: "accent" | "success" | "warning" | "danger" | "neutral";
  title: string;
  message: string;
  facts: Array<{
    label: string;
    value: string;
  }>;
  action: null | {
    mode: AttendanceActionMode;
    label: string;
    disabled: boolean;
    helper?: string;
  };
};

type HomeScreenProps = {
  isActive: boolean;
  refreshToken: number;
  topInset: number;
  bottomInset: number;
  onOpenTasksTab: () => void;
};

const buildAttendanceViewModel = ({
  record,
  hasAssignedLocation,
  now,
}: {
  record: AttendanceRecord | null;
  hasAssignedLocation: boolean;
  now: Date;
}): AttendanceViewModel => {
  if (!hasAssignedLocation) {
    return {
      statusLabel: "Not Assigned",
      tone: "neutral",
      title: "No location assigned",
      message: "Ask your manager to assign a location and shift before using mobile attendance.",
      facts: [],
      action: null,
    };
  }

  if (!record) {
    return {
      statusLabel: "No Shift",
      tone: "neutral",
      title: "No shift loaded for today",
      message:
        "There is no attendance record for today's Karachi shift yet. Pull to refresh in a moment or contact your manager if it stays missing.",
      facts: [],
      action: null,
    };
  }

  const checkInOpenAt = getCheckInOpenAt(record);
  const lateDeadline = getLateDeadline(record);
  const minimumCheckoutAt = getMinimumCheckoutAt(record);
  const recommendedCheckoutAt = getRecommendedCheckoutAt(record);
  const shiftEnd = new Date(record.expectedEnd);
  const shiftDate = formatShortDate(record.date);
  const locationName = record.location?.name ?? "Assigned location";
  const shiftWindow = `${shiftDate} • ${formatTaskWindow(record.expectedStart, record.expectedEnd)}`;

  if (record.checkOutTime || record.status === "CHECKED_OUT") {
    return {
      statusLabel: "Checked Out",
      tone: "success",
      title: "Shift completed",
      message: `You checked out at ${formatClockTime(record.checkOutTime ?? record.expectedEnd)}.`,
      facts: [
        { label: "Location", value: locationName },
        { label: "Shift", value: shiftWindow },
        record.checkInTime
          ? { label: "Checked In", value: formatClockTime(record.checkInTime) }
          : { label: "Checked In", value: "Not recorded" },
        { label: "Checked Out", value: formatClockTime(record.checkOutTime ?? record.expectedEnd) },
      ],
      action: null,
    };
  }

  if (record.status === "ABSENT") {
    const checkInHasOpened = now.getTime() >= checkInOpenAt.getTime();
    const shiftHasEnded = now.getTime() > shiftEnd.getTime();
    const isLate = now.getTime() > lateDeadline.getTime();

    if (checkInHasOpened && !shiftHasEnded) {

      return {
        statusLabel: isLate ? "Late Window" : "Check-In Open",
        tone: isLate ? "warning" : "accent",
        title: isLate ? "Late check-in is still allowed" : "Ready to check in",
        message: isLate
          ? `Your shift started at ${formatClockTime(record.expectedStart)}. You can still check in until ${formatClockTime(record.expectedEnd)}, but it will be marked late.`
          : `Your shift starts at ${formatClockTime(record.expectedStart)}. Capture a selfie and your current location to check in.`,
        facts: [
          { label: "Location", value: locationName },
          { label: "Shift", value: shiftWindow },
          { label: "Check-In Opens", value: formatClockTime(checkInOpenAt) },
          { label: "Late After", value: formatClockTime(lateDeadline) },
        ],
        action: {
          mode: "check-in",
          label: isLate ? "Check In Late" : "Check In",
          disabled: false,
          helper: `Shift ends at ${formatClockTime(record.expectedEnd)}.`,
        },
      };
    }

    if (!checkInHasOpened) {
      return {
        statusLabel: "Upcoming Shift",
        tone: "neutral",
        title: "Check-in has not opened yet",
        message: `Your shift starts at ${formatClockTime(record.expectedStart)}. Check-in opens at ${formatClockTime(checkInOpenAt)}.`,
        facts: [
          { label: "Location", value: locationName },
          { label: "Shift", value: shiftWindow },
          { label: "Check-In Opens", value: formatClockTime(checkInOpenAt) },
          { label: "Late After", value: formatClockTime(lateDeadline) },
        ],
        action: {
          mode: "check-in",
          label: "Check In Not Open Yet",
          disabled: true,
          helper: `Come back at ${formatClockTime(checkInOpenAt)} to start your shift.`,
        },
      };
    }

    return {
      statusLabel: "Shift Closed",
      tone: "danger",
      title: "Shift time closed",
      message: `You can check in late during the shift, but this shift ended at ${formatClockTime(record.expectedEnd)} without a check-in.`,
      facts: [
        { label: "Location", value: locationName },
        { label: "Shift", value: shiftWindow },
        { label: "Late After", value: formatClockTime(lateDeadline) },
        { label: "Shift Ended", value: formatClockTime(record.expectedEnd) },
      ],
      action: {
        mode: "check-in",
        label: "Shift Time Closed",
        disabled: true,
        helper: "If you were on shift and this is wrong, contact your manager.",
      },
    };
  }

  if (record.status === "MISSED_CHECKOUT") {
    return {
      statusLabel: "Missed Checkout",
      tone: "danger",
      title: "Checkout is overdue",
      message: `Your shift ended at ${formatClockTime(record.expectedEnd)} and still needs a checkout selfie.`,
      facts: [
        { label: "Location", value: locationName },
        { label: "Shift", value: shiftWindow },
        record.checkInTime
          ? { label: "Checked In", value: formatClockTime(record.checkInTime) }
          : { label: "Checked In", value: "Recorded" },
        { label: "Shift Ended", value: formatClockTime(record.expectedEnd) },
      ],
      action: {
        mode: "check-out",
        label: "Complete Check Out",
        disabled: false,
        helper: "This attendance will remain flagged as a missed checkout in backend history.",
      },
    };
  }

  if (hasOpenCheckout(record)) {
    const checkoutReady = now.getTime() >= recommendedCheckoutAt.getTime();

    return {
      statusLabel: formatAttendanceStatus(record.status),
      tone: record.status === "LATE" ? "warning" : "success",
      title: checkoutReady ? "Ready to check out" : "You are currently on shift",
      message: checkoutReady
        ? `Your shift ended at ${formatClockTime(record.expectedEnd)}. Capture a checkout selfie to close it now.`
        : `You checked in at ${formatClockTime(record.checkInTime ?? record.expectedStart)}. Your shift ends at ${formatClockTime(record.expectedEnd)}.`,
      facts: [
        { label: "Location", value: locationName },
        { label: "Shift", value: shiftWindow },
        record.checkInTime
          ? { label: "Checked In", value: formatClockTime(record.checkInTime) }
          : { label: "Checked In", value: "Recorded" },
        {
          label: "Check Out After",
          value: formatClockTime(recommendedCheckoutAt),
        },
      ],
      action: {
        mode: "check-out",
        label: checkoutReady ? "Check Out" : "Check Out Not Ready",
        disabled: !checkoutReady,
        helper: checkoutReady
          ? "Checkout requires a fresh selfie and your current location."
          : `Your shift ends at ${formatClockTime(record.expectedEnd)}.${minimumCheckoutAt ? ` Backend checkout is also blocked until ${formatClockTime(minimumCheckoutAt)}.` : ""}`,
      },
    };
  }

  return {
    statusLabel: formatAttendanceStatus(record.status),
    tone: "neutral",
    title: "Attendance record loaded",
    message: "Your latest shift record is available below.",
    facts: [
      { label: "Location", value: locationName },
      { label: "Shift", value: shiftWindow },
    ],
    action: null,
  };
};

export function HomeScreen({
  isActive,
  refreshToken,
  topInset,
  bottomInset,
  onOpenTasksTab,
}: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingMode, setSubmittingMode] = useState<AttendanceActionMode | null>(null);

  const loadDashboard = async () => {
    if (!user) {
      return;
    }

    const [attendanceResponse, tasksResponse] = await Promise.all([
      client.get<ApiEnvelope<AttendanceRecord[]>>("/attendance/my"),
      client.get<ApiEnvelope<TaskInstance[]>>(`/task-instance/staff/${user.id}/today`),
    ]);

    setAttendanceRecords(attendanceResponse.data.data);
    setTasks(tasksResponse.data.data);
  };

  useEffect(() => {
    if (!isActive || !user) {
      return;
    }

    void loadDashboard().catch(() => undefined);
  }, [isActive, refreshToken, user?.id]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } catch (error: any) {
      Alert.alert("Refresh failed", error?.response?.data?.message ?? "Unable to refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAttendanceAction = async (mode: AttendanceActionMode) => {
    try {
      setSubmittingMode(mode);

      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

      if (!cameraPermission.granted) {
        Alert.alert("Camera required", "Allow camera access to capture an attendance image.");
        return;
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (!locationPermission.granted) {
        Alert.alert("Location required", "Allow location access to mark attendance.");
        return;
      }

      const imageResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (imageResult.canceled || !imageResult.assets[0]) {
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const image = imageResult.assets[0];
      const formData = new FormData();
      formData.append("latitude", String(coords.coords.latitude));
      formData.append("longitude", String(coords.coords.longitude));
      formData.append(
        "image",
        createImagePart(image.uri, image.fileName ?? `${mode}.jpg`, image.mimeType)
      );

      await uploadFormData(`/attendance/${mode}`, formData);
      await loadDashboard();

      Alert.alert(
        "Success",
        mode === "check-in" ? "Checked in successfully." : "Checked out successfully."
      );
    } catch (error: any) {
      Alert.alert(
        "Attendance failed",
        error?.response?.data?.message ?? error?.message ?? `Unable to ${mode.replace("-", " ")}.`
      );
    } finally {
      setSubmittingMode(null);
    }
  };

  const now = new Date();
  const activeAttendance = getRelevantAttendanceRecord(attendanceRecords, now);
  const attendanceView = buildAttendanceViewModel({
    record: activeAttendance,
    hasAssignedLocation: Boolean(user?.locationId),
    now,
  });
  const pendingCount = tasks.filter((task) => task.status === "PENDING").length;
  const inProgressCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const toneStyles = toneStyleMap[attendanceView.tone];
  const attendanceAction = attendanceView.action;

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
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Shift Control</Text>
          <Text style={styles.title}>{user?.name ?? "Staff"}</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <Button label="Sign Out" onPress={logout} variant="ghost" />
      </View>

      <View style={styles.panel}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.panelTitle}>Attendance</Text>
          <View style={[styles.statusBadge, toneStyles.badge]}>
            <Text style={[styles.statusBadgeText, toneStyles.badgeText]}>
              {attendanceView.statusLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.attendanceTitle}>{attendanceView.title}</Text>
        <Text style={styles.panelText}>{attendanceView.message}</Text>

        {attendanceView.facts.length ? (
          <View style={styles.factGrid}>
            {attendanceView.facts.map((fact) => (
              <View key={fact.label} style={styles.factCard}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {attendanceAction ? (
          <View style={[styles.actionBlock, toneStyles.actionBlock]}>
            <Button
              disabled={attendanceAction.disabled}
              label={attendanceAction.label}
              loading={submittingMode === attendanceAction.mode}
              onPress={() => {
                if (!attendanceAction.disabled) {
                  void handleAttendanceAction(attendanceAction.mode);
                }
              }}
            />
            {attendanceAction.helper ? (
              <Text style={styles.actionHelper}>{attendanceAction.helper}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#0f5f53" }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#a0532d" }]}>
          <Text style={styles.statNumber}>{inProgressCount}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#42603d" }]}>
          <Text style={styles.statNumber}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Today's tasks</Text>
        <Text style={styles.panelText}>
          Use the Tasks tab to start QR-based work and upload proof images for anything still in progress.
        </Text>
        <Button label="Open Tasks Tab" onPress={onOpenTasksTab} variant="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    backgroundColor: "#1d4f45",
    justifyContent: "space-between",
    gap: 18,
  },
  heroCopy: {
    gap: 6,
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#d9ebe5",
    color: "#146356",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    color: "#f7f5ef",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#cfe6df",
    fontSize: 14,
  },
  panel: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "#ddd3c1",
    gap: 14,
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17231f",
  },
  attendanceTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    color: "#17231f",
  },
  panelText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5b6b65",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  factCard: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: 18,
    backgroundColor: "#f7f1e5",
    borderWidth: 1,
    borderColor: "#e4d9c6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  factLabel: {
    color: "#6c6d64",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  factValue: {
    color: "#1e2e29",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  actionBlock: {
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  actionHelper: {
    color: "#5a635f",
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
  },
  statNumber: {
    color: "#fffaf2",
    fontSize: 30,
    fontWeight: "900",
  },
  statLabel: {
    color: "#f3ddce",
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
  },
});

const toneStyleMap = {
  accent: StyleSheet.create({
    badge: {
      backgroundColor: "#d6ebe5",
    },
    badgeText: {
      color: "#0f5f53",
    },
    actionBlock: {
      backgroundColor: "#edf7f4",
    },
  }),
  success: StyleSheet.create({
    badge: {
      backgroundColor: "#dce9cf",
    },
    badgeText: {
      color: "#355f1c",
    },
    actionBlock: {
      backgroundColor: "#eff5e8",
    },
  }),
  warning: StyleSheet.create({
    badge: {
      backgroundColor: "#f3e0b9",
    },
    badgeText: {
      color: "#7a5712",
    },
    actionBlock: {
      backgroundColor: "#fcf4df",
    },
  }),
  danger: StyleSheet.create({
    badge: {
      backgroundColor: "#f2d9d4",
    },
    badgeText: {
      color: "#8b3028",
    },
    actionBlock: {
      backgroundColor: "#fbedeb",
    },
  }),
  neutral: StyleSheet.create({
    badge: {
      backgroundColor: "#ece6db",
    },
    badgeText: {
      color: "#6a6257",
    },
    actionBlock: {
      backgroundColor: "#f6efe4",
    },
  }),
};
