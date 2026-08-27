/**
 * app/prescription/index.tsx
 *
 * My Prescriptions — List of all uploaded and scanned doctor prescriptions.
 * Provides PDF export, sharing, detail view (/prescription/[id]), and delete capabilities.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Colors, Radius } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import { reportsApi } from '@/services/reportsApi';
import { generatePrescriptionPdf } from '@/utils/pdfGenerator';

const H_PAD = 16;

function formatIndianDateTime(dateStr?: string, fallback: string = ''): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    return `${day} ${month} ${year}, ${strTime}`;
  } catch {
    return fallback;
  }
}

export default function MyPrescriptionsScreen() {
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const { allReports, loading, deleteReport, refresh } = useReports();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const prescriptions = useMemo(() => {
    return allReports.filter((r) => r.reportType?.toUpperCase() === 'PRESCRIPTION');
  }, [allReports]);

  const filteredPrescriptions = useMemo(() => {
    if (!searchQ.trim()) return prescriptions;
    const q = searchQ.toLowerCase().trim();
    return prescriptions.filter(
      (p) =>
        (p.labName && p.labName.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [prescriptions, searchQ]);

  const handleShare = async (item: any) => {
    try {
      setSharingId(item.id);
      const fullReport = await reportsApi.getById(item.id);
      if (!fullReport) {
        Alert.alert('Error', 'Could not load prescription details to generate PDF.');
        return;
      }
      const pdfUri = await generatePrescriptionPdf(fullReport as any);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Prescription PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (e: any) {
      Alert.alert('Cannot share file', e?.message ?? 'Unknown error');
    } finally {
      setSharingId(null);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert('Delete Prescription', `Remove "${item.title || item.labName || 'Prescription'}" from your records?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReport(item.id),
      },
    ]);
  };

  const handleUploadNew = () => {
    router.push({
      pathname: '/upload',
      params: { context: 'prescription' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>My Prescriptions</Text>
          <Text style={styles.headerSubtitle}>
            {prescriptions.length} {prescriptions.length === 1 ? 'record' : 'records'} saved
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
          onPress={handleUploadNew}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.uploadBtnText}>Upload</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doctor, clinic, or title..."
          placeholderTextColor={Colors.textMuted}
          value={searchQ}
          onChangeText={setSearchQ}
          clearButtonMode="while-editing"
        />
        {searchQ.length > 0 && (
          <Pressable onPress={() => setSearchQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      {loading && prescriptions.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your prescriptions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                Promise.resolve(refresh()).finally(() => setRefreshing(false));
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {filteredPrescriptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQ ? 'No matching prescriptions' : 'No prescriptions yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQ
                  ? 'Try searching with a different doctor or clinic name.'
                  : 'Scan or upload your doctor’s prescription to extract medicines, set reminders, and generate PDF summaries.'}
              </Text>
              <Pressable style={styles.emptyCtaBtn} onPress={handleUploadNew}>
                <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyCtaText}>Upload Prescription</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredPrescriptions.map((item) => {
                const isJunkTitle =
                  /^\d+$/.test(item.title.replace(/\.\w+$/, '')) ||
                  /img_|screenshot|whatsapp/i.test(item.title);
                const subText = isJunkTitle
                  ? item.reportTypeFull || item.category || 'Doctor Prescription'
                  : item.title;
                const isSharingThis = sharingId === item.id;

                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.card, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
                    onPress={() => router.push({ pathname: '/prescription/[id]', params: { id: item.id } })}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconWrap}>
                        <Ionicons name="medical-outline" size={20} color={Colors.primary} />
                      </View>

                      <View style={styles.cardMain}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {item.labName || 'Doctor Prescription'}
                        </Text>
                        <Text style={styles.dateMeta} numberOfLines={1}>
                          {formatIndianDateTime(item.analyzedAt, item.date || 'Recent')}
                        </Text>
                        <Text style={styles.fileNameMeta} numberOfLines={1}>
                          {subText}
                        </Text>
                      </View>

                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Analyzed</Text>
                      </View>
                    </View>

                    {/* Card Actions Footer */}
                    <View style={styles.cardFooter}>
                      <Pressable
                        style={styles.viewDetailBtn}
                        onPress={() => router.push({ pathname: '/prescription/[id]', params: { id: item.id } })}
                      >
                        <Text style={styles.viewDetailText}>View Medicines & Advice</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                      </Pressable>

                      <View style={styles.iconActions}>
                        <Pressable
                          style={({ pressed }) => [styles.actionIconBtn, pressed && { opacity: 0.7 }]}
                          onPress={() => handleShare(item)}
                          disabled={isSharingThis}
                          hitSlop={8}
                        >
                          {isSharingThis ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                          ) : (
                            <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
                          )}
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [styles.actionIconBtn, styles.deleteBtnWrap, pressed && { opacity: 0.7 }]}
                          onPress={() => handleDelete(item)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: H_PAD,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 24,
  },
  listWrap: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  dateMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  fileNameMeta: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#BBF7D0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnWrap: {
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
