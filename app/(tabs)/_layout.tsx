import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
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
        style={styles.addButton}
      >
        <Icon
          icon={Add01Icon}
          size={24}
          color={isDark ? '#212121' : '#FFFFFF'}
        />
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function TabLayout() {
  const { mode, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.line,
          },
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.barInactive,
        tabBarLabelStyle: styles.tabLabel,
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
            <CenterAddButton
              onPress={() => router.push('/record')}
              isDark={mode === 'dark'}
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
            <Icon icon={TransactionHistoryIcon} size={20} strokeWidth={1.5} color={color} />
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
