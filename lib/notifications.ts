import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;

export function isNotificationsSupported(): boolean {
  if (Platform.OS !== 'android') return true;

  if (Constants.executionEnvironment === 'storeClient') return false;
  if (Constants.appOwnership === 'expo') return false;

  return true;
}

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (!isNotificationsSupported()) return null;

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }

  return notificationsModulePromise;
}

export async function setupNotifications(): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ManicuristApp',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c084fc',
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAppointmentReminder(
  appointmentId: string,
  startTime: string,
  clientName: string,
  serviceNames: string[],
  minutesBefore: number,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const triggerDate = new Date(new Date(startTime).getTime() - minutesBefore * 60 * 1000);
  if (triggerDate <= new Date()) return;

  const body = serviceNames.length > 0
    ? `En ${minutesBefore} min: ${clientName} — ${serviceNames.join(', ')}`
    : `En ${minutesBefore} min: ${clientName}`;

  await Notifications.scheduleNotificationAsync({
    identifier: `apt-${appointmentId}`,
    content: { title: '📅 Cita próxima', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(`apt-${appointmentId}`).catch(() => {});
}

export async function scheduleBirthdayNotification(
  clientId: string,
  clientName: string,
  birthday: string, // 'YYYY-MM-DD'
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.cancelScheduledNotificationAsync(`birthday-${clientId}`).catch(() => {});

  const parts = birthday.split('-');
  const month = parseInt(parts[1], 10);
  const day   = parseInt(parts[2], 10);

  await Notifications.scheduleNotificationAsync({
    identifier: `birthday-${clientId}`,
    content: {
      title: '🎂 ¡Cumpleaños!',
      body: `Hoy es el cumpleaños de ${clientName} 🎉`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.YEARLY,
      month,
      day,
      hour: 9,
      minute: 0,
    },
  });
}

export async function cancelBirthdayNotification(clientId: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(`birthday-${clientId}`).catch(() => {});
}
