import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const [rotation, setRotation] = useState(0);
  const [bounce, setBounce] = useState(0);
  const [dotPhase, setDotPhase] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let startTime = Date.now();
    animRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Rotation: full cycle every 2400ms
      setRotation((elapsed / 2400) * 360);
      // Bounce: ping-pong every 600ms
      const bouncePhase = (elapsed % 1200) / 600;
      setBounce(bouncePhase <= 1 ? bouncePhase : 2 - bouncePhase);
      // Dots: cycle every 900ms
      setDotPhase((elapsed % 900) / 900);
    }, 32);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  const getTransform = (angleOffset: number) => {
    const angle = ((rotation * Math.PI) / 180) + angleOffset;
    const x = Math.cos(angle) * dims.orbit;
    const y = Math.sin(angle) * dims.orbit * 0.4;
    const sinVal = Math.sin(angle);
    const scale = 0.75 + (sinVal + 1) * 0.175; // maps [-1,1] to [0.75,1.1]
    const translateY = angleOffset === 0
      ? bounce * -4
      : (1 - bounce) * -4;
    const rotDeg = sinVal * 12 * (angleOffset === 0 ? 1 : -1);
    return {
      transform: [
        { translateX: x },
        { translateY: y + translateY },
        { scale },
        { rotate: `${rotDeg}deg` },
      ],
      zIndex: sinVal > 0 ? 2 : 0,
    };
  };

  const stegoStyle = getTransform(0);
  const brontoStyle = getTransform(Math.PI);

  const dot1Opacity = dotPhase < 0.33 ? 1 : 0.3;
  const dot2Opacity = dotPhase >= 0.33 && dotPhase < 0.66 ? 1 : 0.3;
  const dot3Opacity = dotPhase >= 0.66 ? 1 : 0.3;

  return (
    <View style={styles.container}>
      <View style={[styles.orbitContainer, { width: dims.container, height: dims.container }]}>
        <View style={[styles.orbitShadow, { width: dims.orbit * 2.2, height: dims.orbit * 0.9, backgroundColor: `${t.textMuted}10`, borderRadius: dims.orbit }]} />
        <View style={[styles.dinoWrap, { width: dims.dino, height: dims.dino }, stegoStyle]}>
          <Image
            source={require('../assets/images/dino-stego.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </View>
        <View style={[styles.dinoWrap, { width: dims.dino, height: dims.dino }, brontoStyle]}>
          <Image
            source={require('../assets/images/dino-bronto.png')}
            style={{ width: dims.dino, height: dims.dino }}
            contentFit="contain"
          />
        </View>
      </View>
      {message ? (
        <View style={styles.messageRow}>
          <Text style={[styles.message, { color: t.textSecondary }]}>{message}</Text>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, { backgroundColor: t.primary, opacity: dot1Opacity }]} />
            <View style={[styles.dot, { backgroundColor: t.primary, opacity: dot2Opacity }]} />
            <View style={[styles.dot, { backgroundColor: t.primary, opacity: dot3Opacity }]} />
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
