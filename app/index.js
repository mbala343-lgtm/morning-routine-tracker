import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityRow } from "@/components/ActivityRow";
import { useRoutine, formatDate, getToday } from "@/context/RoutineContext";
import { useColors } from "@/hooks/useColors";

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    todayLog,
    currentActivity,
    nextActivity,
    elapsedSeconds,
    isLoaded,
    startActivity,
    completeActivity,
    completeAndNext,
    resetToday,
  } = useRoutine();

  const allCompleted = todayLog.length > 0 && todayLog.every((a) => a.status === "completed");
  const anyStarted = todayLog.some((a) => a.status !== "not_started");
  const hasActive = !!currentActivity;

  const completedCount = useMemo(
    () => todayLog.filter((a) => a.status === "completed").length,
    [todayLog]
  );
  const progress = todayLog.length > 0 ? completedCount / todayLog.length : 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleReset = () => {
    Alert.alert("Reset Today", "Clear all activity logs for today?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetToday();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleMainAction = () => {
    if (allCompleted) {
      router.push("/summary");
      return;
    }
    if (hasActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      completeAndNext();
      return;
    }
    if (!anyStarted && nextActivity) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startActivity(nextActivity.id);
      return;
    }
    if (nextActivity) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startActivity(nextActivity.id);
    }
  };

  const mainButtonLabel = allCompleted
    ? "View Summary"
    : hasActive
    ? "Complete & Next"
    : !anyStarted
    ? "Start Routine"
    : "Start Next";

  const mainButtonIcon: "bar-chart-2" | "chevron-right" | "play" =
    allCompleted ? "bar-chart-2" : hasActive ? "chevron-right" : "play";

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Morning Routine</Text>
          <Text style={[styles.headerDate, { color: colors.mutedForeground }]}>
            {formatDate(getToday())}
          </Text>
        </View>
        {anyStarted && (
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progress * 100)}%` as `${number}%`,
              backgroundColor: allCompleted ? colors.success : colors.active,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {todayLog.map((activity, idx) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            isLast={idx === todayLog.length - 1}
            elapsedSeconds={activity.status === "in_progress" ? elapsedSeconds : 0}
            onStart={startActivity}
            onComplete={completeActivity}
          />
        ))}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 12,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.mainButton,
            {
              backgroundColor:
                allCompleted ? colors.success : hasActive ? colors.active : colors.primary,
            },
          ]}
          onPress={handleMainAction}
          activeOpacity={0.85}
        >
          <Feather name={mainButtonIcon} size={18} color="#fff" />
          <Text style={styles.mainButtonText}>{mainButtonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  resetBtn: {
    padding: 8,
  },
  progressBar: {
    height: 3,
    width: "100%",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
});
