import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '../hooks/useTheme';

interface DinoLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const DINO_SIZES = {
  small: { orbit: 28, dino: 32, container: 80 },
  medium: { orbit: 40, dino: 48, container: 120 },
  large: { orbit: 52, dino: 60, container: 150 },
};

export default function DinoLoader({ message = 'Loading...', size = 'medium' }: DinoLoaderProps) {
  const { colors: t } = useAppTheme();
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);
  const dims = DINO_SIZES[size];

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
    bounce.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
      -1,
      true,
    );
  }, []);

  const stegoStyle = useAnimatedStyle(() => {
    const angle = (rotation.value * Math.PI) / 180;
    const x = Math.cos(angle) * dims.orbit;
    const y = Math.sin(angle) * dims.orbit * 0.4;
    const scale = interpolate(Math.sin(angle), [-1, 1], [0.75, 1.1]);
    const zIdx = Math.sin(angle) > 0 ? 2 : 0;
    const translateY = interpolate(bounce.value, [0, 1], [0, -4]);
    return {
      transform: [
        { translateX: x },
        { translateY: y + translateY },
        { scale },
        { rotate: `${Math.sin(angle) * 12}deg` },
      ],
      zIndex: zIdx,
    };
  });

  const brontoStyle = useAnimatedStyle(() => {
    const angle = (rotation.value * Math.PI) / 180 + Math.PI;
    const x = Math.cos(angle) * dims.orbit;
    const y = Math.sin(angle) * dims.orbit * 0.4;
    const scale = interpolate(Math.sin(angle), [-1, 1], [0.75, 1.1]);
    const zIdx = Math.sin(angle) > 0 ? 2 : 0;
    const translateY = interpolate(bounce.value, [0, 1], [-4, 0]);
    return {
      transform: [
        { translateX: x },
        { translateY: y + translateY },
        { scale },
        { rotate: `${Math.sin(angle) * -12}deg` },
      ],
      zIndex: zIdx,
    };
  });

  const dotStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(bounce.value, [0, 0.5, 1], [0.3, 1, 0.3]),
  }));
  const dotStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(bounce.value, [0, 0.5, 1], [1, 0.3, 1]),
  }));
  const dotStyle3 = useAnimatedStyle(() => ({
    opacity: interpolate(bounce.value, [0, 0.5, 1], [0.6, 0.6, 1]),
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.orbitContainer, { width: dims.container, height: dims.container }]}>
        {/* Shadow/trail effect */}
        <View style={[styles.orbitShadow, { width: dims.orbit * 2.2, height: dims.orbit * 0.9, backgroundColor: `${t.textMuted}10`, borderRadius: dims.orbit }]} />

        <Animated.View style={[styles.dinoWrap, { width: dims.dino, height: dims.dino }, stegoStyle]}>
          <Image
            source={require('../assets/images/dino-stego.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.dinoWrap, { width: dims.dino, height: dims.dino }, brontoStyle]}>
          <Image
            source={require('../assets/images/dino-bronto.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.messageRow}>
        <Text style={[styles.message, { color: t.textSecondary }]}>{message}</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { backgroundColor: t.primary }, dotStyle1]} />
          <Animated.View style={[styles.dot, { backgroundColor: t.primary }, dotStyle2]} />
          <Animated.View style={[styles.dot, { backgroundColor: t.primary }, dotStyle3]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  orbitContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitShadow: {
    position: 'absolute',
    bottom: 8,
  },
  dinoWrap: {
    position: 'absolute',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
