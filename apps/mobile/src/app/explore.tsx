import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = ['all', 'food', 'retail', 'services', 'vendor', 'digital'];

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch feed with mock fallback if backend is unreachable
  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const catFilter = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
        const res = await fetch(`http://localhost:5050/api/v1/marketplace/feed${catFilter}`, {
          signal: AbortSignal.timeout(3000),
        });
        const payload = await res.json();
        if (payload.success && payload.data?.merchants) {
          setMerchants(payload.data.merchants);
        } else {
          throw new Error('Fallback to mock');
        }
      } catch (err) {
        // High fidelity mock data for offline/simulator experience
        const mockMerchants = [
          {
            merchantId: 'MC-2940',
            shopName: 'Arjun Web Dev',
            slug: 'arjun-web-dev',
            category: 'services',
            description: 'Premium Smart Contract development & Full-stack React auditing.',
            profileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            location: { city: 'Mumbai', country: 'India' },
            reputationScore: 98,
            reliabilityTier: 'platinum',
            verifiedMerchantBadge: true,
          },
          {
            merchantId: 'MC-8302',
            shopName: 'Mumbai Spice Kitchen',
            slug: 'mumbai-spices',
            category: 'food',
            description: 'Fresh organic masalas and authentic gourmet street food caterer.',
            profileImageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=150&q=80',
            location: { city: 'Mumbai', country: 'India' },
            reputationScore: 94,
            reliabilityTier: 'gold',
            verifiedMerchantBadge: true,
          },
          {
            merchantId: 'MC-1039',
            shopName: 'Neo Vintage Retail',
            slug: 'neo-vintage',
            category: 'retail',
            description: 'Curated 90s streetwear, accessories, and recycled custom fits.',
            profileImageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=150&q=80',
            location: { city: 'Delhi', country: 'India' },
            reputationScore: 88,
            reliabilityTier: 'silver',
            verifiedMerchantBadge: false,
          },
        ];

        // Apply category filter on mock
        const filtered =
          selectedCategory === 'all'
            ? mockMerchants
            : mockMerchants.filter((m) => m.category === selectedCategory);

        setMerchants(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [selectedCategory]);

  const filteredMerchants = merchants.filter((m) =>
    m.shopName.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        {/* Title */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">ZeroPay Marketplace</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Discover verified merchants accepting Cardano smart escrows
          </ThemedText>
        </ThemedView>

        {/* Search Input */}
        <ThemedView type="backgroundElement" style={styles.searchWrapper}>
          <SymbolView tintColor={theme.iconSecondary} name="magnifyingglass" size={16} />
          <TextInput
            placeholder="Search stores or services..."
            placeholderTextColor={theme.iconSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </ThemedView>

        {/* Horizontal Category Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.backgroundElement },
                selectedCategory === cat && { borderColor: theme.tint, borderWidth: 1 },
              ]}
            >
              <ThemedText
                type="smallBold"
                style={[
                  styles.categoryText,
                  selectedCategory === cat && { color: theme.tint },
                ]}
              >
                {cat.toUpperCase()}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Merchants List */}
        <ThemedView style={styles.listSection}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.tint} style={styles.loader} />
          ) : filteredMerchants.length === 0 ? (
            <ThemedView style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary">
                No verified merchants match your search filters.
              </ThemedText>
            </ThemedView>
          ) : (
            filteredMerchants.map((m) => (
              <ThemedView key={m.merchantId} type="backgroundElement" style={styles.merchantCard}>
                {/* Logo and title row */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: m.profileImageUrl }} style={styles.avatar} />
                  <View style={styles.headerDetails}>
                    <View style={styles.titleRow}>
                      <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                        {m.shopName}
                      </ThemedText>
                      {m.verifiedMerchantBadge && (
                        <SymbolView tintColor={theme.tint} name="checkmark.seal.fill" size={14} />
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {m.category.toUpperCase()} · {m.location.city}
                    </ThemedText>
                  </View>
                </View>

                {/* Description */}
                <ThemedText type="small" style={styles.description}>
                  {m.description}
                </ThemedText>

                {/* Footer ratings */}
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.footerStat}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Reputation
                    </ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.tint }}>
                      {m.reputationScore}%
                    </ThemedText>
                  </View>
                  <View style={styles.footerStat}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Tier
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={{
                        color:
                          m.reliabilityTier === 'platinum'
                            ? '#10b981'
                            : m.reliabilityTier === 'gold'
                            ? '#f59e0b'
                            : '#8b90a8',
                      }}
                    >
                      {m.reliabilityTier.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
              </ThemedView>
            ))
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    paddingTop: Spacing.six,
    gap: Spacing.one,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'System',
  },
  categoriesScroll: {
    marginHorizontal: -Spacing.four,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  categoryText: {
    fontSize: 10,
  },
  listSection: {
    gap: Spacing.three,
  },
  loader: {
    marginVertical: Spacing.six,
  },
  emptyCard: {
    padding: Spacing.six,
    alignItems: 'center',
  },
  merchantCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
  },
  headerDetails: {
    flex: 1,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  description: {
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.three,
    justifyContent: 'space-between',
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
