import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderOption = 5 | 10 | 15 | 30 | 60;

type NotificationContextType = {
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderMinutes: ReminderOption;
  setReminderMinutes: (v: ReminderOption) => void;
  birthdayNotificationsEnabled: boolean;
  setBirthdayNotificationsEnabled: (v: boolean) => void;
};

const NotificationContext = createContext<NotificationContextType>({
  reminderEnabled: true,
  setReminderEnabled: () => {},
  reminderMinutes: 15,
  setReminderMinutes: () => {},
  birthdayNotificationsEnabled: true,
  setBirthdayNotificationsEnabled: () => {},
});

const REMINDER_ENABLED_KEY = 'notif_reminder_enabled';
const REMINDER_KEY         = 'notif_reminder_minutes';
const BIRTHDAY_KEY         = 'notif_birthday_enabled';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [reminderEnabled, setReminderEnabledState] = useState(true);
  const [reminderMinutes, setReminderState] = useState<ReminderOption>(15);
  const [birthdayNotificationsEnabled, setBirthdayState] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([REMINDER_ENABLED_KEY, REMINDER_KEY, BIRTHDAY_KEY]).then(([[, e], [, r], [, b]]) => {
      if (e !== null) setReminderEnabledState(e === 'true');
      if (r !== null) setReminderState(Number(r) as ReminderOption);
      if (b !== null) setBirthdayState(b === 'true');
    });
  }, []);

  function setReminderEnabled(v: boolean) {
    setReminderEnabledState(v);
    AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(v));
  }

  function setReminderMinutes(v: ReminderOption) {
    setReminderState(v);
    AsyncStorage.setItem(REMINDER_KEY, String(v));
  }

  function setBirthdayNotificationsEnabled(v: boolean) {
    setBirthdayState(v);
    AsyncStorage.setItem(BIRTHDAY_KEY, String(v));
  }

  return (
    <NotificationContext.Provider value={{ reminderEnabled, setReminderEnabled, reminderMinutes, setReminderMinutes, birthdayNotificationsEnabled, setBirthdayNotificationsEnabled }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationSettings = () => useContext(NotificationContext);
