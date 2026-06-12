import { useWindowDimensions, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ui/ThemedText';
import { TabletQuickActionFab } from '@/components/ui/TabletQuickActionFab';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';

const TABLET_BREAKPOINT = 768;

type NavItem = {
  route: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { route: '/(tabs)/', labelKey: 'tabs.today', icon: 'home-outline', iconActive: 'home' },
  { route: '/(tabs)/calendar', labelKey: 'tabs.calendar', icon: 'calendar-outline', iconActive: 'calendar' },
  { route: '/(tabs)/clients', labelKey: 'tabs.clients', icon: 'people-outline', iconActive: 'people' },
  { route: '/(tabs)/polishes', labelKey: 'tabs.polishes', icon: 'color-palette-outline', iconActive: 'color-palette' },
  { route: '/(tabs)/incomes', labelKey: 'tabs.incomes', icon: 'cash-outline', iconActive: 'cash' },
  { route: '/(tabs)/settings', labelKey: 'tabs.settings', icon: 'settings-outline', iconActive: 'settings' },
];

function resolveTabletFab(pathname: string) {
  if (pathname.startsWith('/settings')) return null;

  if (pathname.startsWith('/polishes')) {
    return { route: '/polishes/new', labelKey: 'polishes.newShort' };
  }

  if (pathname.startsWith('/clients')) {
    return { route: '/clients/new', labelKey: 'clients.newShort' };
  }

  if (pathname === '/' || pathname.startsWith('/calendar')) {
    return { route: '/appointments/new', labelKey: 'home.newAppointmentShort' };
  }

  return null;
}

function TabletSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView
      style={[styles.sidebar, { backgroundColor: colors.card, borderRightColor: colors.border }]}
      edges={['left', 'top', 'bottom']}
    >
      <View style={styles.sidebarHeader}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="color-palette" size={22} color={colors.primary} />
        </View>
        <ThemedText style={styles.sidebarTitle}>{t('sidebar.title')}</ThemedText>
      </View>

      <View style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.route ||
            (item.route !== '/(tabs)/' && pathname.startsWith(item.route.replace('/(tabs)', '')));
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.sidebarItem,
                isActive && { backgroundColor: colors.primaryMuted },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={20}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.sidebarItemLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && styles.sidebarItemLabelActive,
                ]}
              >
                {t(item.labelKey)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => supabase.auth.signOut()}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.textTertiary} />
        <ThemedText tone="tertiary" style={styles.logoutText}>{t('sidebar.logout')}</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const { colors } = useTheme();
  const { t } = useI18n();
  const fab = resolveTabletFab(pathname);
  const showTabletFab = isTablet && isLandscape && fab;

  if (isTablet) {
    return (
      <View style={[styles.tabletContainer, { backgroundColor: colors.background }]}>
        <TabletSidebar />
        <View style={styles.tabletContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              animation: 'shift',
              sceneStyle: { backgroundColor: colors.background },
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="calendar" />
            <Tabs.Screen name="clients/index" />
            <Tabs.Screen name="clients/[id]" />
            <Tabs.Screen name="polishes/index" />
          <Tabs.Screen name="polishes/labels" />
            <Tabs.Screen name="services/index" />
            <Tabs.Screen name="brands/index" />
            <Tabs.Screen name="racks/index" />
            <Tabs.Screen name="incomes" />
            <Tabs.Screen name="settings" />
          </Tabs>
        </View>
        {showTabletFab ? (
          <TabletQuickActionFab
            label={t(fab.labelKey)}
            onPress={() => router.push(fab.route as any)}
          />
        ) : null}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          backgroundColor: colors.tabBar,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: t('tabs.clients'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />
      <Tabs.Screen name="services/index" options={{ href: null }} />
      <Tabs.Screen name="brands/index" options={{ href: null }} />
      <Tabs.Screen name="racks/index" options={{ href: null }} />
      <Tabs.Screen name="polishes/labels" options={{ href: null }} />
      <Tabs.Screen
        name="polishes/index"
        options={{
          title: t('tabs.polishes'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'color-palette' : 'color-palette-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incomes"
        options={{
          title: t('tabs.incomes'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletContent: {
    flex: 1,
  },
  sidebar: {
    width: 224,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sidebarNav: {
    flex: 1,
    gap: 2,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sidebarItemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarItemLabelActive: {
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 14,
  },
});
