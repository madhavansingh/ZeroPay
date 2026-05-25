import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_SIZE = SCREEN_WIDTH * 0.65;

export function QRScannerView({
  visible,
  onClose,
  onScanComplete,
}: {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (details: { shopName: string; amountAda: number; usdValue: number; invoiceId: string }) => void;
}) {
  const theme = useTheme();
  const [scanning, setScanning] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const laserY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      laserY.value = 0;
      laserY.value = withRepeat(withTiming(SCAN_SIZE, { duration: 2000 }), -1, true);

      // Simulate scan detection delay of 3 seconds
      const timer = setTimeout(() => {
        Haptics.success();
        setScanning(false);
        setShowPreview(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedLaserStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: laserY.value }],
    };
  });

  const handlePayPress = () => {
    Haptics.selection();
    setShowPreview(false);
    onClose();
    onScanComplete({
      invoiceId: 'INV-4029',
      shopName: 'Mumbai Spice Kitchen',
      amountAda: 150,
      usdValue: 60,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Header Bar */}
        <View style={styles.scanHeader}>
          <Text style={styles.scanHeaderTitle}>Scan ZeroPay QR Code</Text>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              Haptics.light();
              onClose();
            }}
          >
            <SymbolView name="xmark" size={14} tintColor="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {scanning ? (
          <View style={styles.scannerWrapper}>
            {/* Viewfinder Target */}
            <View style={[styles.viewfinder, { borderColor: theme.tint }]}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.topLeft, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.tint }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: theme.tint }]} />

              {/* Laser Animation */}
              <Animated.View style={[styles.laser, { backgroundColor: theme.tint }, animatedLaserStyle]} />
            </View>
            <Text style={styles.scanInstruction}>Align the QR invoice inside the viewfinder box</Text>
          </View>
        ) : (
          <View style={styles.scannerWrapper}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Merchant Preview Sheet */}
        {showPreview && (
          <Animated.View
            entering={SlideInUp}
            style={[styles.previewSheet, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleRow}>
                <Text style={[styles.previewShop, { color: theme.text }]}>Mumbai Spice Kitchen</Text>
                <SymbolView name="checkmark.seal.fill" size={16} tintColor={Colors.light.success} />
              </View>
              <Text style={[styles.previewMeta, { color: theme.textSecondary }]}>MC-8302 · Food & Catering</Text>
            </View>

            <View style={[styles.statsGrid, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reputation</Text>
                <Text style={[styles.statValue, { color: Colors.light.success }]}>94% Positive</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tier</Text>
                <Text style={[styles.statValue, { color: theme.purple }]}>GOLD tier</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Network</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>Cardano Mainnet</Text>
              </View>
            </View>

            <View style={styles.safetyBanner}>
              <SymbolView name="shield.fill" size={14} tintColor={Colors.light.success} />
              <Text style={[styles.safetyText, { color: Colors.light.success }]}>
                Escrow Guarantee: Funds remain locked until you confirm delivery.
              </Text>
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.previewPayBtn, { backgroundColor: theme.tint }]}
                onPress={handlePayPress}
              >
                <Text style={styles.previewPayBtnText}>Lock Escrow & Pay (150 ADA)</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 15, 0.85)',
    justifyContent: 'space-between',
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: Spacing.three,
  },
  scanHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  viewfinder: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderWidth: 1.5,
    borderRadius: BorderRadii.large,
    position: 'relative',
    overflow: 'hidden',
  },
  laser: {
    height: 2.5,
    width: '100%',
    position: 'absolute',
    left: 0,
    shadowColor: '#3C9FFE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: BorderRadii.medium,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: BorderRadii.medium,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: BorderRadii.medium,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: BorderRadii.medium,
  },
  scanInstruction: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.four,
  },
  previewSheet: {
    borderTopLeftRadius: BorderRadii.xlarge,
    borderTopRightRadius: BorderRadii.xlarge,
    borderTopWidth: 1.5,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  previewHeader: {
    gap: Spacing.half,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  previewShop: {
    fontSize: 18,
    fontWeight: '800',
  },
  previewMeta: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.three,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    gap: Spacing.half,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  safetyBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: BorderRadii.small,
    padding: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
  },
  safetyText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  previewActions: {
    marginTop: Spacing.one,
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  previewPayBtn: {
    height: 48,
    borderRadius: BorderRadii.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
