import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { Icon, Home01Icon, Add01Icon, Clock01Icon } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { fontFamilies } from '@/lib/tokens';
import { motionTokens, springBounce } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CenterAddButton({
  onPress,
  backgroundColor,
  iconColor,
}: {
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
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
      <View
        style={[
          styles.addButton,
          {
            backgroundColor,
          },
        ]}
      >
        <Icon
          icon={Add01Icon}
          size={26}
          color={iconColor}
        />
      </View>
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
              backgroundColor={colors.primary}
              iconColor={mode === 'dark' ? '#212121' : colors.white}
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
