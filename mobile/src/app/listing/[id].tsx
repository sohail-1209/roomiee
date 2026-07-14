import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsAPI, requestsAPI, savedAPI } from '../../services/endpoints';
import { useTheme } from '../../hooks/use-theme';
import { useAuth } from '../../context/AuthContext';
import { Spacing } from '../../constants/theme';

export default function ListingDetailScreen() {
  const { id } = useSearchParams();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [requestMsg, setRequestMsg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing-detail', id],
    queryFn: () => listingsAPI.getOne(id as string).then((r) => r.data.data),
    enabled: !!id,
  });

  const { mutate: toggleSave } = useMutation({
    mutationFn: () => (listing?.isSaved ? savedAPI.unsave(id as string) : savedAPI.save(id as string)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing-detail', id] });
      alert(listing?.isSaved ? 'Removed from saved' : 'Listing saved!');
    },
  });

  const { mutate: sendRequest, isPending: requesting } = useMutation({
    mutationFn: () => requestsAPI.create({ listingId: id, message: requestMsg }),
    onSuccess: () => {
      alert('Request sent successfully!');
      setModalVisible(false);
      setRequestMsg('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to send request');
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Listing not found</Text>
      </View>
    );
  }

  const primaryPhoto = listing.photos?.find((p: any) => p.isPrimary)?.url || listing.photos?.[0]?.url;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: primaryPhoto || 'https://placehold.co/800x600?text=Roomiee' }}
          style={styles.heroImage}
        />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.price, { color: theme.text }]}>
              ₹{listing.rent.toLocaleString('en-IN')}/mo
            </Text>
            <TouchableOpacity onPress={() => (user ? toggleSave() : router.push('/login'))}>
              <Text style={[styles.saveText, { color: listing.isSaved ? '#ef4444' : '#4f46e5' }]}>
                {listing.isSaved ? '❤️ Saved' : '🤍 Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{listing.title}</Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>
            📍 {listing.address}, {listing.city}, {listing.state}
          </Text>

          {/* Core details */}
          <View style={[styles.detailsBox, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {listing.type === 'HOUSE_RENTAL' ? 'House' : 'Room'}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Deposit</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                ₹{listing.deposit.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Bedrooms</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{listing.bedrooms} BHK</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
              {listing.description}
            </Text>
          </View>

          {/* Room sharing details if applicable */}
          {listing.type === 'ROOM_SHARING' && listing.roomSharing && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
              <View style={styles.prefGrid}>
                <Text style={[styles.prefText, { color: theme.text }]}>
                  Gender Required: {listing.roomSharing.genderRequired}
                </Text>
                <Text style={[styles.prefText, { color: theme.text }]}>
                  Smoking: {listing.roomSharing.smoking ? 'Allowed' : 'Not Allowed'}
                </Text>
                <Text style={[styles.prefText, { color: theme.text }]}>
                  Drinking: {listing.roomSharing.drinking ? 'Allowed' : 'Not Allowed'}
                </Text>
                <Text style={[styles.prefText, { color: theme.text }]}>
                  Veg Only: {listing.roomSharing.vegOnly ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}

          {/* Owner details */}
          <View style={[styles.ownerSection, { borderTopColor: theme.backgroundElement }]}>
            <Image
              source={{ uri: listing.owner?.profileImage || `https://ui-avatars.com/api/?name=${listing.owner?.name}&background=6366f1&color=fff` }}
              style={styles.ownerAvatar}
            />
            <View>
              <Text style={[styles.ownerName, { color: theme.text }]}>{listing.owner?.name}</Text>
              <Text style={[styles.ownerRating, { color: theme.textSecondary }]}>
                ⭐ {listing.owner?.avgRating?.toFixed(1) || 'New'} Owner
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.backgroundElement }]}>
        <TouchableOpacity
          onPress={() => (user ? setModalVisible(true) : router.push('/login'))}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>Send Rental Request</Text>
        </TouchableOpacity>
      </View>

      {/* Request Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Send Rental Request</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Introduce yourself and your preferred move-in date to the owner.
            </Text>

            <TextInput
              multiline
              numberOfLines={4}
              value={requestMsg}
              onChangeText={setRequestMsg}
              placeholder="e.g. Hi! I'm a student looking to move in next month..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.modalInput, { color: theme.text, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement }]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel, { backgroundColor: theme.backgroundElement }]}
              >
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => sendRequest()}
                disabled={requesting}
                style={[styles.modalBtn, styles.modalBtnSubmit]}
              >
                {requesting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    marginBottom: 20,
  },
  detailsBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  prefGrid: {
    gap: 8,
  },
  prefText: {
    fontSize: 13,
  },
  ownerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
    gap: 12,
  },
  ownerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  ownerRating: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {},
  modalBtnSubmit: {
    backgroundColor: '#4f46e5',
  },
});
