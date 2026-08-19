import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION_MS = 500;

const exitKeyframe = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  70: {
    opacity: 0.2,
    transform: [{ scale: 1.03 }],
    easing: Easing.out(Easing.cubic),
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1.04 }],
    easing: Easing.out(Easing.cubic),
  },
});

export function AnimatedSplashOverlay() {
  const [animateOut, setAnimateOut] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  const logo = (
    <Image
      accessibilityLabel="Omni Fashion"
      source={require('@/assets/images/icon.png')}
      style={styles.logo}
      contentFit="contain"
    />
  );

  if (animateOut) {
    return (
      <Animated.View
        entering={exitKeyframe
          .duration(DURATION_MS)
          .withCallback((finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(setVisible, false);
            }
          })}
        style={styles.overlay}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {logo}
      </Animated.View>
    );
  }

  return (
    <View
      onLayout={() => {
        void SplashScreen.hideAsync().finally(() => {
          setAnimateOut(true);
        });
      }}
      style={styles.overlay}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {logo}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    zIndex: 1000,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 28,
  },
});
