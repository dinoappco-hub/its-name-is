import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
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
  const dims = DINO_SIZES[size];

  // Use RN Animated for smooth 60fps native-driven animations
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotation loop - full circle every 2400ms
    const rotLoop = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Bounce loop - up and down every 1200ms
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    );

    // Dot animation loop
    const dotLoop = Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    rotLoop.start();
    bounceLoop.start();
    dotLoop.start();

    return () => {
      rotLoop.stop();
      bounceLoop.stop();
      dotLoop.stop();
    };
  }, []);

  // Stego: orbits at angle 0 offset
  const stegoTranslateX = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [dims.orbit, 0, -dims.orbit, 0, dims.orbit],
  });
  const stegoTranslateY = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -dims.orbit * 0.4, 0, dims.orbit * 0.4, 0],
  });
  const stegoScale = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.85, 0.75, 0.85, 1],
  });
  const stegoBounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const stegoRotate = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-12deg', '0deg', '12deg', '0deg'],
  });

  // Bronto: orbits at angle PI offset (opposite)
  const brontoTranslateX = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-dims.orbit, 0, dims.orbit, 0, -dims.orbit],
  });
  const brontoTranslateY = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, dims.orbit * 0.4, 0, -dims.orbit * 0.4, 0],
  });
  const brontoScale = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.75, 0.85, 1, 0.85, 0.75],
  });
  const brontoBounce = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });
  const brontoRotate = rotationAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '12deg', '0deg', '-12deg', '0deg'],
  });

  // Dot opacities
  const dot1Opacity = dotAnim.interpolate({
    inputRange: [0, 0.33, 0.34, 1],
    outputRange: [1, 1, 0.3, 0.3],
  });
  const dot2Opacity = dotAnim.interpolate({
    inputRange: [0, 0.32, 0.33, 0.66, 0.67, 1],
    outputRange: [0.3, 0.3, 1, 1, 0.3, 0.3],
  });
  const dot3Opacity = dotAnim.interpolate({
    inputRange: [0, 0.65, 0.66, 1],
    outputRange: [0.3, 0.3, 1, 1],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.orbitContainer, { width: dims.container, height: dims.container }]}>
        <View style={[styles.orbitShadow, { width: dims.orbit * 2.2, height: dims.orbit * 0.9, backgroundColor: `${t.textMuted}10`, borderRadius: dims.orbit }]} />
        <Animated.View style={[
          styles.dinoWrap,
          { width: dims.dino, height: dims.dino },
          {
            transform: [
              { translateX: stegoTranslateX },
              { translateY: Animated.add(stegoTranslateY, stegoBounce) },
              { scale: stegoScale },
              { rotate: stegoRotate },
            ],
          },
        ]}>
          <Image
            source={require('../assets/images/dino-stego.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </Animated.View>
        <Animated.View style={[
          styles.dinoWrap,
          { width: dims.dino, height: dims.dino },
          {
            transform: [
              { translateX: brontoTranslateX },
              { translateY: Animated.add(brontoTranslateY, brontoBounce) },
              { scale: brontoScale },
              { rotate: brontoRotate },
            ],
          },
        ]}>
          <Image
            source={require('../assets/images/dino-bronto.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </Animated.View>
      </View>
      {message ? (
        <View style={styles.messageRow}>
          <Text style={[styles.message, { color: t.textSecondary }]}>{message}</Text>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { backgroundColor: t.primary, opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { backgroundColor: t.primary, opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { backgroundColor: t.primary, opacity: dot3Opacity }]} />
          </View>
        </View>
      ) : null}
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
