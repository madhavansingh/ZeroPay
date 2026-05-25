import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Haptics } from '../constants/motion';
import { Colors, Spacing, BorderRadii, Shadows } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

interface Message {
  id: string;
  sender: 'customer' | 'merchant' | 'system' | 'ai';
  text: string;
  timestamp: string;
  card?: {
    type: 'invoice' | 'milestone' | 'negotiation';
    title: string;
    amount: number;
    status: string;
  };
}

export default function ChatScreen() {
  const theme = useTheme();
  const [inputText, setInputText] = useState('');
  const [activeRoom, setActiveRoom] = useState<'list' | 'room'>('list');
  const [isTyping, setIsTyping] = useState(false);
  const [proposedPrice, setProposedPrice] = useState(90);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'merchant',
      text: "Hello! I can compile the smart contract audit for you. The standard fee is 100 ADA.",
      timestamp: '16:04',
    },
    {
      id: '2',
      sender: 'ai',
      text: "⚡ Gemini Bargain Alert: Recommended price range for this service category is 80 - 92 ADA based on historical market trends. Suggesting counter-offer.",
      timestamp: '16:04',
    },
    {
      id: '3',
      sender: 'customer',
      text: "Could you do 85 ADA? That matches my budget.",
      timestamp: '16:05',
    },
    {
      id: '4',
      sender: 'merchant',
      text: "How about we meet at 90 ADA? Here is the revised smart contract invoice proposal.",
      timestamp: '16:06',
      card: {
        type: 'negotiation',
        title: 'Smart Contract Auditing',
        amount: 90,
        status: 'pending_acceptance',
      },
    },
  ]);

  const rooms = [
    {
      id: 'r1',
      name: 'Arjun Web Dev',
      lastMsg: 'How about we meet at 90 ADA? Here is the...',
      time: '16:06',
      unread: true,
      category: 'Services',
    },
    {
      id: 'r2',
      name: 'Mumbai Spice Kitchen',
      lastMsg: 'Escrow release received! Dispatching order now.',
      time: '14:22',
      unread: false,
      category: 'Food',
    },
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    Haptics.light();
    const newMsg: Message = {
      id: Math.random().toString(),
      sender: 'customer',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulate typing and response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      Haptics.success();
      const reply: Message = {
        id: Math.random().toString(),
        sender: 'merchant',
        text: "Offer accepted. I will lock the milestone terms inside the Cardano script now. Please sign checkout.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 3000);
  };

  const handleAcceptQuote = () => {
    Haptics.success();
    const updated = messages.map((m) => {
      if (m.card?.type === 'negotiation') {
        return {
          ...m,
          card: { ...m.card, status: 'accepted' },
        };
      }
      return m;
    });
    setMessages(updated);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {activeRoom === 'list' ? (
        /* ── CHAT ROOMS LIST ── */
        <Animated.View entering={FadeIn} style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Conversations</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Negotiate price and release milestones securely
            </Text>
          </View>

          <ScrollView style={styles.scroll}>
            {rooms.map((room) => (
              <TouchableOpacity
                activeOpacity={0.85}
                key={room.id}
                style={[styles.roomCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
                onPress={() => {
                  Haptics.light();
                  setActiveRoom('room');
                }}
              >
                <View style={[styles.avatarCircle, { backgroundColor: theme.backgroundSelected }]}>
                  <SymbolView name="person.fill" size={16} tintColor={theme.tint} />
                </View>
                <View style={styles.roomDetails}>
                  <View style={styles.roomHeaderRow}>
                    <Text style={[styles.roomName, { color: theme.text }]}>{room.name}</Text>
                    <Text style={[styles.roomTime, { color: theme.textSecondary }]}>{room.time}</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.roomMsg, { color: theme.textSecondary }]}>
                    {room.lastMsg}
                  </Text>
                </View>
                {room.unread && <View style={[styles.unreadDot, { backgroundColor: theme.tint }]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        /* ── ACTIVE CHAT ROOM ── */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.container}
        >
          {/* Room Header */}
          <View style={[styles.roomHeader, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                Haptics.light();
                setActiveRoom('list');
              }}
            >
              <SymbolView name="chevron.left" size={16} tintColor={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerMeta}>
              <Text style={[styles.headerName, { color: theme.text }]}>Arjun Web Dev</Text>
              <View style={styles.safetyRow}>
                <View style={[styles.stateDot, { backgroundColor: Colors.light.success }]} />
                <Text style={[styles.safetyText, { color: theme.textSecondary }]}>
                  AI trust score: 98% verified
                </Text>
              </View>
            </View>
          </View>

          {/* Gemini AI Bargaining boundary widget */}
          <View style={[styles.aiWidget, { backgroundColor: 'rgba(91, 61, 245, 0.04)', borderBottomColor: theme.border }]}>
            <View style={styles.aiWidgetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SymbolView name="brain.head.profile.fill" size={16} tintColor={theme.tint} />
                <Text style={[styles.aiWidgetTitle, { color: theme.tint }]}>AI Negotiation Bounds</Text>
              </View>
              <View style={styles.aiConfidenceBadge}>
                <Text style={[
                  styles.aiConfidenceText,
                  {
                    color: proposedPrice < 80 ? Colors.light.error : (proposedPrice >= 80 && proposedPrice < 85 ? Colors.light.warning : Colors.light.success)
                  }
                ]}>
                  {proposedPrice < 80 ? 'Risky Bounds (Acceptance < 20%)' : (proposedPrice >= 80 && proposedPrice < 85 ? 'Fair Bounds (Acceptance ~ 65%)' : 'Optimal Zone (Acceptance ~ 94%)')}
                </Text>
              </View>
            </View>
            <View style={styles.sliderMock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>Market range: 80 - 92 ADA</Text>
                <View style={styles.adjustRow}>
                  <TouchableOpacity
                    style={[styles.adjustBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={() => {
                      Haptics.light();
                      setProposedPrice((p) => Math.max(70, p - 1));
                    }}
                  >
                    <SymbolView name="minus" size={10} tintColor={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.adjustValue, { color: theme.text }]}>{proposedPrice} ADA</Text>
                  <TouchableOpacity
                    style={[styles.adjustBtn, { backgroundColor: theme.backgroundSelected }]}
                    onPress={() => {
                      Haptics.light();
                      setProposedPrice((p) => Math.min(110, p + 1));
                    }}
                  >
                    <SymbolView name="plus" size={10} tintColor={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Visual green/red range slider bar */}
              <View style={[styles.sliderTrack, { backgroundColor: theme.border }]}>
                {/* Red warning boundary */}
                <View style={[styles.sliderZone, { backgroundColor: '#FEE2E2', left: '0%', width: '25%' }]} />
                {/* Green recommended boundary */}
                <View style={[styles.sliderZone, { backgroundColor: '#D1FAE5', left: '25%', width: '55%' }]} />
                {/* Red warning boundary */}
                <View style={[styles.sliderZone, { backgroundColor: '#FEE2E2', left: '80%', width: '20%' }]} />
                
                {/* Position the thumb based on proposedPrice from 70 to 110 */}
                <View style={[
                  styles.sliderThumb,
                  {
                    backgroundColor: theme.purple,
                    left: `${Math.min(96, Math.max(0, ((proposedPrice - 70) / 40) * 100))}%`
                  }
                ]} />
              </View>
              
              <View style={styles.sliderValues}>
                <Text style={[styles.sliderVal, { color: theme.textSecondary }]}>Min: 80 ADA</Text>
                <Text style={[styles.sliderValBold, { color: theme.purple }]}>Proposing: {proposedPrice} ADA</Text>
                <Text style={[styles.sliderVal, { color: theme.textSecondary }]}>Max: 100 ADA</Text>
              </View>
            </View>
          </View>

          {/* Messages list */}
          <ScrollView style={styles.messagesList} contentContainerStyle={styles.msgListContent}>
            {messages.map((m) => {
              const isMe = m.sender === 'customer';
              const isAi = m.sender === 'ai';

              if (isAi) {
                return (
                  <View key={m.id} style={[styles.aiAlertCard, { backgroundColor: 'rgba(91, 61, 245, 0.05)' }]}>
                    <Text style={[styles.aiAlertText, { color: theme.tint }]}>{m.text}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={m.id}
                  style={[styles.msgWrapper, isMe ? styles.msgMeWrapper : styles.msgOtherWrapper]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe
                        ? { backgroundColor: theme.tint }
                        : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : theme.text }]}>{m.text}</Text>
                    {m.card && (
                      <View style={[styles.invoiceCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <View style={styles.invCardHeader}>
                          <SymbolView name="doc.plaintext.fill" size={14} tintColor={theme.tint} />
                          <Text style={[styles.invTitle, { color: theme.text }]}>{m.card.title}</Text>
                        </View>
                        <Text style={[styles.invAmount, { color: theme.text }]}>{m.card.amount} ADA</Text>
                        
                        {m.card.status === 'pending_acceptance' ? (
                          <TouchableOpacity
                            style={[styles.acceptBtn, { backgroundColor: Colors.light.success }]}
                            onPress={handleAcceptQuote}
                          >
                            <Text style={styles.acceptBtnText}>Accept Offer</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.acceptedRow}>
                            <SymbolView name="checkmark.circle.fill" size={12} tintColor={Colors.light.success} />
                            <Text style={[styles.acceptedText, { color: Colors.light.success }]}>Accepted</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.msgFooterRow}>
                    <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{m.timestamp}</Text>
                    {isMe && <SymbolView name="checkmark.circle.fill" size={10} tintColor={Colors.light.success} />}
                  </View>
                </View>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.msgWrapper, styles.msgOtherWrapper]}>
                <View style={[styles.bubble, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
                  <Text style={[styles.msgText, { color: theme.textSecondary }]}>Typing...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Typing inputs */}
          <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <TouchableOpacity style={styles.attachBtn}>
              <SymbolView name="plus" size={16} tintColor={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              placeholder="Send secure message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              style={[styles.chatInput, { color: theme.text }]}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <SymbolView name="paperplane.fill" size={16} tintColor={theme.tint} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadii.large,
    borderWidth: 1,
    marginBottom: Spacing.two,
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomDetails: {
    flex: 1,
    gap: Spacing.half,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 14,
    fontWeight: '800',
  },
  roomTime: {
    fontSize: 10,
  },
  roomMsg: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1.5,
    gap: Spacing.three,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  safetyText: {
    fontSize: 9,
    fontWeight: '600',
  },
  aiWidget: {
    padding: Spacing.three,
    borderBottomWidth: 1.5,
    gap: Spacing.two,
  },
  aiWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  aiWidgetTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  aiConfidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadii.small,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  aiConfidenceText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sliderMock: {
    gap: Spacing.one,
  },
  sliderLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  adjustBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustValue: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    marginVertical: 4,
  },
  sliderZone: {
    height: '100%',
    position: 'absolute',
  },
  sliderThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    top: -4,
    zIndex: 10,
  },
  sliderValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderVal: {
    fontSize: 9,
    fontWeight: '600',
  },
  sliderValBold: {
    fontSize: 10,
    fontWeight: '800',
  },
  messagesList: {
    flex: 1,
  },
  msgListContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  msgWrapper: {
    maxWidth: '80%',
    gap: 4,
  },
  msgMeWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgOtherWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadii.large,
    gap: Spacing.two,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 9,
  },
  aiAlertCard: {
    alignSelf: 'stretch',
    borderRadius: BorderRadii.medium,
    padding: Spacing.three,
    marginVertical: Spacing.one,
  },
  aiAlertText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  invoiceCard: {
    padding: Spacing.three,
    borderRadius: BorderRadii.medium,
    borderWidth: 1,
    marginTop: Spacing.one,
    minWidth: 200,
    gap: Spacing.two,
  },
  invCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  invTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  invAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  acceptBtn: {
    height: 32,
    borderRadius: BorderRadii.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  acceptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acceptedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  attachBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    height: 36,
    fontSize: 13,
    fontWeight: '500',
  },
  sendBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
