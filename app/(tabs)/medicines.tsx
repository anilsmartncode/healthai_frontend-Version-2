/**
 * app/(tabs)/medicines.tsx — Medicines hub (Care Hub style UI)
 * Keeps existing routes: browse, reminders, scanner, interactions, my-medicines, upload.
 */

import { useMemo, useState, useCallback } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius } from '@/constants/Colors';
import { useMedicines } from '@/hooks/useMedicines';
import { ChatInputBar } from '@/components/ui/ChatInputBar';
import { useNotifications } from '@/hooks/useNotifications';
import { markReminderTaken } from '@/services/medicineTabApi';
import { useReports } from '@/hooks/useReports';
import { reportsApi } from '@/services/reportsApi';
import * as Sharing from 'expo-sharing';
import { generatePrescriptionPdf } from '@/utils/pdfGenerator';
import type { Category, Medicine, Reminder } from '@/services/Medicinesapi';
import { useLang } from '@/context/Languagecontext';

const H_PAD = 16;

function whenLabel(when: Reminder['whenToTake'], t: (k: any) => string): string {
  switch (when) {
    case 'before_food':
      return t('before_food');
    case 'with_food':
      return t('with_food');
    case 'bedtime':
      return t('at_bedtime');
    default:
      return t('after_food');
  }
}

function timeOfDayIcon(time: string): keyof typeof Ionicons.glyphMap {
  const t = time.toUpperCase();
  if (t.includes('AM') || t.startsWith('0') || t.startsWith('1')) {
    const hour = parseInt(time, 10);
    if (!Number.isNaN(hour) && hour >= 5 && hour < 12) return 'sunny-outline';
    if (!Number.isNaN(hour) && hour >= 12 && hour < 17) return 'partly-sunny-outline';
  }
  if (t.includes('PM')) return 'moon-outline';
  return 'alarm-outline';
}

function getFormIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('syrup') || n.includes('suspension')) return 'bottle-tonic-plus';
  if (n.includes('injection') || n.includes('vaccine') || n.includes('pen')) return 'needle';
  if (n.includes('drop')) return 'water-outline';
  if (n.includes('cream') || n.includes('gel') || n.includes('ointment')) return 'lotion';
  if (n.includes('inhaler') || n.includes('spray')) return 'spray';
  if (n.includes('capsule')) return 'pill';
  return 'pill'; // default tablet/pill
}

function getFormEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('syrup') || n.includes('suspension') || n.includes('liquid')) return '🧪';
  if (n.includes('injection') || n.includes('vaccine') || n.includes('pen')) return '💉';
  if (n.includes('drop')) return '💧';
  if (n.includes('cream') || n.includes('gel') || n.includes('ointment')) return '🧴';
  if (n.includes('inhaler') || n.includes('spray')) return '💨';
  return '💊';
}

function getFormColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('syrup') || n.includes('suspension')) return '#B45309'; // Clinical Bronze
  if (n.includes('injection') || n.includes('vaccine') || n.includes('pen')) return '#BE123C'; // Muted Rose
  if (n.includes('drop')) return '#0369A1'; // Ocean Blue
  if (n.includes('cream') || n.includes('gel') || n.includes('ointment')) return '#6D28D9'; // Soft Violet
  if (n.includes('inhaler') || n.includes('spray')) return '#64748B'; // Clinical Slate
  if (n.includes('capsule')) return '#C2410C'; // Burnt Orange
  return '#0F766E'; // Medical Teal for tablets
}

function LibraryCard({
  cat,
  count,
  onPress,
}: {
  cat: Category;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.libCard, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[styles.libIcon, { backgroundColor: cat.bg || '#ECFDF5' }]}>
        <Ionicons name={(cat.icon as any) || 'medical-outline'} size={20} color={cat.color || Colors.primary} />
      </View>
      <Text style={styles.libLabel} numberOfLines={2}>
        {cat.name}
      </Text>
      {count != null && <Text style={styles.libCount}>{count}</Text>}
    </Pressable>
  );
}

// ─── MEDICINE ROW ─────────────────────────────────────────────────────────────
function MedicineRow({
  med,
  onPress,
  onDelete,
}: {
  med: Medicine;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const { rowDirection, textAlign, isRTL } = useLang();

  return (
    <Pressable
      style={({ pressed }) => [styles.medRow, { flexDirection: rowDirection }, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.medIcon, { backgroundColor: getFormColor(med.name) + '15' }]}>
        <Text style={{ fontSize: 18 }}>{getFormEmoji(med.name)}</Text>
      </View>
      <View style={styles.medInfo}>
        <Text style={[styles.medName, { textAlign }]}>{med.name}</Text>
        <Text style={[styles.medSub, { textAlign }]}>
          {med.form} · {med.category}
        </Text>
      </View>
      <View style={[styles.medRight, { flexDirection: rowDirection }]}>
        {med.rx && (
          <View style={styles.rxPill}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        )}
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={10} style={{ paddingLeft: 8 }}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        ) : (
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="#CBD5E1" />
        )}
      </View>
    </Pressable>
  );
}

// ─── SAVED MEDICINE ROW ───────────────────────────────────────────────────────
function SavedMedicineRow({
  med,
  onPress,
}: {
  med: Medicine;
  onPress: () => void;
}) {
  const { rowDirection, textAlign } = useLang();

  return (
    <Pressable
      style={({ pressed }) => [styles.medRow, { flexDirection: rowDirection }, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.medIcon, { backgroundColor: getFormColor(med.name) + '15' }]}>
        <MaterialCommunityIcons name={getFormIcon(med.name) as any} size={22} color={getFormColor(med.name)} />
      </View>
      <View style={styles.medInfo}>
        <Text style={[styles.medName, { textAlign }]}>{med.name}</Text>
        <Text style={[styles.medSub, { textAlign }]}>
          {med.form || (med as any).type || 'Medicine'} · {med.category || 'General'}
        </Text>
      </View>
      <View style={[styles.medRight, { flexDirection: rowDirection }]}>
        {med.rx || (med as any).prescriptionType === 'Prescription' ? (
          <View style={styles.rxPill}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
        <Ionicons name="bookmark" size={16} color="#16A34A" />
      </View>
    </Pressable>
  );
}

// ─── PRESCRIPTION ROW ─────────────────────────────────────────────────────────
function formatIndianDateTime(isoString: string | undefined | null, fallback: string): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
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

function PrescriptionRow({
  item,
  onPress,
  onDelete,
}: {
  item: any;
  onPress: () => void;
  onDelete: (id: string) => void;
}) {
  const { t, rowDirection, textAlign } = useLang();
  const isJunkTitle = /^\d+$/.test(item.title.replace(/\.\w+$/, '')) || /img_|screenshot|whatsapp/i.test(item.title);
  const subText = isJunkTitle ? (item.reportTypeFull || item.category || 'Prescription') : item.title;

  const handleDelete = () => {
    Alert.alert(t('delete_prescription'), `${t('remove_prescription_confirm')} "${item.title}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete_btn'),
        style: 'destructive',
        onPress: () => onDelete(item.id),
      },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.reportRow, { flexDirection: rowDirection }, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={[styles.reportIcon, { backgroundColor: '#F0FDF4' }]}>
        <Ionicons name="document-text-outline" size={16} color="#16A34A" />
      </View>
      <View style={styles.reportInfo}>
        <Text style={[styles.reportTitle, { textAlign }]} numberOfLines={1}>
          {item.labName || 'Prescription'}
        </Text>
        <Text style={[styles.reportMeta, { textAlign }]} numberOfLines={1}>
          {formatIndianDateTime(item.analyzedAt, item.date)} • {subText}
        </Text>
      </View>
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={async () => {
            try {
              const fullReport = await reportsApi.getById(item.id);
              if (!fullReport) {
                Alert.alert(t('err_network'), 'Could not load prescription details to generate PDF.');
                return;
              }
              const pdfUri = await generatePrescriptionPdf(fullReport as any);
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(pdfUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: t('share_prescription'),
                  UTI: 'com.adobe.pdf',
                });
              } else {
                Alert.alert(t('err_network'), 'Sharing is not available on this device.');
              }
            } catch (e: any) {
              Alert.alert(t('err_network'), e?.message ?? 'Unknown error');
            }
          }}
          style={({ pressed }) => [
            styles.actionBtnInline,
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            { backgroundColor: Colors.primary + '15' }
          ]}
          hitSlop={12}
        >
          <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.actionBtnInline,
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            { backgroundColor: '#FEF2F2' }
          ]}
          hitSlop={12}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function Medicines() {
  const { t, rowDirection, textAlign, isRTL } = useLang();
  const [searchQ, setSearchQ] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { unreadCount } = useNotifications();

  const {
    categories,
    recentlyViewed,
    savedMedicines,
    todayReminders,
    todayBanner,
    loading,
    refetch,
    removeRecentlyViewed,
  } = useMedicines();

  const { allReports: rawReports, deleteReport, refresh: refreshReports } = useReports();
  const prescriptions = useMemo(() => {
    return rawReports.filter(r => {
      const rt = (r.reportType ?? '').toUpperCase();
      const rtf = (r.reportTypeFull ?? '').toUpperCase();
      const title = (r.title ?? '').toUpperCase();
      const cat = (r.category ?? '').toUpperCase();
      const docType = ((r as any).document_type ?? (r as any).documentType ?? '').toUpperCase();
      return (
        rt === 'PRESCRIPTION' ||
        rt.includes('PRESCRIPTION') ||
        rtf.includes('PRESCRIPTION') ||
        cat.includes('PRESCRIPTION') ||
        docType.includes('PRESCRIPTION') ||
        /prescrip|rx/i.test(r.reportType ?? '') ||
        /prescrip|rx/i.test(r.reportTypeFull ?? '') ||
        /prescrip|rx/i.test(r.title ?? '') ||
        /prescrip|rx/i.test(r.category ?? '')
      );
    });
  }, [rawReports]);

  useFocusEffect(
    useCallback(() => {
      refreshReports();
    }, [refreshReports])
  );

  const handleCategoryPress = (cat: Category) => {
    router.push({
      pathname: '/medicines/browse',
      params: { categoryId: cat.id, categoryName: cat.name },
    });
  };

  const handleViewReminder = () => {
    router.push('/medicines/reminders' as any);
  };

  const handleMarkTaken = async (id: string) => {
    try {
      await markReminderTaken(id);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as taken');
    }
  };

  const handleScanMedicine = () => router.push('/medicines/scanner');
  const handleCheckInteractions = () => router.push('/medicines/check-interactions');
  const handleBrowseAll = () => router.push('/medicines/browse');

  const handleUploadPrescription = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets || r.assets.length === 0) return;
      const file = r.assets[0];

      router.push({
        pathname: '/upload',
        params: {
          context: 'prescription',
          fileUri: file.uri,
          fileName: file.name,
          mimeType: file.mimeType ?? 'application/pdf',
        }
      });
    } catch (err) {
      Alert.alert('Upload Error', 'Failed to pick document.');
    }
  };

  const handleSearch = () => {
    if (searchQ.trim()) {
      router.push({
        pathname: '/medicines/browse',
        params: { query: searchQ.trim() },
      });
    } else {
      handleBrowseAll();
    }
  };

  const handleMedicinePress = (med: Medicine) => {
    router.push({
      pathname: '/medicine/[id]',
      params: { id: med.id },
    });
  };

  const stats = useMemo(() => {
    const active = todayReminders.filter((r) => r.status === 'upcoming' || r.status === 'taken').length;
    const missed = todayReminders.filter((r) => r.status === 'missed').length;
    const taken = todayReminders.filter((r) => r.status === 'taken').length;
    const week = Math.max(todayReminders.length * 7, todayBanner?.count ? todayBanner.count * 7 : 0);
    const denom = taken + missed;
    const adherence = denom === 0 ? 100 : Math.round((taken / denom) * 100);
    return {
      active: todayBanner?.count ?? active,
      missed,
      week: week || 0,
      adherence,
    };
  }, [todayReminders, todayBanner]);

  const scheduleItems = todayReminders.slice(0, 2);



  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: rowDirection, zIndex: 100 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { textAlign }]}>{t('medicines_title')}</Text>
          <Text style={[styles.subtitle, { textAlign }]}>{t('medicines_sub')}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] }]}
          onPress={() => setShowMenu((prev) => !prev)}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
          {unreadCount > 0 && <View style={styles.smallDotBadge} />}
        </Pressable>

        {/* ── 3-Dots Dropdown Menu ── */}
        {showMenu && (
          <>
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => setShowMenu(false)}
            />
            <View style={[styles.dropdownMenu, isRTL ? { left: H_PAD } : { right: H_PAD }]}>
              <Pressable
                style={[styles.dropdownItem, { flexDirection: rowDirection }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/prescription' as any);
                }}
              >
                <View style={[styles.dropdownIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.dropdownItemText}>{t('my_prescriptions')}</Text>
              </Pressable>

              <Pressable
                style={[styles.dropdownItem, { flexDirection: rowDirection }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/medicines/my-medicines' as any);
                }}
              >
                <View style={[styles.dropdownIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="bookmark-outline" size={16} color="#059669" />
                </View>
                <Text style={styles.dropdownItemText}>{t('saved_medicines')}</Text>
              </Pressable>

              <Pressable
                style={[styles.dropdownItem, { flexDirection: rowDirection }]}
                onPress={() => {
                  setShowMenu(false);
                  handleBrowseAll();
                }}
              >
                <View style={[styles.dropdownIconWrap, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="time-outline" size={16} color="#7C3AED" />
                </View>
                <Text style={styles.dropdownItemText}>{t('recent_searches')}</Text>
              </Pressable>

              <Pressable
                style={[styles.dropdownItem, { flexDirection: rowDirection }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/nearby' as any);
                }}
              >
                <View style={[styles.dropdownIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="storefront-outline" size={16} color="#EA580C" />
                </View>
                <Text style={styles.dropdownItemText}>{t('nearby_pharmacies')}</Text>
              </Pressable>

              <Pressable
                style={[styles.dropdownItem, { flexDirection: rowDirection, borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/notifications');
                }}
              >
                <View style={[styles.dropdownIconWrap, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="notifications-outline" size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1, flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.dropdownItemText}>{t('notif_title')}</Text>
                  {unreadCount > 0 && (
                    <View style={styles.notifPill}>
                      <Text style={styles.notifPillText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refetch().finally(() => setRefreshing(false));
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Search */}
          <View style={[styles.searchBar, { flexDirection: rowDirection }]}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { textAlign }]}
              placeholder={t('search_medicines_placeholder')}
              placeholderTextColor={Colors.textMuted}
              value={searchQ}
              onChangeText={setSearchQ}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>

          {/* ── 2x2 Quick Action Grid ── */}
          <View style={styles.grid2Container}>
            {/* Row 1 */}
            <View style={[styles.gridRow, { flexDirection: rowDirection }]}>
              <Pressable
                style={({ pressed }) => [styles.gridTile, { flexDirection: rowDirection }, pressed && styles.gridTilePressed]}
                onPress={handleCheckInteractions}
              >
                <View style={[styles.gridTileIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="git-compare-outline" size={20} color="#EA580C" />
                </View>
                <View style={[styles.gridTileTextWrap, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.gridTileTitle} numberOfLines={1}>{t('interactions')}</Text>
                  <Text style={styles.gridTileSubtitle} numberOfLines={1}>{t('compare_drugs_sub')}</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.gridTile, { flexDirection: rowDirection }, pressed && styles.gridTilePressed]}
                onPress={handleScanMedicine}
              >
                <View style={[styles.gridTileIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="camera-outline" size={20} color="#16A34A" />
                </View>
                <View style={[styles.gridTileTextWrap, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.gridTileTitle} numberOfLines={1}>{t('scan_medicine')}</Text>
                  <Text style={styles.gridTileSubtitle} numberOfLines={1}>{t('scan_medicine_sub')}</Text>
                </View>
              </Pressable>
            </View>

            {/* Row 2 */}
            <View style={[styles.gridRow, { flexDirection: rowDirection }]}>
              <Pressable
                style={({ pressed }) => [styles.gridTile, { flexDirection: rowDirection }, pressed && styles.gridTilePressed]}
                onPress={handleViewReminder}
              >
                <View style={[styles.gridTileIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="alarm-outline" size={20} color="#2563EB" />
                </View>
                <View style={[styles.gridTileTextWrap, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.gridTileTitle} numberOfLines={1}>{t('medicine_reminder')}</Text>
                  <Text style={styles.gridTileSubtitle} numberOfLines={1}>{t('daily_dosage_sub')}</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.gridTile, { flexDirection: rowDirection }, pressed && styles.gridTilePressed]}
                onPress={handleBrowseAll}
              >
                <View style={[styles.gridTileIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="library-outline" size={20} color="#7C3AED" />
                </View>
                <View style={[styles.gridTileTextWrap, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
                  <Text style={styles.gridTileTitle} numberOfLines={1}>{t('browse')}</Text>
                  <Text style={styles.gridTileSubtitle} numberOfLines={1}>{t('az_directory_sub')}</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 16, paddingHorizontal: H_PAD, zIndex: 9999, elevation: 9999 }}>
            <ChatInputBar context="prescription" />
          </View>

          {/* My Prescriptions */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <View style={[styles.secHeader, { flexDirection: rowDirection }]}>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6 }}>
                <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.secTitle}>{t('my_prescriptions')}</Text>
              </View>
              <Pressable onPress={() => router.push('/prescription' as any)} hitSlop={8}>
                <Text style={styles.linkTxt}>{t('view_all')} {isRTL ? '‹' : '›'}</Text>
              </Pressable>
            </View>
            <View style={styles.medList}>
              {prescriptions.length > 0 ? (
                prescriptions.map((item) => (
                  <PrescriptionRow
                    key={item.id}
                    item={item}
                    onPress={() => router.push({ pathname: '/prescription/[id]', params: { id: item.id } })}
                    onDelete={deleteReport}
                  />
                ))
              ) : (
                <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' }}>
                  <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Text style={{ color: Colors.textMuted, textAlign, fontSize: 13, fontWeight: '500' }}>{t('no_prescriptions_yet')}</Text>
                  <Text style={{ color: Colors.textMuted, textAlign, fontSize: 12, marginTop: 4 }}>{t('upload_prescription_hint')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Recently Viewed ── */}
          {/* @ts-ignore - recentlyViewed might be defined in the original branch */}
          {typeof recentlyViewed !== 'undefined' && recentlyViewed.length > 0 && (
            <View style={[styles.section, { marginTop: 20 }]}>
              <View style={[styles.secHeader, { flexDirection: rowDirection }]}>
                <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
                  <Text style={styles.secTitle}>{t('recent_searches')}</Text>
                </View>
                <Pressable onPress={handleBrowseAll} hitSlop={8}>
                  <Text style={styles.linkTxt}>{t('view_all')} {isRTL ? '‹' : '›'}</Text>
                </Pressable>
              </View>
              <View style={styles.medList}>
                {recentlyViewed.slice(0, 4).map((med: any, idx: number) => (
                  <MedicineRow
                    key={`recent_${med.id}_${idx}`}
                    med={med}
                    onPress={() => handleMedicinePress(med)}
                    onDelete={() => {
                      Alert.alert(
                        t('remove_from_history'),
                        t('remove_recent_confirm'),
                        [
                          { text: t('cancel'), style: 'cancel' },
                          { text: t('remove_btn'), style: 'destructive', onPress: () => removeRecentlyViewed(med.id) }
                        ]
                      );
                    }}
                  />
                ))}
              </View>
            </View>
          )}



          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: H_PAD,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  subtitle: { marginTop: 2, fontSize: 13, color: Colors.textMuted },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  smallDotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  menuBackdrop: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 90,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 56,
    right: H_PAD,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 220,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  dropdownIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.text,
  },
  notifPill: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  notifPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },


  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: H_PAD,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },

  promoBanner: {
    marginHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginBottom: 18,
  },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
  promoSub: { marginTop: 4, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  promoArt: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoClock: { position: 'absolute', right: 4, bottom: 4 },

  section: { marginBottom: 18, paddingHorizontal: H_PAD },
  secHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  viewAll: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  medList: { gap: 5 },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medInfo: { flex: 1 },
  medSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  medRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rxPill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkTxt: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  emptySchedule: { alignItems: 'center', gap: 6, paddingVertical: 22, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.textMuted },

  schedRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  schedDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  medHint: { fontSize: 12, color: '#64748B' },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeTxt: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  fullLink: { alignItems: 'center', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  fullLinkTxt: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  statHint: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  refillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  bottleIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillNote: { marginTop: 4, fontSize: 11, color: Colors.textMuted },
  orderBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  orderBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  libRow: { gap: 10, paddingRight: 8 },
  libCard: {
    width: 104,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
  },
  libIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libLabel: { fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 15 },
  libCount: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  grid2Container: {
    marginHorizontal: H_PAD,
    marginBottom: 16,
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridTilePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  gridTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gridTileTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  gridTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  gridTileSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: H_PAD,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, textAlign: 'center' },

  rxBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: H_PAD,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 12,
  },
  rxIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rxSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  reportTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  reportMeta: { fontSize: 13, color: Colors.textMuted },
  actionBtnInline: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

});
