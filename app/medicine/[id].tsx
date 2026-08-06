/**
 * app/medicine/[id].tsx
 *
 * Medicine Detail — loads real medicine data by ID.
 * API: GET /api/medicines/{id}  — getMedicineDetails()
 *
 * Polished, elegant layout:
 *  - Header card (name, type, badges, Translate button)
 *  - Clinical Info blocks: Description, Uses, Dosage, Warnings, AI Clinical Summary
 *  - Smooth Animated "View More / View Less" toggle with dynamic up/down chevron arrows
 *  - Expanded details: AI Patient Summary (Overview, Mechanism, Administration, Precautions, Medical Help)
 *  - Complete side effects breakdown
 *  - 4 high-value action rows: Set Reminder | Check Interactions | Ask AI About Medicine | Add to My Medicines
 */

import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
  UIManager,
  LayoutAnimation,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getMedicineDetails, saveMedicine, removeSavedMedicine, getSavedMedicines, getScanHistory, type Medicine, type ScanHistoryItem } from '@/services/medicineTabApi';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import { ENDPOINTS } from '@/constants/api';
import { api } from '@/services/api';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MedicineDetail() {
  const { id, from, isSaved } = useLocalSearchParams<{ id: string; from?: string; isSaved?: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(isSaved === 'true');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [translatedUses, setTranslatedUses] = useState<string | null>(null);
  const [translatedDosage, setTranslatedDosage] = useState<string | null>(null);
  const [translatedSideEffects, setTranslatedSideEffects] = useState<string[] | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translatedWarnings, setTranslatedWarnings] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (isSaved === 'true') {
      setSaved(true);
    }
    setLoading(true);
    Promise.all([
      getMedicineDetails(id),
      getSavedMedicines().catch(() => []),
    ])
      .then(([m, savedList]) => {
        setMedicine(m);
        const isSavedFound =
          isSaved === 'true' ||
          Boolean(m?.isSaved) ||
          (Array.isArray(savedList) && savedList.some((s) => String(s.id) === String(id)));
        setSaved(isSavedFound);
        if (!m) setError('Medicine details could not be found.');
      })
      .catch(() => setError('Failed to load medicine details.'))
      .finally(() => setLoading(false));
  }, [id, isSaved]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const handleToggleSave = async () => {
    if (!medicine || saving) return;
    setSaving(true);
    try {
      if (saved) {
        const res = await removeSavedMedicine(medicine.id);
        if (res.success) {
          setSaved(false);
        } else {
          setError('Could not remove medicine. Please try again.');
        }
      } else {
        await saveMedicine(medicine.id);
        setSaved(true);
      }
    } catch (e) {
      console.error('[MedicineDetail] save/unsave error', e);
      setError(saved ? 'Could not remove medicine. Please try again.' : 'Could not save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!medicine) return;
    setTranslating(true);
    try {
      const texts: string[] = [];
      const keys: { key: string; index?: number }[] = [];

      if (medicine.uses) { texts.push(medicine.uses); keys.push({ key: 'uses' }); }
      if (medicine.dosage) { texts.push(medicine.dosage); keys.push({ key: 'dosage' }); }
      if (medicine.description) { texts.push(medicine.description); keys.push({ key: 'description' }); }
      if (medicine.warnings) { texts.push(medicine.warnings); keys.push({ key: 'warnings' }); }
      if (medicine.sideEffects) {
        medicine.sideEffects.forEach((se, i) => {
          texts.push(se);
          keys.push({ key: 'sideEffect', index: i });
        });
      }

      if (texts.length > 0) {
        const combined = texts.join('\n|||\n');
        const res = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: 'POST',
          body: JSON.stringify({ text: combined, language: langCode }),
        });
        const trText = res?.translate_text ?? res?.translated_text ?? combined;
        const pieces = trText.split(/\|\|\|/g).map((s: string) => s.trim());

        if (pieces.length === texts.length) {
          const newSideEffects: string[] = [];
          keys.forEach((meta, idx) => {
            const translated = pieces[idx];
            if (meta.key === 'uses') setTranslatedUses(translated);
            if (meta.key === 'dosage') setTranslatedDosage(translated);
            if (meta.key === 'description') setTranslatedDescription(translated);
            if (meta.key === 'warnings') setTranslatedWarnings(translated);
            if (meta.key === 'sideEffect') newSideEffects.push(translated);
          });
          if (newSideEffects.length > 0) setTranslatedSideEffects(newSideEffects);
          setCurrentLang(langName);
        }
      }
    } catch (e) {
      console.warn('[MedicineDetail] Translation failed:', e);
    } finally {
      setTranslating(false);
    }
  };

  const openHistory = async () => {
    setHistoryVisible(true);
    if (history.length === 0) {
      setHistoryLoading(true);
      try {
        const items = await getScanHistory();
        setHistory(items);
      } catch (e) {
        console.error('[MedicineDetail] getScanHistory error:', e);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const isRx = medicine?.prescriptionType === 'Prescription' || medicine?.prescriptionType === 'High Risk';
  const rxColor = isRx ? '#B91C1C' : '#047857';
  const rxBg = isRx ? '#FEE2E2' : '#D1FAE5';
  const rxBorder = isRx ? '#FECACA' : '#A7F3D0';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topNav}>
          <Pressable
            style={({ pressed }) => [styles.navBackBtn, pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' }]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
          <View style={styles.navTitleWrap}>
            <Text style={styles.navTitle} numberOfLines={1}>Medicine Details</Text>
          </View>
          <View style={styles.navRightActions} />
        </View>
        <View style={styles.center}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading medicine details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !medicine) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topNav}>
          <Pressable
            style={({ pressed }) => [styles.navBackBtn, pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' }]}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
          <View style={styles.navTitleWrap}>
            <Text style={styles.navTitle} numberOfLines={1}>Medicine Details</Text>
          </View>
          <View style={styles.navRightActions} />
        </View>
        <View style={styles.center}>
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={44} color={Colors.danger} />
            <Text style={styles.errorTitle}>Details Unavailable</Text>
            <Text style={styles.errorText}>{error ?? 'Medicine record not found.'}</Text>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.backBtnText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const rawSideEffects = translatedSideEffects ?? medicine.sideEffects ?? [];
  const hasMultipleEffects = rawSideEffects.length > 2;
  const displayedEffects = expanded ? rawSideEffects : rawSideEffects.slice(0, 2);

  const hasExtraDetails = Boolean(
    medicine.patientSummary ||
    medicine.aiSummaryDetails ||
    medicine.description ||
    hasMultipleEffects ||
    medicine.warnings
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Top Navigation Bar ── */}
      <View style={styles.topNav}>
        <Pressable
          style={({ pressed }) => [styles.navBackBtn, pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' }]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>

        <View style={styles.navTitleWrap}>
          <Text style={styles.navTitle} numberOfLines={1}>Medicine Details</Text>
        </View>

        <View style={styles.navRightActions}>
          <Pressable
            style={({ pressed }) => [styles.navIconBtn, pressed && { opacity: 0.7 }]}
            onPress={handleToggleSave}
            disabled={saving}
            hitSlop={8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={saved ? '#16A34A' : '#475569'}
              />
            )}
          </Pressable>

          {from === 'scanner' && (
            <Pressable
              style={({ pressed }) => [styles.navIconBtn, pressed && { opacity: 0.7 }]}
              onPress={openHistory}
              hitSlop={8}
            >
              <Ionicons name="time-outline" size={21} color="#475569" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Hero Card ── */}
        <View style={styles.headerCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="medical" size={28} color={Colors.primary} />
            </View>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.title}>{medicine.name}</Text>
              {medicine.type ? (
                <View style={styles.formPill}>
                  <Text style={styles.formPillText}>{medicine.type}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Badges Row */}
          {(medicine.category || medicine.isVerified) && (
            <View style={styles.badgesRow}>
              {medicine.category ? (
                <View style={[styles.badge, styles.categoryBadge]}>
                  <Ionicons name="pricetag-outline" size={12} color="#1D4ED8" />
                  <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{medicine.category}</Text>
                </View>
              ) : null}

              {medicine.isVerified ? (
                <View style={[styles.badge, styles.verifiedBadge]}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={[styles.badgeText, { color: '#059669' }]}>Verified</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Translate Button */}
          <Pressable
            onPress={() => setLangModalOpen(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.translateBtn, pressed && { opacity: 0.8 }]}
            disabled={translating}
          >
            {translating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="language-outline" size={16} color={Colors.primary} />
            )}
            <Text style={styles.translateText}>
              {translating ? 'Translating...' : currentLang ? `Translated (${currentLang})` : 'Translate Content'}
            </Text>
          </Pressable>
        </View>

        {/* ── Uses & Indications ── */}
        {medicine.uses ? (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              </View>
              <Text style={styles.cardHeaderTitle}>USES & INDICATIONS</Text>
            </View>
            <Text style={styles.cardBodyText}>{translatedUses ?? medicine.uses}</Text>
          </View>
        ) : null}

        {/* ── Dosage & Guidelines ── */}
        {medicine.dosage ? (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time" size={16} color="#2563EB" />
              </View>
              <Text style={styles.cardHeaderTitle}>DOSAGE GUIDELINES</Text>
            </View>
            <Text style={styles.cardBodyText}>{translatedDosage ?? medicine.dosage}</Text>
          </View>
        ) : null}

        {/* ── Side Effects Card ── */}
        {rawSideEffects.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="warning" size={16} color="#D97706" />
              </View>
              <Text style={styles.cardHeaderTitle}>POTENTIAL SIDE EFFECTS</Text>
              {!expanded && hasMultipleEffects && (
                <View style={styles.sideEffectCountBadge}>
                  <Text style={styles.sideEffectCountText}>
                    +{rawSideEffects.length - 2} more
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.sideEffectsList}>
              {displayedEffects.map((s, i) => (
                <View key={i} style={styles.sideEffectRow}>
                  <View style={styles.sideEffectDot} />
                  <Text style={styles.sideEffectText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── AI Smart Summary ── */}
        {medicine.aiSummary ? (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconBadge}>
                <Ionicons name="sparkles" size={15} color="#059669" />
              </View>
              <Text style={styles.aiCardTitle}>HEALTHAI CLINICAL INSIGHTS</Text>
            </View>
            <Text style={styles.aiCardBody}>{medicine.aiSummary}</Text>
          </View>
        ) : null}

        {/* ── Expandable Details Section (Description, Warnings & Patient Summary) ── */}
        {expanded && (
          <>
            {/* Description */}
            {medicine.description ? (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="document-text-outline" size={16} color="#475569" />
                  </View>
                  <Text style={styles.cardHeaderTitle}>DESCRIPTION</Text>
                </View>
                <Text style={styles.cardBodyText}>
                  {translatedDescription ?? medicine.description}
                </Text>
              </View>
            ) : null}

            {/* Warnings */}
            {medicine.warnings ? (
              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.warningTitle}>IMPORTANT WARNINGS & PRECAUTIONS</Text>
                </View>
                <Text style={styles.warningBody}>
                  {translatedWarnings ?? medicine.warnings}
                </Text>
              </View>
            ) : null}

            {/* AI Patient Summary */}
            {medicine.patientSummary && (
              <View style={styles.patientSummaryCard}>
                <View style={styles.patientHeader}>
                  <Ionicons name="heart-circle" size={20} color="#0284C7" />
                  <Text style={styles.patientHeaderTitle}>COMPREHENSIVE PATIENT GUIDE</Text>
                </View>

                {medicine.patientSummary.overview && (
                  <View style={styles.patientSubSection}>
                    <Text style={styles.patientSubTitle}>Overview</Text>
                    <Text style={styles.patientSubBody}>{medicine.patientSummary.overview}</Text>
                  </View>
                )}

                {medicine.patientSummary.howItWorks && (
                  <View style={styles.patientSubSection}>
                    <Text style={styles.patientSubTitle}>How It Works</Text>
                    <Text style={styles.patientSubBody}>{medicine.patientSummary.howItWorks}</Text>
                  </View>
                )}

                {medicine.patientSummary.administration && (
                  <View style={styles.patientSubSection}>
                    <Text style={styles.patientSubTitle}>Administration & Timing</Text>
                    <Text style={styles.patientSubBody}>{medicine.patientSummary.administration}</Text>
                  </View>
                )}

                {medicine.patientSummary.safety && (
                  <View style={styles.patientSubSection}>
                    <Text style={styles.patientSubTitle}>Safety & Precautions</Text>
                    <Text style={styles.patientSubBody}>{medicine.patientSummary.safety}</Text>
                  </View>
                )}

                {medicine.patientSummary.whenToSeekMedicalHelp && (
                  <View style={styles.helpAlertBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="medkit" size={15} color="#991B1B" />
                      <Text style={styles.helpAlertTitle}>When to Seek Medical Help</Text>
                    </View>
                    <Text style={styles.helpAlertBody}>
                      {medicine.patientSummary.whenToSeekMedicalHelp}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Enhanced Animated View More / View Less Button ── */}
        {hasExtraDetails && (
          <View style={styles.viewMoreContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.viewMoreBtn,
                expanded && styles.viewMoreBtnActive,
                pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
              ]}
              onPress={toggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'View less medicine details' : 'View more medicine details'}
            >
              <Text style={[styles.viewMoreText, expanded && styles.viewMoreTextActive]}>
                {expanded ? 'View Less' : 'View More'}
              </Text>
              <View style={[styles.viewMoreIconBox, expanded && styles.viewMoreIconBoxActive]}>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={expanded ? '#047857' : Colors.primary}
                />
              </View>
            </Pressable>
          </View>
        )}

        {/* ── 4 Premium Action Rows ── */}
        <View style={styles.actionSection}>
          <Text style={styles.actionSectionHeader}>MEDICINE ACTIONS</Text>

          <View style={styles.actionList}>
            {/* Set Reminder */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() =>
                router.push(
                  `/medicines/reminders/new?medicineId=${medicine.id}&medicineName=${encodeURIComponent(
                    medicine.name
                  )}`
                )
              }
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="notifications-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>Set Reminder</Text>
                <Text style={styles.actionSub}>Schedule dose alarms & notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <View style={styles.actionDivider} />

            {/* Check Interactions */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() =>
                router.push(
                  `/medicines/check-interactions?medicineId=${medicine.id}&medicineName=${encodeURIComponent(
                    medicine.name
                  )}`
                )
              }
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="git-compare-outline" size={20} color="#D97706" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>Check Interactions</Text>
                <Text style={styles.actionSub}>Verify drug safety & contraindications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <View style={styles.actionDivider} />

            {/* Ask AI About Medicine */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={() =>
                router.push({
                  pathname: '/ai-chat',
                  params: {
                    prefill: `Tell me about ${medicine.name} (${medicine.type}) — explain its uses, dosage rules, side effects, and precautions in simple terms.`,
                  },
                })
              }
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="sparkles" size={20} color="#059669" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionLabel}>Ask AI About Medicine</Text>
                <Text style={styles.actionSub}>Get instant answers from HealthAI Doctor</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            <View style={styles.actionDivider} />

            {/* Add / Remove from My Medicines */}
            <Pressable
              style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              onPress={handleToggleSave}
              disabled={saving}
            >
              <View
                style={[
                  styles.actionIconWrap,
                  { backgroundColor: saved ? '#DCFCE7' : Colors.primary + '14' },
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={saved ? '#16A34A' : Colors.primary}
                  />
                )}
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, saved && { color: '#16A34A', fontWeight: '700' }]}>
                  {saved ? 'Saved to My Medicines' : 'Add to My Medicines'}
                </Text>
                <Text style={styles.actionSub}>
                  {saved ? 'Tap to remove from your saved medicines' : 'Save for quick offline access'}
                </Text>
              </View>
              {!saving && (
                <Ionicons
                  name={saved ? 'checkmark-circle' : 'chevron-forward'}
                  size={saved ? 20 : 18}
                  color={saved ? '#16A34A' : '#94A3B8'}
                />
              )}
            </Pressable>
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />

      {/* ── Scan History Pop-up Modal ── */}
      <Modal
        visible={historyVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Scan History</Text>
            </View>
            <Pressable
              onPress={() => setHistoryVisible(false)}
              hitSlop={10}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {historyLoading ? (
            <View style={styles.historyCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.historyLoadingText}>Loading scan history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.historyCenter}>
              <View style={[styles.modalIconWrap, { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="time-outline" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.historyEmptyTitle}>No scan history yet</Text>
              <Text style={styles.historyEmptySub}>
                Medicines you scan with the camera will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.scanId}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.historyItem,
                    pressed && { opacity: 0.8, backgroundColor: '#F8FAFC' },
                  ]}
                  onPress={() => {
                    setHistoryVisible(false);
                    if (item.medicineId) {
                      router.replace({
                        pathname: `/medicine/${item.medicineId}`,
                        params: { from: 'scanner' },
                      } as any);
                    }
                  }}
                >
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{item.medicineName}</Text>
                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {new Date(item.scannedAt).toLocaleDateString()} · {item.aiSummary || 'Scanned medicine'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingBox: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
    marginTop: 6,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  page: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },

  // ── Hero Header Card ──
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  formPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  formPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
  },

  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  translateText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },

  // ── Info Cards ──
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    flex: 1,
  },
  cardBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },

  // ── Side Effects List ──
  sideEffectCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  sideEffectCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  sideEffectsList: {
    gap: 8,
    marginTop: 2,
  },
  sideEffectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sideEffectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginTop: 8,
  },
  sideEffectText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },

  // ── AI Summary Card ──
  aiCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.6,
  },
  aiCardBody: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 22,
  },

  // ── Warning Card ──
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    gap: 8,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  warningBody: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 21,
  },

  // ── Patient Summary Card ──
  patientSummaryCard: {
    backgroundColor: '#f1f6faff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c0ddfaff',
    padding: 16,
    gap: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingBottom: 10,
  },
  patientHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    letterSpacing: 0.6,
  },
  patientSubSection: {
    gap: 3,
  },
  patientSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C4A6E',
  },
  patientSubBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  helpAlertBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    marginTop: 4,
  },
  helpAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  helpAlertBody: {
    fontSize: 13,
    color: '#881337',
    lineHeight: 19,
  },

  // ── View More / View Less Button ──
  viewMoreContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  viewMoreBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewMoreTextActive: {
    color: '#047857',
  },
  viewMoreIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreIconBoxActive: {
    backgroundColor: '#DCFCE7',
  },

  // ── Action Section ──
  actionSection: {
    marginTop: 4,
    gap: 8,
  },
  actionSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  actionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  actionRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 70,
  },

  // ── Top App Bar ──
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  navBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleWrap: {
    flex: 1,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scan History Modal ──
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  historyLoadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  historyEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
  },
  historyEmptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  historyMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
