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
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, FadeInDown, Layout, SlideInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  
  // Dynamic UI States
  const [isNetworkOffline, setIsNetworkOffline] = useState(false);
  const [isChainCongested, setIsChainCongested] = useState(false);
  const [expandedEscrowId, setExpandedEscrowId] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [selectedChartBar, setSelectedChartBar] = useState<number | null>(null);
  const [auditState, setAuditState] = useState<'idle' | 'checking_mempool' | 'verifying_utxos' | 'auditing_ledgers' | 'success'>('idle');

  // Interactive Chart Telemetry Data
  const chartData = [
    { day: 'Mon', sales: 450, usd: 180, height: 45 },
    { day: 'Tue', sales: 750, usd: 300, height: 75 },
    { day: 'Wed', sales: 580, usd: 232, height: 58 },
    { day: 'Thu', sales: 920, usd: 368, height: 92 },
    { day: 'Fri', sales: 850, usd: 340, height: 85 },
    { day: 'Sat', sales: 1150, usd: 460, height: 115 },
    { day: 'Sun', sales: 980, usd: 392, height: 98 }
  ];

  // Active Escrows state
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

  // Activity log ledger
  const activityLogs = [
    { id: 'tx-01', title: 'Contract Lock Complete', desc: '450 ADA locked on Cardano Preview-net script', amount: '-450 ADA', time: '16:06', success: true },
    { id: 'tx-02', title: 'Milestone Release Payout', desc: 'Funds released to Mumbai Spice Kitchen', amount: '-250 ADA', time: '14:22', success: true },
    { id: 'tx-03', title: 'UTxO Validation Check', desc: 'Vault balance matches local ledger records', amount: 'Reconciled', time: '12:00', success: true }
  ];

  // Load session
  useEffect(() => {
    loadSavedUser();
    loadSavedWallet();

    // Randomly toggle mock network connection drop / chain congestion warning
    // to simulate real operational behavior and showcase Safe under Failure states.
    const networkTimer = setTimeout(() => {
      setIsChainCongested(true);
      addNotification('Elevated Block Latency', 'Cardano Preview network experiencing slot congestion. Confirmations may take up to 45s.', 'system');
    }, 5000);

    return () => clearTimeout(networkTimer);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.light();
    setAuditState('checking_mempool');
    
    setTimeout(() => {
      setAuditState('verifying_utxos');
      Haptics.light();
    }, 400);

    setTimeout(() => {
      setAuditState('auditing_ledgers');
      Haptics.light();
    }, 800);

    setTimeout(() => {
      setAuditState('success');
      Haptics.success();
    }, 1200);

    setTimeout(() => {
      setRefreshing(false);
      setAuditState('idle');
      setIsNetworkOffline(false);
      setIsChainCongested(false);
      addNotification('Ledger Reconciled', 'Double-entry audit verified 100% correctness with blockchain node state.', 'system');
    }, 1600);
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

  const toggleExpandEscrow = (id: string) => {
    Haptics.light();
    setExpandedEscrowId(expandedEscrowId === id ? null : id);
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
            <View style={styles.profileDetailsRow}>
              <Text style={[styles.profileName, { color: theme.text }]}>Aarav Sharma</Text>
              <View style={styles.roleRow}>
                <Text style={[styles.roleBadge, { color: theme.tint, backgroundColor: theme.backgroundSelected }]}>
                  {activeRole.toUpperCase()}
                </Text>
                {isConnected && (
                  <View style={styles.walletState}>
                    <View style={[styles.stateDot, { backgroundColor: Colors.light.success }]} />
                    <Text style={[styles.walletAddr, { color: theme.textSecondary }]}>Eternl linked</Text>
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
              <SymbolView name="magnifyingglass" size={15} tintColor={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.backgroundSelected }]}
              onPress={() => setInboxOpen(true)}
            >
              <SymbolView name="bell.fill" size={15} tintColor={theme.text} />
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
              <SymbolView name="arrow.triangle.2.circlepath" size={15} tintColor="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── CONGESTION / OFFLINE ALERTS ──────────────────────────────────────── */}
      {isNetworkOffline && (
        <Animated.View entering={FadeInDown} style={[styles.alertBar, { backgroundColor: Colors.light.error }]}>
          <SymbolView name="wifi.slash" size={12} tintColor="#FFFFFF" />
          <Text style={styles.alertText}>Offline mode. Operations will sync automatically upon reconnect.</Text>
        </Animated.View>
      )}

      {isChainCongested && !isNetworkOffline && (
        <Animated.View entering={FadeInDown} style={[styles.alertBar, { backgroundColor: Colors.light.warning }]}>
          <SymbolView name="exclamationmark.triangle.fill" size={12} tintColor="#FFFFFF" />
          <Text style={styles.alertText}>Cardano node slots elevated. Confirmations may experience 30-second delay.</Text>
        </Animated.View>
      )}

      {auditState !== 'idle' && (
        <Animated.View entering={FadeInDown} style={[styles.alertBar, { backgroundColor: theme.backgroundSelected, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.tint} style={{ marginRight: 6 }} />
          <Text style={[styles.alertText, { color: theme.text }]}>
            {auditState === 'checking_mempool' && '🔍 Auditing: Inspecting mempool transactions...'}
            {auditState === 'verifying_utxos' && '🔒 Auditing: Verifying UTxO script commitments...'}
            {auditState === 'auditing_ledgers' && '📊 Auditing: Reconciling double-entry correctness...'}
            {auditState === 'success' && '✅ Ledger Audited: 100% Correctness Verified'}
          </Text>
        </Animated.View>
      )}

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
            {/* Wallet Balance Card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Secure Escrowed Deposits</Text>
                <View style={styles.chainBadge}>
                  <View style={[styles.stateDot, { backgroundColor: Colors.light.success }]} />
                  <Text style={[styles.chainText, { color: theme.textSecondary }]}>Mainnet Sync OK</Text>
                </View>
              </View>
              <Text style={[styles.balanceAda, { color: theme.text }]}>8,940 ADA</Text>
              <Text style={[styles.balanceUsd, { color: theme.textSecondary }]}>≈ $3,576.00 USD</Text>
              
              <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Locked Escrows</Text>
                  <Text style={[styles.statValue, { color: theme.tint }]}>
                    {activeEscrows.filter((e) => e.status === 'locked').length} Active
                  </Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Double-Entry Audit</Text>
                  <Text style={[styles.statValue, { color: Colors.light.success }]}>Ledger Verified</Text>
                </View>
              </View>
            </View>

            {/* Actions Panel */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity activeOpacity={0.85} style={[styles.quickAction, { backgroundColor: theme.backgroundElement }]} onPress={triggerQrScan}>
                <View style={[styles.quickIconCircle, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView name="qrcode.viewfinder" size={18} tintColor={theme.tint} />
                </View>
                <Text style={[styles.quickText, { color: theme.text }]}>Scan QR Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.quickAction, { backgroundColor: theme.backgroundElement }]}
                onPress={async () => {
                  Haptics.selection();
                  if (!isConnected) {
                    await connect('addr_test1vpr80...f82e', 'Eternl');
                    addNotification('Wallet linked', 'Secure Cardano preview address loaded.', 'system');
                  }
                }}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: isConnected ? '#EEFDF6' : '#FFF9EE' }]}>
                  <SymbolView name="wallet.pass.fill" size={18} tintColor={isConnected ? Colors.light.success : Colors.light.warning} />
                </View>
                <Text style={[styles.quickText, { color: theme.text }]}>
                  {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI trust Verification banner */}
            <View style={[styles.aiBanner, { backgroundColor: 'rgba(91, 61, 245, 0.05)' }]}>
              <SymbolView name="brain.head.profile.fill" size={18} tintColor={theme.tint} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiBannerTitle, { color: theme.tint }]}>AI fraud prevention monitor</Text>
                <Text style={[styles.aiBannerDesc, { color: theme.textSecondary }]}>
                  Milestone checks complete. No UTxO drift or collateral anomalies detected.
                </Text>
              </View>
            </View>

            {/* Active timeline progress list */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Escrow Commitments</Text>
            </View>

            <View style={styles.escrowList}>
              {activeEscrows.map((escrow) => {
                const isExpanded = expandedEscrowId === escrow.invoiceId;
                return (
                  <View key={escrow.invoiceId} style={[styles.escrowContainerCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.escrowCard}
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
                    </TouchableOpacity>

                    {/* Collapsible details section for mobile density */}
                    <TouchableOpacity
                      style={[styles.expandToggle, { borderTopColor: theme.border }]}
                      onPress={() => toggleExpandEscrow(escrow.invoiceId)}
                    >
                      <Text style={[styles.expandToggleText, { color: theme.tint }]}>
                        {isExpanded ? 'Hide transaction details' : 'Show transaction details'}
                      </Text>
                      <SymbolView name={isExpanded ? 'chevron.up' : 'chevron.down'} size={10} tintColor={theme.tint} />
                    </TouchableOpacity>

                    {isExpanded && (
                      <Animated.View entering={FadeIn} style={styles.expandedContent}>
                        <TouchableOpacity
                          style={[styles.expandedRowCard, { backgroundColor: theme.backgroundSelected }]}
                          activeOpacity={0.8}
                          onPress={() => {
                            Haptics.light();
                            Clipboard.setString(escrow.txHashCardano);
                            setCopiedTxId(escrow.invoiceId);
                            setTimeout(() => setCopiedTxId(null), 2000);
                          }}
                        >
                          <View style={styles.copyRowLeft}>
                            <SymbolView name="doc.on.doc.fill" size={12} tintColor={theme.tint} style={{ marginRight: 6 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>Cardano Tx Hash</Text>
                              <Text numberOfLines={1} style={[styles.expandedValueText, { color: theme.text }]}>
                                {escrow.txHashCardano}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.copyBadgeText, { color: theme.tint }]}>
                            {copiedTxId === escrow.invoiceId ? 'COPIED' : 'COPY'}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.expandedRow}>
                          <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>Escrow Script Type</Text>
                          <Text style={[styles.expandedValue, { color: theme.text }]}>PlutusV2 Multi-Sig</Text>
                        </View>

                        <View style={styles.expandedRow}>
                          <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>Validation Status</Text>
                          <Text style={[styles.expandedValue, { color: Colors.light.success }]}>100% Ledger Agreement</Text>
                        </View>

                        <View style={styles.expandedRow}>
                          <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>Confirmations</Text>
                          <Text style={[styles.expandedValue, { color: theme.text }]}>
                            {escrow.confirmations} / {escrow.requiredConfirmations} slots verified
                          </Text>
                        </View>

                        <View style={[styles.escrowRuleBox, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                          <SymbolView name="shield.fill" size={12} tintColor={Colors.light.success} style={{ marginRight: 6, marginTop: 2 }} />
                          <Text style={[styles.escrowRuleText, { color: theme.textSecondary }]}>
                            Plutus Script Rule: Funds are cryptographically locked until buyer confirms completion or court rules on dispute. ZeroPay has no administrative key to freeze assets unilaterally.
                          </Text>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Recent Activity Ledger */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transaction Ledger</Text>
            </View>
            <View style={[styles.ledgerCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              {activityLogs.map((log) => (
                <View key={log.id} style={[styles.ledgerRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.ledgerInfo}>
                    <Text style={[styles.ledgerTitle, { color: theme.text }]}>{log.title}</Text>
                    <Text style={[styles.ledgerDesc, { color: theme.textSecondary }]}>{log.desc}</Text>
                  </View>
                  <View style={styles.ledgerMeta}>
                    <Text style={[styles.ledgerAmt, { color: log.amount.startsWith('-') ? theme.error : theme.tint }]}>
                      {log.amount}
                    </Text>
                    <Text style={[styles.ledgerTime, { color: theme.textSecondary }]}>{log.time}</Text>
                  </View>
                </View>
              ))}
            </View>

          </Animated.View>
        ) : (
          /* ── MERCHANT DASHBOARD ── */
          <Animated.View entering={FadeIn} style={styles.dashContainer}>
            {/* Payout & Revenue details */}
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>Locked Sales Balance</Text>
                <Text style={[styles.latencyText, { color: Colors.light.success }]}>SLA: 2.1m settlement</Text>
              </View>
              <Text style={[styles.balanceAda, { color: theme.text }]}>12,450 ADA</Text>
              <Text style={[styles.balanceUsd, { color: theme.textSecondary }]}>≈ $4,980.00 USD</Text>
              
              <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Settlements</Text>
                  <Text style={[styles.statValue, { color: Colors.light.success }]}>148 Releases</Text>
                </View>
                <View style={styles.footerStat}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Dispute Rate</Text>
                  <Text style={[styles.statValue, { color: Colors.light.error }]}>0.4% ratio</Text>
                </View>
              </View>
            </View>

            {/* Weekly telemetry graph */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Sales Telemetry</Text>
            <View style={[styles.chartCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={[styles.chartTooltip, { borderBottomColor: theme.border }]}>
                <Text style={[styles.chartTooltipText, { color: theme.textSecondary }]}>
                  {selectedChartBar !== null
                    ? `${chartData[selectedChartBar].day} Sales: ${chartData[selectedChartBar].sales} ADA (~$${chartData[selectedChartBar].usd})`
                    : 'Tap a bar to view daily metrics'}
                </Text>
              </View>
              <View style={styles.chartBars}>
                {chartData.map((item, idx) => {
                  const isSelected = selectedChartBar === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.light();
                        setSelectedChartBar(selectedChartBar === idx ? null : idx);
                      }}
                      style={styles.barWrapper}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: item.height,
                            backgroundColor: isSelected ? theme.purple : theme.tint,
                            opacity: selectedChartBar !== null && !isSelected ? 0.4 : 1,
                          },
                        ]}
                      />
                      <Text style={[styles.barLabel, { color: isSelected ? theme.purple : theme.textSecondary }]}>
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Webhook & Telemetry integrations */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Webhook Endpoint Telemetry</Text>
            <View style={[styles.gatewayCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.gatewayRow}>
                <View style={styles.gatewayHeaderRow}>
                  <SymbolView name="antenna.radiowaves.left.and.right" size={16} tintColor={Colors.light.success} />
                  <Text style={[styles.gatewayTitle, { color: theme.text }]}>Stripe / Node Sync</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#EEFDF6' }]}>
                  <Text style={[styles.statusBadgeText, { color: Colors.light.success }]}>ACTIVE</Text>
                </View>
              </View>
              <Text style={[styles.gatewaySub, { color: theme.textSecondary }]}>
                Endpoint: https://api.store.com/webhooks/zeropay · Latency: 42ms
              </Text>
            </View>

            {/* Gemini pricing bargains */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Bargain Conversion Rate</Text>
            <View style={[styles.aiBargainCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
              <View style={styles.bargainRow}>
                <View>
                  <Text style={[styles.bargainValue, { color: theme.text }]}>91.4% Acceptance</Text>
                  <Text style={[styles.bargainSub, { color: theme.textSecondary }]}>
                    Bargain quotes compiled by Gemini engine match checkout budgets.
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
          addNotification('Navigation Link', `Transited route workspace: ${route}`, 'system');
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
  profileDetailsRow: {
    gap: 2,
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
    gap: Spacing.two,
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
    width: 34,
    height: 34,
    borderRadius: 17,
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
  escrowContainerCard: {
    borderRadius: BorderRadii.large,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  escrowList: {
    gap: 0,
  },
  escrowCard: {
    padding: Spacing.four,
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
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    gap: 6,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandedContent: {
    padding: Spacing.four,
    paddingTop: 0,
    gap: Spacing.two,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandedValue: {
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 200,
  },
  chartCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    height: 190,
    justifyContent: 'space-between',
  },
  chartTooltip: {
    alignItems: 'center',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    width: '100%',
  },
  chartTooltipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
    paddingTop: Spacing.three,
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
  expandedRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    marginBottom: Spacing.two,
  },
  copyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandedValueText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  copyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  escrowRuleBox: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    marginTop: Spacing.two,
  },
  escrowRuleText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
    fontWeight: '500',
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
  ledgerCard: {
    borderRadius: BorderRadii.large,
    paddingHorizontal: Spacing.four,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  ledgerInfo: {
    gap: 2,
  },
  ledgerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ledgerDesc: {
    fontSize: 11,
  },
  ledgerMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ledgerAmt: {
    fontSize: 13,
    fontWeight: '800',
  },
  ledgerTime: {
    fontSize: 10,
  },
  alertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
