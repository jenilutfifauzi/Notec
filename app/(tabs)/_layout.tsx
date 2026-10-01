import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { Icon, Home01Icon, Add01Icon, Clock01Icon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
export default function TabLayout() {
  const { mode, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.line,
          },
        ],
        tabBarLabelStyle: [styles.tabLabel, { color: mode === 'dark' ? colors.ink : undefined }],
        tabBarButton: ({ ref, ...rest }) => (
          <Pressable
            {...rest}
            android_ripple={null}
            style={({ pressed }) => [
              rest.style,
              pressed && { opacity: 0.75 },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => (
            <Icon icon={Home01Icon} size={19} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record-placeholder"
        options={{
          title: 'Catat',
          tabBarLabel: () => null,
          tabBarButton: () => (
            <Pressable
              onPress={() => router.push('/record')}
              style={styles.centerButtonContainer}
              accessibilityLabel="Catat Transaksi"
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.addButton,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Icon
                  icon={Add01Icon}
                  size={26}
                  color={mode === 'dark' ? '#212121' : colors.white}
                />
              </View>
            </Pressable>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/record');
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color }) => (
            <Icon icon={Clock01Icon} size={19} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 58,
    paddingBottom: 6,
    paddingTop: 5,
  },
  tabLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 9,
    fontWeight: '700',
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 43,
    height: 39,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 5px 11px rgba(36, 81, 191, 0.25)',
    elevation: 4,
  },
});
