import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, FadeInUp, SlideInRight, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useUserStore } from '../store/user.store';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'lock.shield.fill',
    title: 'Smart Escrows',
    desc: 'Lock funds in secure, automated smart contracts. Payments release instantly when milestones are completed.',
  },
  {
    icon: 'brain.head.profile.fill',
    title: 'AI Trust & Negotiations',
    desc: 'Bargain and verify merchant reputation in real time with Gemini-powered fraud intelligence filters.',
  },
  {
    icon: 'cpu.fill',
    title: 'Multi-Chain Settlement',
    desc: 'Bridge Cardano safety with Base Layer-2 speeds using USDC stablecoin settle-guarantees.',
  },
  {
    icon: 'gavel.fill',
    title: 'Decentralized Courts',
    desc: 'Resolve disputes fairly through staked juror verification networks. Total transparency at every step.',
  },
];

export function AuthOverlay() {
  const theme = useTheme();
  const { login, verifyOtp, selectRole, user, isLoggedIn, isOnboarded } = useUserStore();

  const [step, setStep] = useState<'onboarding' | 'phone' | 'otp' | 'role'>('onboarding');
  const [slideIndex, setSlideIndex] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'merchant' | 'hybrid' | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const otpScale = useSharedValue(1);

  // Onboarding Carousel handlers
  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    setSlideIndex(index);
  };

  const nextSlide = () => {
    Haptics.selection();
    if (slideIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (slideIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      setStep('phone');
    }
  };

  // Phone submission
  const handlePhoneSubmit = async () => {
    if (phoneNumber.length < 10) {
      Haptics.error();
      return;
    }
    Haptics.success();
    await login(phoneNumber);
    setStep('otp');
  };

  // Keypad press handler
  const handleKeypadPress = (val: string) => {
    Haptics.light();
    if (val === 'back') {
      setOtpCode((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setOtpCode('');
    } else {
      if (otpCode.length < 6) {
        const nextOtp = otpCode + val;
        setOtpCode(nextOtp);
        if (nextOtp.length === 6) {
          // Verify
          verifyOtp(nextOtp).then((success) => {
            if (success) {
              Haptics.success();
              setStep('role');
            } else {
              Haptics.error();
              setOtpCode('');
            }
          });
        }
      }
    }
  };

  // Role Selection submission
  const handleRoleSelect = async (role: 'customer' | 'merchant' | 'hybrid') => {
    Haptics.success();
    setSelectedRole(role);
    await selectRole(role);
  };

  // Determine current screen state
  if (isLoggedIn && isOnboarded) return null;

  // If logged in but role selection is not finished, enforce role selection screen
  const currentStep = isLoggedIn && !isOnboarded ? 'role' : step;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {currentStep === 'onboarding' && (
        <Animated.View entering={FadeIn} style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
          >
            {SLIDES.map((slide, idx) => (
              <View key={idx} style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView name={slide.icon as any} size={48} tintColor={theme.tint} />
                </View>
                <Text style={[styles.slideTitle, { color: theme.text }]}>{slide.title}</Text>
                <Text style={[styles.slideDesc, { color: theme.textSecondary }]}>{slide.desc}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={styles.dotContainer}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: slideIndex === idx ? theme.tint : theme.border },
                  slideIndex === idx && styles.activeDot,
                ]}
              />
            ))}
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.tint }]}
            onPress={nextSlide}
          >
            <Text style={styles.primaryButtonText}>
              {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentStep === 'phone' && (
        <Animated.View entering={FadeInUp} style={styles.container}>
          <View style={styles.authHeader}>
            <View style={[styles.logoCircle, { backgroundColor: theme.backgroundSelected }]}>
              <SymbolView name="shield.lefthalf.filled" size={32} tintColor={theme.tint} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Verify your phone</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter your mobile number to connect or create your Cardano-escrow wallet.
            </Text>
          </View>

          <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.phonePrefix, { color: theme.textSecondary }]}>+91</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={10}
              placeholder="99999 99999"
              placeholderTextColor={theme.textSecondary}
              style={[styles.phoneInput, { color: theme.text }]}
              value={phoneNumber}
              onChangeText={(txt) => setPhoneNumber(txt.replace(/[^0-9]/g, ''))}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: phoneNumber.length === 10 ? theme.tint : theme.border },
            ]}
            onPress={handlePhoneSubmit}
            disabled={phoneNumber.length !== 10}
          >
            <Text style={[styles.primaryButtonText, phoneNumber.length !== 10 && { color: theme.textSecondary }]}>
              Send Verification Code
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {currentStep === 'otp' && (
        <Animated.View entering={SlideInRight} style={styles.container}>
          <View style={styles.authHeader}>
            <Text style={[styles.title, { color: theme.text }]}>Enter Code</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a 6-digit confirmation code to +91 {phoneNumber}
            </Text>
          </View>

          {/* OTP Bubble Displays */}
          <View style={styles.otpGrid}>
            {[...Array(6)].map((_, idx) => {
              const char = otpCode[idx] || '';
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBubble,
                    {
                      borderColor: char ? theme.tint : theme.border,
                      backgroundColor: theme.backgroundElement,
                    },
                  ]}
                >
                  <Text style={[styles.otpChar, { color: theme.text }]}>{char}</Text>
                </View>
              );
            })}
          </View>

          {/* Grid Tactile Keypad */}
          <View style={styles.keypad}>
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['clear', '0', 'back']].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((btn) => (
                  <TouchableOpacity
                    key={btn}
                    style={[styles.keypadButton, { backgroundColor: theme.backgroundElement }]}
                    onPress={() => handleKeypadPress(btn)}
                  >
                    {btn === 'back' ? (
                      <SymbolView name="delete.left.fill" size={20} tintColor={theme.text} />
                    ) : btn === 'clear' ? (
                      <Text style={[styles.keypadTextClear, { color: theme.error }]}>C</Text>
                    ) : (
                      <Text style={[styles.keypadText, { color: theme.text }]}>{btn}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {currentStep === 'role' && (
        <Animated.View entering={FadeInUp} style={styles.container}>
          <View style={styles.authHeader}>
            <Text style={[styles.title, { color: theme.text }]}>Select User Profile</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Choose your operation mode. You can swap this at any time in settings.
            </Text>
          </View>

          <View style={styles.roleGrid}>
            {/* Customer Role */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                selectedRole === 'customer' && { borderColor: theme.tint, borderWidth: 2 },
              ]}
              onPress={() => handleRoleSelect('customer')}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView name="bag.fill" size={24} tintColor={theme.tint} />
              </View>
              <View style={styles.roleDetails}>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Customer Mode</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  Buy goods and services. Safeguard deposits in locked milestone escrows.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Merchant Role */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                selectedRole === 'merchant' && { borderColor: theme.tint, borderWidth: 2 },
              ]}
              onPress={() => handleRoleSelect('merchant')}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: '#EEFBF7' }]}>
                <SymbolView name="cart.fill" size={24} tintColor={Colors.light.success} />
              </View>
              <View style={styles.roleDetails}>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Merchant Mode</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  Create storefronts, track incoming revenue deposits, and resolve billing requests.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Hybrid Mode */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                selectedRole === 'hybrid' && { borderColor: theme.purple, borderWidth: 2 },
              ]}
              onPress={() => handleRoleSelect('hybrid')}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: '#F5F3FF' }]}>
                <SymbolView name="square.stack.3d.up.fill" size={24} tintColor={theme.purple} />
              </View>
              <View style={styles.roleDetails}>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Dual Hybrid Mode</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  Operate dynamically as both customer and merchant with shared wallet balance.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carousel: {
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.four,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  primaryButton: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  authHeader: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
    width: '100%',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.three,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadii.medium,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    width: '100%',
    gap: Spacing.two,
    marginVertical: Spacing.six,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  otpGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.five,
  },
  otpBubble: {
    width: 48,
    height: 56,
    borderRadius: BorderRadii.medium,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpChar: {
    fontSize: 22,
    fontWeight: '800',
  },
  keypad: {
    width: '100%',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  keypadButton: {
    flex: 1,
    height: 60,
    borderRadius: BorderRadii.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 20,
    fontWeight: '700',
  },
  keypadTextClear: {
    fontSize: 18,
    fontWeight: '800',
  },
  roleGrid: {
    width: '100%',
    gap: Spacing.three,
    marginVertical: Spacing.four,
  },
  roleCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: BorderRadii.large,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  roleIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadii.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleDetails: {
    flex: 1,
    gap: Spacing.half,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
