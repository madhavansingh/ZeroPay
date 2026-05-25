import { Platform, Vibration } from 'react-native';
import { Easing, withSpring, withTiming } from 'react-native-reanimated';

// ── Reanimated Spring Configs ───────────────────────────────────────────────
export const SpringConfigs = {
  stiff: {
    damping: 15,
    mass: 1,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  bouncy: {
    damping: 10,
    mass: 1.2,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  smooth: {
    damping: 26,
    mass: 1.0,
    stiffness: 170,
    overshootClamping: false,
  },
};

// ── Timing Configs ──────────────────────────────────────────────────────────
export const TimingConfigs = {
  quick: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  normal: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  slow: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
};

// ── Tactile Haptic System ───────────────────────────────────────────────────
export const Haptics = {
  selection: () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  },
  success: () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 10, 50, 15]);
    }
  },
  warning: () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 15, 100, 20]);
    }
  },
  error: () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 25, 50, 25, 50, 25]);
    }
  },
  light: () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(5);
    }
  },
};

// ── Reanimated Helper Styles ───────────────────────────────────────────────
export function animateSpring(value: number, type: keyof typeof SpringConfigs = 'gentle') {
  'worklet';
  return withSpring(value, SpringConfigs[type]);
}

export function animateTiming(value: number, type: keyof typeof TimingConfigs = 'normal') {
  'worklet';
  return withTiming(value, TimingConfigs[type]);
}
