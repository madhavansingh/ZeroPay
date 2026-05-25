import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

export interface PaymentDetails {
  amountAda: number;
  usdValue: number;
  invoiceId: string;
  shopName: string;
}

export function PaymentSheet({
  visible,
  onClose,
  details,
  onPaymentSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  details: PaymentDetails | null;
  onPaymentSuccess: (method: string) => void;
}) {
  const theme = useTheme();
  const [selectedMethod, setSelectedMethod] = useState<'cardano' | 'base' | 'usdc' | 'apple'>('cardano');
  const [processing, setProcessing] = useState(false);

  if (!details) return null;

  const handlePay = async () => {
    Haptics.selection();
    setProcessing(true);
    // Simulate smart contract locking/signing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessing(false);
    Haptics.success();
    onPaymentSuccess(selectedMethod);
  };

  const getMethodFee = () => {
    switch (selectedMethod) {
      case 'cardano':
        return '0.17 ADA (~$0.07)';
      case 'base':
        return '0.0005 ETH (~$0.01)';
      case 'usdc':
        return '$0.02 USDC';
      default:
        return 'Free';
    }
  };

  const getMethodSpeed = () => {
    switch (selectedMethod) {
      case 'cardano':
        return '≈ 20s (1 block)';
      case 'base':
        return '≈ 2s (instant)';
      case 'usdc':
        return '≈ 2s (instant)';
      default:
        return 'Instant';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          entering={SlideInUp}
          style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>Secure Lock Checkout</Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => {
                Haptics.light();
                onClose();
              }}
              disabled={processing}
            >
              <SymbolView name="xmark" size={14} tintColor={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Amount Card */}
          <View style={styles.content}>
            <View style={[styles.amountCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Locking Funds to Escrow</Text>
              <Text style={[styles.amountAda, { color: theme.text }]}>{details.amountAda} ADA</Text>
              <Text style={[styles.amountUsd, { color: theme.textSecondary }]}>
                ≈ ${details.usdValue.toFixed(2)} USD
              </Text>
              <View style={[styles.recipientRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.recipientLabel, { color: theme.textSecondary }]}>Merchant Storefront</Text>
                <Text style={[styles.recipientValue, { color: theme.text }]}>{details.shopName}</Text>
              </View>
            </View>

            {/* Payment Method Selectors */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Secure Channel</Text>
            <View style={styles.methodList}>
              {/* Cardano Wallet */}
              <TouchableOpacity
                style={[
                  styles.methodItem,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  selectedMethod === 'cardano' && { borderColor: theme.tint, borderWidth: 1.5 },
                ]}
                onPress={() => {
                  Haptics.light();
                  setSelectedMethod('cardano');
                }}
                disabled={processing}
              >
                <View style={[styles.methodIcon, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView name="shield.fill" size={18} tintColor={theme.tint} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodName, { color: theme.text }]}>Cardano native Escrow</Text>
                  <Text style={[styles.methodDesc, { color: theme.textSecondary }]}>
                    Locked via multi-signature script on preview-testnet
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Base Layer-2 */}
              <TouchableOpacity
                style={[
                  styles.methodItem,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  selectedMethod === 'base' && { borderColor: theme.tint, borderWidth: 1.5 },
                ]}
                onPress={() => {
                  Haptics.light();
                  setSelectedMethod('base');
                }}
                disabled={processing}
              >
                <View style={[styles.methodIcon, { backgroundColor: '#EEF2FF' }]}>
                  <SymbolView name="bolt.fill" size={18} tintColor="#3B82F6" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodName, { color: theme.text }]}>Base Layer-2 Settlement</Text>
                  <Text style={[styles.methodDesc, { color: theme.textSecondary }]}>
                    Zero-latency off-chain commitments with instant locking
                  </Text>
                </View>
              </TouchableOpacity>

              {/* USDC stablecoin */}
              <TouchableOpacity
                style={[
                  styles.methodItem,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  selectedMethod === 'usdc' && { borderColor: theme.tint, borderWidth: 1.5 },
                ]}
                onPress={() => {
                  Haptics.light();
                  setSelectedMethod('usdc');
                }}
                disabled={processing}
              >
                <View style={[styles.methodIcon, { backgroundColor: '#EEFDF6' }]}>
                  <SymbolView name="dollarsign.circle.fill" size={18} tintColor="#10B981" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodName, { color: theme.text }]}>USDC Stablecoin Lock</Text>
                  <Text style={[styles.methodDesc, { color: theme.textSecondary }]}>
                    Pegged dollar safety, immune to market volatility
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Fee Breakdowns */}
            <View style={[styles.feeCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Network Fee</Text>
                <Text style={[styles.feeValue, { color: theme.text }]}>{getMethodFee()}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Settlement speed</Text>
                <Text style={[styles.feeValue, { color: theme.text }]}>{getMethodSpeed()}</Text>
              </View>
            </View>

            {/* Interactive Confirm Button */}
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: theme.tint }]}
              onPress={handlePay}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <SymbolView name="lock.fill" size={14} tintColor="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.payBtnText}>Sign & Lock Funds</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadii.xlarge,
    borderTopRightRadius: BorderRadii.xlarge,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1.5,
  },
  title: {
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
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  amountCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountAda: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  amountUsd: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.three,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    width: '100%',
    paddingTop: Spacing.three,
  },
  recipientLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipientValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
  },
  methodList: {
    gap: Spacing.two,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadii.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  feeCard: {
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    gap: Spacing.two,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  payBtn: {
    height: 52,
    borderRadius: BorderRadii.large,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Spacing.two,
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
