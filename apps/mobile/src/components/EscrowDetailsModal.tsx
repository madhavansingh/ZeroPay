import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

export interface EscrowDetails {
  invoiceId: string;
  shopName: string;
  status: 'locked' | 'confirming' | 'released' | 'disputed' | 'resolved';
  amountAda: number;
  usdValue: number;
  milestoneIndex: number;
  totalMilestones: number;
  milestones: { title: string; amount: number; status: 'completed' | 'active' | 'pending' }[];
  aiSafetyScore: number; // 0-100
  aiRiskSummary: string;
  txHashCardano: string;
  confirmations: number;
  requiredConfirmations: number;
  jurorCount: number;
  jurorVoteRelease: number;
  jurorVoteRefund: number;
}

export function EscrowDetailsModal({
  visible,
  onClose,
  escrow,
  onReleaseMilestone,
  onRaiseDispute,
}: {
  visible: boolean;
  onClose: () => void;
  escrow: EscrowDetails | null;
  onReleaseMilestone: (id: string) => void;
  onRaiseDispute: (id: string) => void;
}) {
  const theme = useTheme();

  if (!escrow) return null;

  const openTxExplorer = (tx: string) => {
    Haptics.selection();
    const url = `https://preview.cardanoscan.io/transaction/${tx}`;
    Linking.openURL(url).catch((err) => console.error("Couldn't load URL", err));
  };

  const getStatusColor = (status: EscrowDetails['status']) => {
    switch (status) {
      case 'released':
        return Colors.light.success;
      case 'disputed':
        return Colors.light.warning;
      case 'resolved':
        return theme.purple;
      case 'locked':
        return theme.tint;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeInUp}
          style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Contract Mission Control</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Invoice ID: {escrow.invoiceId}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => {
                Haptics.light();
                onClose();
              }}
            >
              <SymbolView name="xmark" size={14} tintColor={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Status Panel */}
            <View style={[styles.statusCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.statusRow}>
                <View>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Contract Balance</Text>
                  <Text style={[styles.amountText, { color: theme.text }]}>
                    {escrow.amountAda} ADA
                  </Text>
                  <Text style={[styles.usdText, { color: theme.textSecondary }]}>
                    ≈ ${escrow.usdValue.toFixed(2)} USD
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(escrow.status) + '15' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(escrow.status) }]}>
                    {escrow.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Chain Health confirmation bar */}
              {escrow.status === 'confirming' && (
                <View style={styles.confProgress}>
                  <View style={styles.confTextRow}>
                    <Text style={[styles.confText, { color: theme.textSecondary }]}>
                      Network Confirmations
                    </Text>
                    <Text style={[styles.confTextBold, { color: theme.tint }]}>
                      {escrow.confirmations}/{escrow.requiredConfirmations}
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.tint,
                          width: `${(escrow.confirmations / escrow.requiredConfirmations) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Milestones stepper section */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Milestones Progress</Text>
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              {escrow.milestones.map((m, idx) => (
                <View key={idx} style={styles.milestoneRow}>
                  <View style={styles.stepperDotColumn}>
                    <View
                      style={[
                        styles.stepperDot,
                        {
                          backgroundColor:
                            m.status === 'completed'
                              ? Colors.light.success
                              : m.status === 'active'
                              ? theme.tint
                              : theme.border,
                        },
                      ]}
                    >
                      {m.status === 'completed' && (
                        <SymbolView name="checkmark" size={10} tintColor="#FFFFFF" />
                      )}
                    </View>
                    {idx < escrow.milestones.length - 1 && (
                      <View style={[styles.stepperLine, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <View style={styles.milestoneDetails}>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        { color: theme.text },
                        m.status === 'completed' && styles.completedText,
                      ]}
                    >
                      {m.title}
                    </Text>
                    <Text style={[styles.milestoneSub, { color: theme.textSecondary }]}>
                      {m.amount} ADA · {m.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* AI Trust report */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Trust Report</Text>
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.aiHeader}>
                <View style={styles.aiBadgeRow}>
                  <SymbolView name="brain.head.profile.fill" size={16} tintColor={theme.tint} />
                  <Text style={[styles.cardSub, { color: theme.text }]}>Gemini Fraud Score</Text>
                </View>
                <Text
                  style={[
                    styles.aiScore,
                    {
                      color:
                        escrow.aiSafetyScore > 80
                          ? Colors.light.success
                          : escrow.aiSafetyScore > 50
                          ? Colors.light.warning
                          : Colors.light.error,
                    },
                  ]}
                >
                  {escrow.aiSafetyScore}% Safe
                </Text>
              </View>
              <Text style={[styles.descText, { color: theme.textSecondary }]}>
                {escrow.aiRiskSummary}
              </Text>
            </View>

            {/* Blockchain details */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>On-Chain Integrity</Text>
            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <TouchableOpacity
                style={styles.explorerRow}
                onPress={() => openTxExplorer(escrow.txHashCardano)}
              >
                <View style={styles.expLabelRow}>
                  <SymbolView name="link" size={14} tintColor={theme.textSecondary} />
                  <Text style={[styles.expLabel, { color: theme.text }]}>Cardano Explorer</Text>
                </View>
                <Text numberOfLines={1} style={[styles.expHash, { color: theme.tint }]}>
                  {escrow.txHashCardano}
                </Text>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.metadataRow}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Escrow Code hash</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>0x8a92f0bf183c271b</Text>
              </View>
            </View>

            {/* Arbitration Court view */}
            {escrow.status === 'disputed' && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Arbitration Court</Text>
                <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.courtTitle, { color: theme.text }]}>Staked Juror Consensus</Text>
                  <Text style={[styles.descText, { color: theme.textSecondary }]}>
                    {escrow.jurorCount} verified jurors have been staked to review evidence.
                  </Text>
                  <View style={styles.voteBarContainer}>
                    <View style={[styles.voteBar, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.voteReleaseFill,
                          {
                            backgroundColor: Colors.light.success,
                            width: `${(escrow.jurorVoteRelease / escrow.jurorCount) * 100}%`,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.voteRefundFill,
                          {
                            backgroundColor: Colors.light.error,
                            width: `${(escrow.jurorVoteRefund / escrow.jurorCount) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.voteLabels}>
                      <Text style={[styles.voteLabel, { color: Colors.light.success }]}>
                        Release ({escrow.jurorVoteRelease})
                      </Text>
                      <Text style={[styles.voteLabel, { color: Colors.light.error }]}>
                        Refund ({escrow.jurorVoteRefund})
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Footer */}
          {escrow.status === 'locked' && (
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.disputeBtn, { borderColor: theme.error }]}
                onPress={() => {
                  Haptics.warning();
                  onRaiseDispute(escrow.invoiceId);
                }}
              >
                <Text style={[styles.disputeBtnText, { color: theme.error }]}>Raise Dispute</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.releaseBtn, { backgroundColor: Colors.light.success }]}
                onPress={() => {
                  Haptics.success();
                  onReleaseMilestone(escrow.invoiceId);
                }}
              >
                <Text style={styles.releaseBtnText}>Release Milestone</Text>
              </TouchableOpacity>
            </View>
          )}
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
    height: '85%',
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
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  statusCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  usdText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.small,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  confProgress: {
    gap: Spacing.one,
  },
  confTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confText: {
    fontSize: 11,
    fontWeight: '600',
  },
  confTextBold: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
  },
  card: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.three,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stepperDotColumn: {
    alignItems: 'center',
  },
  stepperDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  milestoneDetails: {
    flex: 1,
    paddingBottom: Spacing.two,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  milestoneSub: {
    fontSize: 11,
    marginTop: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  cardSub: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiScore: {
    fontSize: 13,
    fontWeight: '800',
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
  },
  explorerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.half,
  },
  expLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  expLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  expHash: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 150,
  },
  divider: {
    height: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  courtTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.half,
  },
  voteBarContainer: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  voteBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  voteReleaseFill: {
    height: '100%',
  },
  voteRefundFill: {
    height: '100%',
    marginLeft: 'auto',
  },
  voteLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voteLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.four,
    borderTopWidth: 1.5,
    gap: Spacing.three,
  },
  disputeBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadii.medium,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disputeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  releaseBtn: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadii.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  releaseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
