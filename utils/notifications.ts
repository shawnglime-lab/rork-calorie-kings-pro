import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    console.log("Notifications not supported on web");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function scheduleMealReminders(times: string[]): Promise<void> {
  if (Platform.OS === "web") {
    console.log("Notifications not supported on web");
    return;
  }

  await cancelMealReminders();

  console.log("Scheduling meal reminders for times:", times);

  for (const time of times) {
    const [hours, minutes] = time.split(":").map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🍽️ Meal Reminder",
        body: "Time to log your meal!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
      identifier: `meal-reminder-${time}`,
    });

    console.log(`Scheduled meal reminder for ${time}`);
  }
}

export async function scheduleWeightReminder(time: string): Promise<void> {
  if (Platform.OS === "web") {
    console.log("Notifications not supported on web");
    return;
  }

  await cancelWeightReminder();

  console.log("Scheduling weight reminder for time:", time);

  const [hours, minutes] = time.split(":").map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "⚖️ Weight Reminder",
      body: "Time to weigh yourself!",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
    identifier: "weight-reminder",
  });

  console.log(`Scheduled weight reminder for ${time}`);
}

export async function cancelMealReminders(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
  const mealNotifications = allNotifications.filter((n) =>
    n.identifier.startsWith("meal-reminder-")
  );

  console.log("Canceling meal reminders:", mealNotifications.length);

  for (const notification of mealNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
  }
}

export async function cancelWeightReminder(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  console.log("Canceling weight reminder");

  try {
    await Notifications.cancelScheduledNotificationAsync("weight-reminder");
  } catch {
    console.log("No weight reminder to cancel");
  }
}

export async function getAllScheduledNotifications() {
  if (Platform.OS === "web") {
    return [];
  }

  return await Notifications.getAllScheduledNotificationsAsync();
}
