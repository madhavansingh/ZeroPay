import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { SlideInUp, FadeIn, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useUserStore, AppNotification } from '../store/user.store';
import { Haptics } from '../constants/motion';
import { Spacing, BorderRadii, Colors } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

interface CommandItem {
  id: string;
  category: 'Escrows' | 'Navigation' | 'System' | 'Developer';
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
}

export function GlobalOverlays({
  isCommandPaletteOpen,
  setCommandPaletteOpen,
  isInboxOpen,
  setInboxOpen,
  onNavigate,
}: {
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isInboxOpen: boolean;
  setInboxOpen: (open: boolean) => void;
  onNavigate: (route: string) => void;
}) {
  const theme = useTheme();
  const { toggleDeveloperMode, logout, notifications, markNotificationsAsRead } = useUserStore();

  const [cmdSearch, setCmdSearch] = useState('');

  // ── Keyboard event listener for Cmd + K ──────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          Haptics.selection();
          setCommandPaletteOpen(!isCommandPaletteOpen);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCommandPaletteOpen]);

  const commands: CommandItem[] = [
    {
      id: '1',
      category: 'Navigation',
      title: 'Jump to Marketplace Feed',
      subtitle: 'Browse verified merchant storefronts',
      icon: 'bag.fill',
      action: () => {
        onNavigate('explore');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: '2',
      category: 'Escrows',
      title: 'Dispute Arbitration Room',
      subtitle: 'View juror active voting cases',
      icon: 'gavel.fill',
      action: () => {
        onNavigate('court');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: '3',
      category: 'Developer',
      title: 'Infrastructure Telemetry Logs',
      subtitle: 'Open webhook stats, queues, and ledger checks',
      icon: 'cpu.fill',
      action: () => {
        onNavigate('developer');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: '4',
      category: 'System',
      title: 'Toggle Developer Mode Layer',
      subtitle: 'Surface deep ledger diagnostics & telemetry',
      icon: 'wrench.and.screwdriver.fill',
      action: () => {
        toggleDeveloperMode();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: '5',
      category: 'System',
      title: 'Sign Out Session',
      subtitle: 'Clear all wallet links and onboarding steps',
      icon: 'arrow.right.to.line.alt',
      action: () => {
        logout();
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(cmdSearch.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(cmdSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  return (
    <>
      {/* ── COMMAND PALETTE MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={isCommandPaletteOpen}
        transparent
        animationType="none"
        onRequestClose={() => setCommandPaletteOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setCommandPaletteOpen(false)}
        >
          <Animated.View
            entering={SlideInUp}
            style={[styles.cmdContainer, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            <View style={[styles.cmdInputWrapper, { borderBottomColor: theme.border }]}>
              <SymbolView name="magnifyingglass" size={16} tintColor={theme.iconSecondary} />
              <TextInput
                placeholder="Type a command or search action (e.g. telemetry, court)..."
                placeholderTextColor={theme.textSecondary}
                value={cmdSearch}
                onChangeText={setCmdSearch}
                style={[styles.cmdInput, { color: theme.text }]}
                autoFocus
              />
              <Text style={[styles.kbdBadge, { color: theme.textSecondary, borderColor: theme.border }]}>ESC</Text>
            </View>

            <FlatList
              data={filteredCommands}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cmdItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    Haptics.light();
                    item.action();
                  }}
                >
                  <View style={[styles.cmdIconWrapper, { backgroundColor: theme.backgroundSelected }]}>
                    <SymbolView name={item.icon as any} size={16} tintColor={theme.tint} />
                  </View>
                  <View style={styles.cmdDetails}>
                    <View style={styles.cmdTitleRow}>
                      <Text style={[styles.cmdTitle, { color: theme.text }]}>{item.title}</Text>
                      <Text style={[styles.cmdCategory, { color: theme.textSecondary, backgroundColor: theme.border }]}>
                        {item.category}
                      </Text>
                    </View>
                    <Text style={[styles.cmdSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.textSecondary }}>No matching commands found.</Text>
                </View>
              }
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── NOTIFICATION INBOX DRAWER ────────────────────────────────────────── */}
      {isInboxOpen && (
        <View style={styles.inboxWrapper}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setInboxOpen(false)}
          />
          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutRight}
            style={[styles.inboxDrawer, { backgroundColor: theme.backgroundElement, borderLeftColor: theme.border }]}
          >
            <View style={[styles.inboxHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.headerTitleRow}>
                <SymbolView name="bell.fill" size={18} tintColor={theme.tint} />
                <Text style={[styles.inboxTitle, { color: theme.text }]}>Realtime Inbox</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selection();
                  markNotificationsAsRead();
                  setInboxOpen(false);
                }}
              >
                <Text style={[styles.clearBtn, { color: theme.tint }]}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={[styles.notifItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.notifHeaderRow}>
                    <View style={styles.notifBadgeRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              item.type === 'escrow'
                                ? theme.tint
                                : item.type === 'payment'
                                ? Colors.light.success
                                : item.type === 'dispute'
                                ? Colors.light.warning
                                : theme.textSecondary,
                          },
                        ]}
                      />
                      <Text style={[styles.notifType, { color: theme.textSecondary }]}>
                        {item.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.notifTitleText, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.notifBodyText, { color: theme.textSecondary }]}>{item.body}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <SymbolView name="bell.slash.fill" size={32} tintColor={theme.iconSecondary} />
                  <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                    No operational alerts in your inbox.
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 950,
  },
  cmdContainer: {
    width: '90%',
    maxWidth: 500,
    marginTop: Platform.OS === 'ios' ? 100 : 60,
    borderRadius: BorderRadii.large,
    borderWidth: 1.5,
    maxHeight: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cmdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1.5,
    gap: Spacing.two,
  },
  cmdInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  kbdBadge: {
    fontSize: 10,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  cmdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  cmdIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadii.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cmdDetails: {
    flex: 1,
    gap: Spacing.half,
  },
  cmdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cmdTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cmdCategory: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  cmdSubtitle: {
    fontSize: 11,
  },
  emptyState: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  inboxWrapper: {
    ...StyleSheet.absoluteFill,
    zIndex: 960,
  },
  inboxDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '80%',
    maxWidth: 360,
    borderLeftWidth: 1.5,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -8, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1.5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inboxTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifItem: {
    padding: Spacing.four,
    borderBottomWidth: 1,
    gap: Spacing.one,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  notifBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notifType: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notifTime: {
    fontSize: 10,
  },
  notifTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifBodyText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
