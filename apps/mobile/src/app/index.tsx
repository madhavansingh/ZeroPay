import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useUserStore } from '../store/user.store';
import { useWalletStore } from '../store/wallet.store';
import { useTheme } from '../hooks/use-theme';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii, Shadows } from '../constants/theme';

// Import subcomponents
import { AuthOverlay } from '../components/AuthOverlay';
import { GlobalOverlays } from '../components/GlobalOverlays';
import { EscrowDetailsModal, EscrowDetails } from '../components/EscrowDetailsModal';
import { PaymentSheet } from '../components/PaymentSheet';
import { QRScannerView } from '../components/QRScannerView';

export default function HomeScreen() {
  const theme = useTheme();
  
  // Stores
  const {
    isLoggedIn,
    isOnboarded,
    activeRole,
    developerModeEnabled,
    selectRole,
    notifications,
    addNotification,
    loadSavedUser,
  } = useUserStore();
  const { address, isConnected, connect, loadSavedWallet } = useWalletStore();

  // Dialog states
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isInboxOpen, setInboxOpen] = useState(false);
  const [isQrOpen, setQrOpen] = useState(false);
  const [isPaySheetOpen, setPaySheetOpen] = useState(false);
  const [isEscrowDetailsOpen, setEscrowDetailsOpen] = useState(false);
  
  // Selected details
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowDetails | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Active Escrows mock state synced to store
  const [activeEscrows, setActiveEscrows] = useState<EscrowDetails[]>([
    {
      invoiceId: 'INV-9801',
      shopName: 'Arjun Web Dev',
      status: 'locked',
      amountAda: 450,
      usdValue: 180,
      milestoneIndex: 0,
      totalMilestones: 2,
      milestones: [
        { title: 'Draft Smart Contract UI', amount: 200, status: 'completed' },
        { title: 'Verify Solidity compilation', amount: 250, status: 'active' },
      ],
      aiSafetyScore: 98,
      aiRiskSummary: 'Merchant has locked 10+ smart contracts successfully with zero dispute escalations. Safe profile.',
      txHashCardano: 'tx_b810af8d7830ce2c1b98a0029efd1',
      confirmations: 12,
      requiredConfirmations: 10,
      jurorCount: 0,
      jurorVoteRelease: 0,
      jurorVoteRefund: 0,
    },
  ]);

  // Load session
  useEffect(() => {
    loadSavedUser();
    loadSavedWallet();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.light();
    setTimeout(() => {
      setRefreshing(false);
      addNotification('System Refreshed', 'Successfully reconciled ledger correctness check with Cardano node.', 'system');
    }, 1500);
  }, []);

  const handleRoleToggle = () => {
    Haptics.selection();
    const nextRole = activeRole === 'customer' ? 'merchant' : 'customer';
    selectRole(nextRole);
  };

  const triggerQrScan = () => {
    Haptics.selection();
    setQrOpen(true);
  };

  const handleScanComplete = (details: any) => {
    setPaymentDetails(details);
    setTimeout(() => {
      setPaySheetOpen(true);
    }, 500);
  };

  const handlePaymentSuccess = (method: string) => {
    setPaySheetOpen(false);
    
    // Add to active escrows
    const newEscrow: EscrowDetails = {
      invoiceId: paymentDetails?.invoiceId || 'INV-4029',
      shopName: paymentDetails?.shopName || 'Mumbai Spice Kitchen',
      status: 'locked',
      amountAda: paymentDetails?.amountAda || 150,
      usdValue: paymentDetails?.usdValue || 60,
      milestoneIndex: 0,
      totalMilestones: 1,
      milestones: [
        { title: 'Fulfill catering order', amount: paymentDetails?.amountAda || 150, status: 'active' },
      ],
      aiSafetyScore: 94,
      aiRiskSummary: 'Storefront validated. Escrow commitments confirmed via Cardano Preview-net.',
      txHashCardano: 'tx_98f10ab63ce32e18d9f10283c8a9',
      confirmations: 1,
      requiredConfirmations: 10,
      jurorCount: 0,
      jurorVoteRelease: 0,
      jurorVoteRefund: 0,
    };

    setActiveEscrows([newEscrow, ...activeEscrows]);
    addNotification('Escrow Locked Successfully', `Locked ${newEscrow.amountAda} ADA to escrow for ${newEscrow.shopName}.`, 'escrow');
  };

  const handleReleaseMilestone = (invoiceId: string) => {
    Haptics.success();
    setActiveEscrows((prev) =>
      prev.map((esc) => {
        if (esc.invoiceId === invoiceId) {
          return {
            ...esc,
            status: 'released',
            milestones: esc.milestones.map((m) => ({ ...m, status: 'completed' })),
          };
        }
        return esc;
      })
    );
    setEscrowDetailsOpen(false);
    addNotification('Funds Released', `Milestone released for invoice ${invoiceId}. Funds dispatched to merchant.`, 'payment');
  };

  const handleRaiseDispute = (invoiceId: string) => {
    Haptics.warning();
    setActiveEscrows((prev) =>
      prev.map((esc) => {
        if (esc.invoiceId === invoiceId) {
          return {
            ...esc,
            status: 'disputed',
            jurorCount: 5,
            jurorVoteRelease: 2,
            jurorVoteRefund: 1,
          };
        }
        return esc;
      })
    );
    setEscrowDetailsOpen(false);
    addNotification('Dispute Raised', `Arbitration court initialized for invoice ${invoiceId}. Jurors assigned.`, 'dispute');
  };

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length;
  };

  if (!isLoggedIn || !isOnboarded) {
    return <AuthOverlay />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === Colors.light.background ? 'dark-content' : 'light-content'} />
      
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <SafeAreaView style={[styles.safeAreaHeader, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.header}>
          <View style={styles.headerProfile}>
            <View style={[styles.profileAvatar, { backgroundColor: theme.tint }]}>
              <Text style={styles.avatarText}>AS</Text>
            </View>
            <View>
              <Text style={[styles.profileName, { color: theme.text }]}>Aarav Sharma</Text>
              <View style={styles.roleRow}>
                <Text style={[styles.roleBadge, { color: theme.tint, backgroundColor: theme.backgroundSelected }]}>
                  {activeRole.toUpperCase()} MODE
                </Text>
                {isConnected && (
                  <View style={styles.walletState}>
                    <View style={[styles.stateDot, { backgroundColor: Colors.light.success }]} />
                    <Text style={[styles.walletAddr, { color: theme.textSecondary }]}>Eternl connected</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setCommandPaletteOpen(true)}
            >
              <SymbolView name="magnifyingglass" size={16} tintColor={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setInboxOpen(true)}
            >
              <SymbolView name="bell.fill" size={16} tintColor={theme.text} />
              {getUnreadCount() > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: Colors.light.error }]}>
                  <Text style={styles.unreadText}>{getUnreadCount()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.tint }]}
              onPress={handleRoleToggle}
            >
              <SymbolView name="arrow.triangle.2.circlepath" size={16} tintColor="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── MAIN DASHBOARD VIEW CONTENT ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
      >
        {activeRole === 'customer' ? (
          /* ── CUSTOMER DASHBOARD ── */
          <Animated.View entering={FadeIn} style={styles.dashContainer}>
            {/* Wallet summary */}
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Escrowed Balances</Text>
                <View style={styles.chainBadge}>
                  <View style={[styles.stateDot, { backgroundColor: Colors.light.success }]} />
                  <Text style={[styles.chainText, { color: theme.textSecondary }]}>Cardano preview</Text>
                </View>
              </View>
              <Text style={[styles.balanceAda, { color: theme.text }]}>8,940 ADA</Text>
              <Text style={[styles.balanceUsd, { color: theme.textSecondary }]}>≈ $3,576.00 USD</Text>
              
              <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Locks</Text>
                  <Text style={[styles.statValue, { color: theme.tint }]}>
                    {activeEscrows.filter((e) => e.status === 'locked').length} Contracts
                  </Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending release</Text>
                  <Text style={[styles.statValue, { color: Colors.light.warning }]}>
                    {activeEscrows.filter((e) => e.status === 'confirming').length} Blocks
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.backgroundElement }]} onPress={triggerQrScan}>
                <View style={[styles.quickIconCircle, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView name="qrcode.viewfinder" size={20} tintColor={theme.tint} />
                </View>
                <Text style={[styles.quickText, { color: theme.text }]}>Scan Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: theme.backgroundElement }]}
                onPress={async () => {
                  Haptics.selection();
                  if (!isConnected) {
                    await connect('addr_test1vpr80...f82e', 'Eternl');
                    addNotification('Wallet Connected', 'Linked Aarav Sharma Eternl wallet address successfully.', 'system');
                  }
                }}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: isConnected ? '#EEFDF6' : '#FFF9EE' }]}>
                  <SymbolView name="wallet.pass.fill" size={20} tintColor={isConnected ? Colors.light.success : Colors.light.warning} />
                </View>
                <Text style={[styles.quickText, { color: theme.text }]}>
                  {isConnected ? 'Wallet Connected' : 'Link Wallet'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Fraud recommendations banner */}
            <View style={[styles.aiBanner, { backgroundColor: 'rgba(91, 61, 245, 0.06)' }]}>
              <SymbolView name="brain.head.profile.fill" size={18} tintColor={theme.tint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiBannerTitle, { color: theme.tint }]}>Gemini Trust Verification</Text>
                <Text style={[styles.aiBannerDesc, { color: theme.textSecondary }]}>
                  No anomalies detected. Cryptographic guarantees locked inside multi-signature contract vaults.
                </Text>
              </View>
            </View>

            {/* Active timeline progress stepper list */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Escrow Commitments</Text>
            </View>

            <View style={styles.escrowList}>
              {activeEscrows.map((escrow) => (
                <TouchableOpacity
                  key={escrow.invoiceId}
                  style={[styles.escrowCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}
                  onPress={() => {
                    Haptics.light();
                    setSelectedEscrow(escrow);
                    setEscrowDetailsOpen(true);
                  }}
                >
                  <View style={styles.escrowHeader}>
                    <View>
                      <Text style={[styles.escrowShop, { color: theme.text }]}>{escrow.shopName}</Text>
                      <Text style={[styles.escrowInv, { color: theme.textSecondary }]}>{escrow.invoiceId}</Text>
                    </View>
                    <View style={styles.escrowMeta}>
                      <Text style={[styles.escrowAda, { color: theme.text }]}>{escrow.amountAda} ADA</Text>
                      <Text style={[styles.escrowUsd, { color: theme.textSecondary }]}>${escrow.usdValue}</Text>
                    </View>
                  </View>

                  {/* Progress Line */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.progressStepLabel, { color: theme.textSecondary }]}>Locked</Text>
                      <Text style={[styles.progressStepLabel, { color: theme.textSecondary }]}>Released</Text>
                    </View>
                    <View style={[styles.progressLineBg, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.progressLineFill,
                          {
                            backgroundColor: escrow.status === 'released' ? Colors.light.success : theme.tint,
                            width: escrow.status === 'released' ? '100%' : '50%',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.escrowFooter}>
                    <View style={styles.reputationRating}>
                      <SymbolView name="checkmark.seal.fill" size={12} tintColor={theme.tint} />
                      <Text style={[styles.reputationText, { color: theme.textSecondary }]}>
                        AI trust: {escrow.aiSafetyScore}% verified
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: escrow.status === 'released' ? '#EEFDF6' : '#EEF2FF' }]}>
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: escrow.status === 'released' ? Colors.light.success : theme.tint },
                        ]}
                      >
                        {escrow.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ) : (
          /* ── MERCHANT DASHBOARD ── */
          <Animated.View entering={FadeIn} style={styles.dashContainer}>
            {/* Payout & Revenue details */}
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Storefront Locked Revenues</Text>
                <Text style={[styles.latencyText, { color: Colors.light.success }]}>SLA: 2.1m avg</Text>
              </View>
              <Text style={[styles.balanceAda, { color: theme.text }]}>12,450 ADA</Text>
              <Text style={[styles.balanceUsd, { color: theme.textSecondary }]}>≈ $4,980.00 USD</Text>
              
              <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Settlements completed</Text>
                  <Text style={[styles.statValue, { color: Colors.light.success }]}>148 releases</Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active disputes</Text>
                  <Text style={[styles.statValue, { color: Colors.light.error }]}>0.4% ratio</Text>
                </View>
              </View>
            </View>

            {/* SVG line-graph mockup using simple pure-React-Native views */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Sales Telemetry</Text>
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.chartBars}>
                {[40, 70, 55, 90, 80, 110, 95].map((val, idx) => (
                  <View key={idx} style={styles.barWrapper}>
                    <View style={[styles.barFill, { height: val, backgroundColor: theme.tint }]} />
                    <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Webhook & Telemetry integration stats */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Infrastructure Gateways</Text>
            <View style={[styles.gatewayCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.gatewayRow}>
                <View style={styles.gatewayHeaderRow}>
                  <SymbolView name="antenna.radiowaves.left.and.right" size={16} tintColor={Colors.light.success} />
                  <Text style={[styles.gatewayTitle, { color: theme.text }]}>Active Webhook Endpoint</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#EEFDF6' }]}>
                  <Text style={[styles.statusBadgeText, { color: Colors.light.success }]}>OPERATIONAL</Text>
                </View>
              </View>
              <Text style={[styles.gatewaySub, { color: theme.textSecondary }]}>
                Latency: 45ms · Delivery success: 100% · Replays queued: 0
              </Text>
            </View>

            {/* Gemini pricing bargain logs */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Bargain Engine Efficiency</Text>
            <View style={[styles.aiBargainCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.bargainRow}>
                <View>
                  <Text style={[styles.bargainValue, { color: theme.text }]}>91% Conversion</Text>
                  <Text style={[styles.bargainSub, { color: theme.textSecondary }]}>
                    Automated quote adjustments completed successfully
                  </Text>
                </View>
                <SymbolView name="arrow.up.forward.circle.fill" size={24} tintColor={Colors.light.success} />
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── OVERLAYS & MODALS ────────────────────────────────────────────────── */}
      <GlobalOverlays
        isCommandPaletteOpen={isCommandPaletteOpen}
        setCommandPaletteOpen={setCommandPaletteOpen}
        isInboxOpen={isInboxOpen}
        setInboxOpen={setInboxOpen}
        onNavigate={(route) => {
          // Simply triggers alerts for navigation mockup, or integrates if routing is fully set up
          addNotification('Navigated', `Transited path workspace link to: ${route}`, 'system');
        }}
      />

      <QRScannerView
        visible={isQrOpen}
        onClose={() => setQrOpen(false)}
        onScanComplete={handleScanComplete}
      />

      <PaymentSheet
        visible={isPaySheetOpen}
        onClose={() => setPaySheetOpen(false)}
        details={paymentDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <EscrowDetailsModal
        visible={isEscrowDetailsOpen}
        onClose={() => setEscrowDetailsOpen(false)}
        escrow={selectedEscrow}
        onReleaseMilestone={handleReleaseMilestone}
        onRaiseDispute={handleRaiseDispute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeAreaHeader: {
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  roleBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  walletAddr: {
    fontSize: 9,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.four,
  },
  dashContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  summaryCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chainText: {
    fontSize: 10,
    fontWeight: '600',
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  balanceAda: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  balanceUsd: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryFooter: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    marginTop: Spacing.two,
  },
  footerStat: {
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  quickAction: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiBanner: {
    flexDirection: 'row',
    borderRadius: BorderRadii.medium,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiBannerDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  escrowList: {
    gap: Spacing.three,
  },
  escrowCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.three,
  },
  escrowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  escrowShop: {
    fontSize: 15,
    fontWeight: '800',
  },
  escrowInv: {
    fontSize: 11,
    marginTop: 2,
  },
  escrowMeta: {
    alignItems: 'flex-end',
  },
  escrowAda: {
    fontSize: 14,
    fontWeight: '800',
  },
  escrowUsd: {
    fontSize: 11,
    marginTop: 2,
  },
  progressContainer: {
    gap: Spacing.one,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStepLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressLineBg: {
    height: 4,
    borderRadius: 2,
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 2,
  },
  escrowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reputationRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reputationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadii.small,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  chartCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    height: 160,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  barFill: {
    width: 28,
    borderRadius: BorderRadii.small,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  gatewayCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.two,
  },
  gatewayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gatewayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  gatewayTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  gatewaySub: {
    fontSize: 11,
    lineHeight: 14,
  },
  aiBargainCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
  },
  bargainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bargainValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bargainSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
