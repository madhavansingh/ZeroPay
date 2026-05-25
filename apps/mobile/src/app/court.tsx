import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

interface DisputeCase {
  id: string;
  invoiceId: string;
  shopName: string;
  amountAda: number;
  reason: string;
  stakedJurors: number;
  votesRelease: number;
  votesRefund: number;
  confidence: number;
  status: 'active' | 'resolved';
  timeline: { title: string; desc: string; time: string }[];
}

export default function CourtScreen() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);

  const disputes: DisputeCase[] = [
    {
      id: 'case-1082',
      invoiceId: 'INV-1039',
      shopName: 'Neo Vintage Retail',
      amountAda: 180,
      reason: 'Incorrect item delivery (wrong size streetwear hoodie)',
      stakedJurors: 7,
      votesRelease: 2,
      votesRefund: 4,
      confidence: 86,
      status: 'active',
      timeline: [
        { title: 'Dispute Raised', desc: 'Customer Aarav Sharma submitted evidence ticket', time: 'May 24, 11:20' },
        { title: 'Court Initialized', desc: '7 Staked Jurors selected dynamically from validation pool', time: 'May 24, 11:30' },
        { title: 'Evidence verified on IPFS', desc: 'Uploaded package photos hash verified: QmX89e...2b', time: 'May 24, 13:40' },
      ],
    },
    {
      id: 'case-0941',
      invoiceId: 'INV-8302',
      shopName: 'Mumbai Spice Kitchen',
      amountAda: 250,
      reason: 'Late delivery - missed event catering deadline',
      stakedJurors: 5,
      votesRelease: 4,
      votesRefund: 1,
      confidence: 92,
      status: 'resolved',
      timeline: [
        { title: 'Dispute Settled', desc: 'Consensus 4-1 release votes. Funds released to merchant.', time: 'May 22, 18:05' },
      ],
    },
  ];

  const handleVoteAction = () => {
    Haptics.success();
    alert('Juror validation signature submitted to Cardano preview contract.');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Arbitration Court</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Staked Juror pool consensus and active dispute resolutions
          </Text>
        </View>

        {/* Tab switchers */}
        <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'active' && { backgroundColor: theme.backgroundSelected }]}
            onPress={() => {
              Haptics.light();
              setActiveTab('active');
              setSelectedCase(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'active' ? theme.text : theme.textSecondary },
              ]}
            >
              Active Hearings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && { backgroundColor: theme.backgroundSelected }]}
            onPress={() => {
              Haptics.light();
              setActiveTab('history');
              setSelectedCase(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'history' ? theme.text : theme.textSecondary },
              ]}
            >
              Verdict History
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCase ? (
          /* ── DETAILED HEARING INTERFACE ── */
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                Haptics.light();
                setSelectedCase(null);
              }}
            >
              <SymbolView name="chevron.left" size={14} tintColor={theme.tint} />
              <Text style={[styles.backLinkText, { color: theme.tint }]}>Back to list</Text>
            </TouchableOpacity>

            <View style={[styles.detailCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.shopName, { color: theme.text }]}>{selectedCase.shopName}</Text>
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    Case: {selectedCase.id} · Invoice: {selectedCase.invoiceId}
                  </Text>
                </View>
                <Text style={[styles.amountText, { color: theme.text }]}>{selectedCase.amountAda} ADA</Text>
              </View>

              <Text style={[styles.sectionTitleLabel, { color: theme.textSecondary }]}>Dispute Claim</Text>
              <Text style={[styles.claimText, { color: theme.text }]}>{selectedCase.reason}</Text>
            </View>

            {/* Voting statistics */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Juror Consensus Feed</Text>
            <View style={[styles.detailCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.consensusHeader}>
                <Text style={[styles.consensusLabel, { color: theme.text }]}>Current Voting split</Text>
                <Text style={[styles.confidenceBadge, { color: Colors.light.success }]}>
                  {selectedCase.confidence}% Confidence
                </Text>
              </View>

              <View style={styles.voteBarContainer}>
                <View style={[styles.voteBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.voteReleaseFill,
                      {
                        backgroundColor: Colors.light.success,
                        width: `${(selectedCase.votesRelease / selectedCase.stakedJurors) * 100}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.voteRefundFill,
                      {
                        backgroundColor: Colors.light.error,
                        width: `${(selectedCase.votesRefund / selectedCase.stakedJurors) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.voteLabels}>
                  <Text style={[styles.voteTextLabel, { color: Colors.light.success }]}>
                    Release ({selectedCase.votesRelease})
                  </Text>
                  <Text style={[styles.voteTextLabel, { color: Colors.light.error }]}>
                    Refund ({selectedCase.votesRefund})
                  </Text>
                </View>
              </View>
            </View>

            {/* Evidence Timeline */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Court Activity Timeline</Text>
            <View style={[styles.timelineCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              {selectedCase.timeline.map((item, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.dotCol}>
                    <View style={[styles.timelineDot, { backgroundColor: theme.tint }]} />
                    {idx < selectedCase.timeline.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <View style={styles.timelineInfo}>
                    <Text style={[styles.tlTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.tlDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                    <Text style={[styles.tlTime, { color: theme.textSecondary }]}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Juror Action button */}
            {selectedCase.status === 'active' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.tint }]}
                onPress={handleVoteAction}
              >
                <Text style={styles.actionBtnText}>Sign Juror Verdict (Stake 50 ADA)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          /* ── DISPUTES HEARINGS LIST ── */
          <ScrollView style={styles.scroll}>
            {disputes
              .filter((d) => (activeTab === 'active' ? d.status === 'active' : d.status === 'resolved'))
              .map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.caseCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                  onPress={() => {
                    Haptics.light();
                    setSelectedCase(d);
                  }}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={[styles.shopName, { color: theme.text }]}>{d.shopName}</Text>
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{d.id} · {d.invoiceId}</Text>
                    </View>
                    <Text style={[styles.amountText, { color: theme.text }]}>{d.amountAda} ADA</Text>
                  </View>
                  <Text numberOfLines={2} style={[styles.caseDesc, { color: theme.textSecondary }]}>
                    {d.reason}
                  </Text>
                  <View style={styles.caseFooter}>
                    <View style={styles.jurorCountRow}>
                      <SymbolView name={"gavel.fill" as any} size={12} tintColor={theme.tint} />
                      <Text style={[styles.jurorCountText, { color: theme.textSecondary }]}>
                        {d.stakedJurors} staked jurors
                      </Text>
                    </View>
                    <Text style={[styles.caseConfidenceText, { color: Colors.light.success }]}>
                      {d.confidence}% consensus
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.half,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    padding: Spacing.one,
    borderRadius: BorderRadii.medium,
    marginBottom: Spacing.four,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: BorderRadii.small,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  caseCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
  },
  metaText: {
    fontSize: 11,
    marginTop: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  caseDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  jurorCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jurorCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  caseConfidenceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.three,
  },
  sectionTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  claimText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
  },
  consensusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consensusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  confidenceBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  voteBarContainer: {
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
  voteTextLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  dotCol: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineInfo: {
    flex: 1,
    paddingBottom: Spacing.three,
    gap: 2,
  },
  tlTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tlDesc: {
    fontSize: 12,
  },
  tlTime: {
    fontSize: 10,
  },
  actionBtn: {
    height: 48,
    borderRadius: BorderRadii.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
