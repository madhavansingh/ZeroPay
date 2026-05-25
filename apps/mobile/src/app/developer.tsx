import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

interface WebhookLog {
  id: string;
  event: string;
  url: string;
  status: number;
  time: string;
  latencyMs: number;
  payload: string;
}

export default function DeveloperScreen() {
  const theme = useTheme();
  const [replaying, setReplaying] = useState<string | null>(null);

  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: 'wh-01',
      event: 'escrow.locked',
      url: 'https://api.merchant.com/v1/zeropay-webhook',
      status: 200,
      time: '16:06:12',
      latencyMs: 42,
      payload: '{"invoiceId":"INV-9801","status":"locked","amountLovelace":450000000}',
    },
    {
      id: 'wh-02',
      event: 'milestone.completed',
      url: 'https://api.merchant.com/v1/zeropay-webhook',
      status: 502,
      time: '14:22:45',
      latencyMs: 1205,
      payload: '{"invoiceId":"INV-8302","milestoneIndex":0,"status":"completed"}',
    },
  ]);

  const handleReplay = async (id: string) => {
    Haptics.selection();
    setReplaying(id);
    // Simulate webhook POST trigger delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setLogs((prev) =>
      prev.map((log) => {
        if (log.id === id) {
          return { ...log, status: 200, latencyMs: 38, time: new Date().toTimeString().split(' ')[0] };
        }
        return log;
      })
    );
    
    setReplaying(null);
    Haptics.success();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Telemetry Diagnostics</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Realtime queue telemetry, webhook logs, and ledger correctness logs
          </Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Infrastructure Health */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Services status</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Cardano node</Text>
                <View style={[styles.statusIndicator, { backgroundColor: Colors.light.success }]} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>20ms lat</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Redis Cache</Text>
                <View style={[styles.statusIndicator, { backgroundColor: Colors.light.success }]} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>Connected</Text>
            </View>
          </View>

          {/* Ledger validation audit trail */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ledger Correctness Validation</Text>
          <View style={[styles.logCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
            <View style={styles.validationRow}>
              <SymbolView name="checkmark.shield.fill" size={16} tintColor={Colors.light.success} />
              <Text style={[styles.validationText, { color: theme.text }]}>
                Double-Entry Balance Match: 100% matched
              </Text>
            </View>
            <Text style={[styles.validationDesc, { color: theme.textSecondary }]}>
              On-chain UTxO lock totals match database ledger entries exactly. No asset leakage or anomalies detected.
            </Text>
          </View>

          {/* Queue telemetries */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Worker Queue sizes</Text>
          <View style={[styles.queueCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
            {[
              { name: 'tx-confirmation', size: 0, status: 'idle' },
              { name: 'receipt-generation', size: 1, status: 'active' },
              { name: 'invoice-expiry', size: 0, status: 'idle' },
            ].map((q, idx) => (
              <View key={idx} style={[styles.queueRow, idx > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <View style={styles.queueMeta}>
                  <Text style={[styles.queueName, { color: theme.text }]}>{q.name}</Text>
                  <Text style={[styles.queueStatus, { color: theme.textSecondary }]}>{q.status.toUpperCase()}</Text>
                </View>
                <Text style={[styles.queueSize, { color: theme.tint }]}>{q.size} jobs</Text>
              </View>
            ))}
          </View>

          {/* Webhook logs */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Webhook delivery logs</Text>
          <View style={styles.logsList}>
            {logs.map((log) => (
              <View key={log.id} style={[styles.logItemCard, { backgroundColor: theme.backgroundElement }, Shadows.light]}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={[styles.logEvent, { color: theme.text }]}>{log.event}</Text>
                    <Text numberOfLines={1} style={[styles.logUrl, { color: theme.textSecondary }]}>{log.url}</Text>
                  </View>
                  <View style={styles.logMeta}>
                    <View style={[styles.badge, { backgroundColor: log.status === 200 ? '#EEFDF6' : '#FDF2F2' }]}>
                      <Text style={[styles.badgeText, { color: log.status === 200 ? Colors.light.success : Colors.light.error }]}>
                        {log.status}
                      </Text>
                    </View>
                    <Text style={[styles.logTime, { color: theme.textSecondary }]}>{log.time}</Text>
                  </View>
                </View>
                <View style={[styles.payloadContainer, { backgroundColor: theme.background }]}>
                  <Text numberOfLines={2} style={[styles.payloadText, { color: theme.textSecondary }]}>
                    {log.payload}
                  </Text>
                </View>
                <View style={[styles.logFooter, { borderTopColor: theme.border }]}>
                  <Text style={[styles.latencyLabel, { color: theme.textSecondary }]}>
                    Latency: {log.latencyMs}ms
                  </Text>
                  <TouchableOpacity
                    style={[styles.replayBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={() => handleReplay(log.id)}
                    disabled={replaying === log.id}
                  >
                    {replaying === log.id ? (
                      <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                      <>
                        <SymbolView name="arrow.clockwise" size={10} tintColor={theme.tint} style={{ marginRight: 4 }} />
                        <Text style={[styles.replayText, { color: theme.tint }]}>Replay Webhook</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.two,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  logCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.two,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '800',
  },
  validationDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  queueCard: {
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadii.large,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  queueMeta: {
    gap: 2,
  },
  queueName: {
    fontSize: 13,
    fontWeight: '800',
  },
  queueStatus: {
    fontSize: 9,
    fontWeight: '700',
  },
  queueSize: {
    fontSize: 14,
    fontWeight: '800',
  },
  logsList: {
    gap: Spacing.three,
  },
  logItemCard: {
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    gap: Spacing.three,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logEvent: {
    fontSize: 14,
    fontWeight: '800',
  },
  logUrl: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 220,
  },
  logMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.small,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 9,
  },
  payloadContainer: {
    padding: Spacing.two,
    borderRadius: BorderRadii.small,
  },
  payloadText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  latencyLabel: {
    fontSize: 11,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: BorderRadii.small,
  },
  replayText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
