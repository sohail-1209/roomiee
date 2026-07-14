import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listingsAPI } from '../services/endpoints';
import { useTheme } from '../hooks/use-theme';
import { Spacing } from '../constants/theme';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter states
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [type, setType] = useState<'HOUSE_RENTAL' | 'ROOM_SHARING' | ''>('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Sync city parameter from home search bar redirection
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) {
      setCity(cityParam);
    }
  }, [searchParams]);

  // Build params
  const params: any = {};
  if (city) params.city = city;
  if (minRent) params.minRent = minRent;
  if (maxRent) params.maxRent = maxRent;
  if (bedrooms) params.bedrooms = bedrooms;
  if (type) params.type = type;

  const { data: listings, isLoading, refetch } = useQuery({
    queryKey: ['listings-explore', city, minRent, maxRent, bedrooms, type],
    queryFn: () => listingsAPI.getAll(params).then((r) => r.data.data),
  });

  const renderListingItem = ({ item }: { item: any }) => {
    const photo = item.photos?.find((p: any) => p.isPrimary)?.url || item.photos?.[0]?.url;
    return (
      <Pressable
        onPress={() => router.push(`/listing/${item.id}`)}
        style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      >
        <Image
          source={{ uri: photo || 'https://placehold.co/600x400?text=Roomiee' }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <Text style={[styles.cardPrice, { color: theme.text }]}>
            ₹{item.rent.toLocaleString('en-IN')}/mo
          </Text>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardLocation, { color: theme.textSecondary }]}>
            📍 {item.city}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            placeholder="Search by city..."
            placeholderTextColor={theme.textSecondary}
            value={city}
            onChangeText={setCity}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilterModal(!showFilterModal)}
          style={[styles.filterButton, { backgroundColor: theme.backgroundElement }]}
        >
          <Text style={[styles.filterButtonText, { color: theme.text }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilterModal && (
        <View style={[styles.filterPanel, { backgroundColor: theme.backgroundElement }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {/* Rent Filters */}
            <TextInput
              placeholder="Min Rent"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={minRent}
              onChangeText={setMinRent}
              style={[styles.filterInput, { color: theme.text, backgroundColor: theme.background }]}
            />
            <TextInput
              placeholder="Max Rent"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={maxRent}
              onChangeText={setMaxRent}
              style={[styles.filterInput, { color: theme.text, backgroundColor: theme.background }]}
            />
            {/* BHK Filters */}
            <TextInput
              placeholder="BHK (Bedrooms)"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={bedrooms}
              onChangeText={setBedrooms}
              style={[styles.filterInput, { color: theme.text, backgroundColor: theme.background }]}
            />
          </ScrollView>

          <View style={styles.filterTypes}>
            <TouchableOpacity
              onPress={() => setType(type === 'HOUSE_RENTAL' ? '' : 'HOUSE_RENTAL')}
              style={[styles.typeBadge, type === 'HOUSE_RENTAL' && styles.typeBadgeActive]}
            >
              <Text style={[styles.typeBadgeText, type === 'HOUSE_RENTAL' && styles.typeBadgeTextActive]}>House</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType(type === 'ROOM_SHARING' ? '' : 'ROOM_SHARING')}
              style={[styles.typeBadge, type === 'ROOM_SHARING' && styles.typeBadgeActive]}
            >
              <Text style={[styles.typeBadgeText, type === 'ROOM_SHARING' && styles.typeBadgeTextActive]}>Room Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMinRent('');
                setMaxRent('');
                setBedrooms('');
                setType('');
                setCity('');
              }}
              style={styles.resetButton}
            >
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Grid List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>No listings match your search</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  searchInput: {
    paddingVertical: 10,
    fontSize: 14,
  },
  filterButton: {
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPanel: {
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterInput: {
    width: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 13,
  },
  filterTypes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  typeBadgeActive: {
    backgroundColor: '#4f46e5',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60646c',
  },
  typeBadgeTextActive: {
    color: '#ffffff',
  },
  resetButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 12,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 11,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
});
