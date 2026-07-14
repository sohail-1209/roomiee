import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { listingsAPI } from '../services/endpoints';
import { useTheme } from '../hooks/use-theme';
import { Spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<'HOUSE_RENTAL' | 'ROOM_SHARING'>('HOUSE_RENTAL');
  const [search, setSearch] = useState('');

  const { data: listingsData, isLoading, refetch } = useQuery({
    queryKey: ['listings-home', selectedType],
    queryFn: () => listingsAPI.getAll({ type: selectedType }).then((r) => r.data.data),
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
          transition={200}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardPrice, { color: theme.text }]}>
              ₹{item.rent.toLocaleString('en-IN')}/mo
            </Text>
            <View style={[styles.badge, { backgroundColor: selectedType === 'HOUSE_RENTAL' ? '#e0e7ff' : '#fff3c7' }]}>
              <Text style={[styles.badgeText, { color: selectedType === 'HOUSE_RENTAL' ? '#4f46e5' : '#d97706' }]}>
                {selectedType === 'HOUSE_RENTAL' ? 'House' : 'Room'}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={[styles.cardLocation, { color: theme.textSecondary }]} numberOfLines={1}>
            📍 {item.city}, {item.state}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.cardStats, { color: theme.textSecondary }]}>
              {selectedType === 'HOUSE_RENTAL'
                ? `${item.bedrooms} BHK · ${item.bathrooms} Bath`
                : `${item.roomSharing?.genderRequired} Only · ${item.roomSharing?.currentOccupants} Occupants`}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.logoText, { color: theme.text }]}>Roomiee</Text>
          <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>
            Find rooms & roommates
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => (user ? router.push('/profile') : router.push('/login'))}
          style={[styles.profileButton, { backgroundColor: theme.backgroundElement }]}
        >
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileAvatar} />
          ) : (
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>
              {user ? user.name.charAt(0).toUpperCase() : '👤'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement }]}>
        <TextInput
          placeholder="Search by city, landmark..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => router.push(`/explore?city=${search}`)}
          style={[styles.searchInput, { color: theme.text }]}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push(`/explore?city=${search}`)}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setSelectedType('HOUSE_RENTAL')}
          style={[
            styles.tabButton,
            selectedType === 'HOUSE_RENTAL' && [styles.activeTabButton, { borderBottomColor: '#4f46e5' }],
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedType === 'HOUSE_RENTAL' ? '#4f46e5' : theme.textSecondary },
            ]}
          >
            🏠 House Rentals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedType('ROOM_SHARING')}
          style={[
            styles.tabButton,
            selectedType === 'ROOM_SHARING' && [styles.activeTabButton, { borderBottomColor: '#4f46e5' }],
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: selectedType === 'ROOM_SHARING' ? '#4f46e5' : theme.textSecondary },
            ]}
          >
            🤝 Room Sharing
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={listingsData}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4f46e5" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>No listings available</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  logoText: {
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    marginBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  cardStats: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
