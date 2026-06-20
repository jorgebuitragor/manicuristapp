import { useWindowDimensions, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
        <Image source={require('@/assets/manicuristapp-icon.png')} style={styles.sidebarLogo} />
        <View style={styles.sidebarAppName}>
          <ThemedText variant="title" style={styles.sidebarTitle}>Manicurist</ThemedText>
          <ThemedText variant="title" style={[styles.sidebarTitle, { color: colors.primary }]}>App</ThemedText>
        </View>
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

    </SafeAreaView>
  );
}

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = isTablet ? Math.max(4, insets.bottom) + 12 : 4;
  const fab = resolveTabletFab(pathname);
  const showTabletFab = isTablet && fab;
  const TAB_BAR_HEIGHT = 80;
  const fabBottomPortrait = TAB_BAR_HEIGHT + tabBarPaddingBottom + 16;

  return (
    <View
      style={[
        isTabletLandscape ? styles.tabletContainer : styles.tabletContent,
        { backgroundColor: colors.background },
      ]}
    >
      {isTabletLandscape && <TabletSidebar />}
      <View style={styles.tabletContent}>
        <Tabs
          screenOptions={{
            headerShown: false,
            animation: 'shift',
            sceneStyle: { backgroundColor: colors.background },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarStyle: isTabletLandscape
              ? { display: 'none' }
              : {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                  backgroundColor: colors.tabBar,
                  paddingBottom: tabBarPaddingBottom,
                  ...(isTablet && { height: 80, paddingTop: 10 }),
                },
            tabBarLabelStyle: {
              fontSize: isTablet ? 13 : 11,
              fontWeight: '500',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('tabs.today'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'home' : 'home-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t('tabs.calendar'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="clients/index"
            options={{
              title: t('tabs.clients'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'people' : 'people-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
          <Tabs.Screen name="clients/[id]" options={{ href: null }} />
          <Tabs.Screen
            name="polishes/index"
            options={{
              title: t('tabs.polishes'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'color-palette' : 'color-palette-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="incomes"
            options={{
              title: t('tabs.incomes'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'cash' : 'cash-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: t('tabs.settings'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'settings' : 'settings-outline'} size={isTablet ? 24 : 22} color={color} />
              ),
            }}
          />
        </Tabs>
        {showTabletFab ? (
          <TabletQuickActionFab
            label={t(fab!.labelKey)}
            onPress={() => router.push(fab!.route as any)}
            style={isTabletLandscape ? undefined : { bottom: fabBottomPortrait }}
          />
        ) : null}
      </View>
    </View>
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
  sidebarLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  sidebarAppName: {
    flexDirection: 'row',
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
