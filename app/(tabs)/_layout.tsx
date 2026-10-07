import { Tabs, router } from 'expo-router';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { Icon, Home01Icon, Add01Icon, TransactionHistoryIcon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
import { motionTokens, springBounce } from '@/lib/motion';

const isAndroid = Platform.OS === 'android';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CenterAddButton({
  onPress,
  isDark,
}: {
  onPress: () => void;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(motionTokens.scale.pressAdd, {
          duration: 120,
          easing: motionTokens.easing.smoothOut,
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = springBounce(1);
      }}
      style={[styles.centerButtonContainer, animatedStyle]}
      accessibilityLabel="Catat Transaksi"
      accessibilityRole="button"
    >
      <LinearGradient
        colors={isDark ? ['#82a60d', '#bedb00'] : ['#5B9A3C', '#3D7A26']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.addButton,
          {
            boxShadow: isDark
              ? '0 4px 12px rgba(0, 0, 0, 0.35)'
              : '0 4px 12px rgba(61, 122, 38, 0.28)',
          },
        ]}
      >
        <Icon
          icon={Add01Icon}
          size={22}
          color={isDark ? '#212121' : '#FFFFFF'}
        />
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function TabLayout() {
  const { mode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 54 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.barInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => (
            <Icon icon={Home01Icon} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record-placeholder"
        options={{
          title: 'Catat',
          tabBarLabel: () => null,
          tabBarButton: () => (
            <CenterAddButton
              onPress={() => router.push('/record')}
              isDark={isDark}
            />
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
            <Icon icon={TransactionHistoryIcon} size={22} strokeWidth={1.5} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    paddingTop: 4,
    paddingBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10.5,
    fontWeight: isAndroid ? undefined : ('600' as const),
    includeFontPadding: false,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 46,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
