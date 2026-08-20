/**
 * components/ai/AIDataConsentModal.tsx
 * ─────────────────────────────────────────────────────
 * A one-time consent modal shown before the user's first AI interaction.
 * Apple Guideline 5.1.1(i) / 5.1.2(i) requires explicit disclosure of:
 *   1. What data is sent
 *   2. Who processes it
 *   3. User's opt-in consent before sending
 *
 * Consent is persisted via AsyncStorage so the modal only shows once.
 * The user can revoke consent from Privacy & Legal settings.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius } from '@/constants/Colors';

const AI_CONSENT_KEY = '@healthai_ai_data_consent';
const { width: SW } = Dimensions.get('window');
const ms = (size: number) => (SW / 390) * size;

// ─── Data items disclosed to the user ───────────────────────────
const DATA_ITEMS = [
  {
    icon: 'document-text-outline' as const,
    title: 'Medical Reports & Lab Results',
    detail: 'Reports, prescriptions, test results and extracted values',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Health Conversations',
    detail: 'Questions, symptoms and health information you provide',
  },
  {
    icon: 'medkit-outline' as const,
    title: 'Medication Information',
    detail: 'Medicine names, dosage and schedules you provide',
  },
  {
    icon: 'person-outline' as const,
    title: 'Relevant Profile Information',
    detail: 'Age, sex/gender and relevant health information',
  },
];

// ─── Public helpers ─────────────────────────────────────────────

/** Check if the user has already given AI data consent */
export async function hasAIConsent(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(AI_CONSENT_KEY);
    return value === 'granted';
  } catch {
    return false;
  }
}

/** Revoke AI data consent (called from settings) */
export async function revokeAIConsent(): Promise<void> {
  await AsyncStorage.removeItem(AI_CONSENT_KEY);
}

/** Grant AI data consent */
async function grantAIConsent(): Promise<void> {
  await AsyncStorage.setItem(AI_CONSENT_KEY, 'granted');
}

// ─── Component ──────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

export default function AIDataConsentModal({ visible, onConsent, onDecline }: Props) {
  const handleAgree = useCallback(async () => {
    await grantAIConsent();
    onConsent();
  }, [onConsent]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          <Pressable style={s.closeBtn} onPress={onDecline} hitSlop={12}>
            <Ionicons name="close" size={20} color="#6b8f8f" />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.mainIconBox}>
                <Ionicons name="shield-checkmark" size={28} color="#fff" />
              </View>
              <Text style={s.title}>AI Processing & Data Sharing Consent</Text>
            </View>

            <Text style={s.subtitle}>
              HealthAI uses AI to analyze information you provide and generate health summaries, explanations, insights and recommendations.{'\n\n'}
              Some AI features require selected information to be securely sent to third-party AI service providers.{'\n'}
              <Text style={s.boldGreen}>We need your explicit permission before we do that.</Text>
            </Text>

            {/* Section 1: What info */}
            <View style={s.sectionHeader}>
              <Ionicons name="cube-outline" size={18} color="#156C60" />
              <Text style={s.sectionTitle}>What information may be sent?</Text>
            </View>

            {DATA_ITEMS.map((item, i) => (
              <View key={i} style={s.dataRow}>
                <View style={s.dataIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#3E8D82" />
                </View>
                <View style={s.dataTextWrap}>
                  <Text style={s.dataTitle}>{item.title}</Text>
                  <Text style={s.dataDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}

            <View style={s.twoColWrap}>
              <View style={s.twoColBox}>
                <Text style={s.twoColTitle}>Why is it sent?</Text>
                <Text style={s.twoColBody}>To analyze, summarize, explain medical information, interpret measurements and provide requested insights and recommendations.</Text>
              </View>
              <View style={s.twoColDivider} />
              <View style={s.twoColBox}>
                <Text style={s.twoColTitle}>We use only what's necessary</Text>
                <Text style={s.twoColBody}>We <Text style={{fontWeight:'700'}}>send</Text> only the information required for the AI feature you request.</Text>
              </View>
            </View>

            {/* Section 2: Who receives */}
            <View style={[s.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="shield-half-outline" size={18} color="#156C60" />
              <Text style={s.sectionTitle}>Who receives your information?</Text>
            </View>

            <View style={s.providerRow}>
              <View style={s.providerIconWrap}>
                <Ionicons name="document-text-outline" size={18} color="#3E8D82" />
              </View>
              <View style={s.providerTextWrap}>
                <Text style={s.providerName}>HealthAI / SMARTnCODE Technologies</Text>
                <Text style={s.providerDesc}>Operates the app and coordinates the AI processing.</Text>
              </View>
            </View>

            <View style={[s.providerRow, { marginTop: 12 }]}>
              <View style={s.providerIconWrap}>
                <Ionicons name="sparkles-outline" size={18} color="#3E8D82" />
              </View>
              <View style={s.providerTextWrap}>
                <Text style={s.providerName}>Google Cloud, OpenAI, Anthropic (Multimodal)</Text>
                <Text style={s.providerDesc}>Selected information may be securely transmitted to our trusted multimodal AI providers (e.g., Google Cloud, OpenAI, Anthropic) to generate the AI response.</Text>
                <Pressable onPress={() => Linking.openURL('https://policies.google.com/privacy')} style={s.providerLink}>
                  <Text style={s.providerLinkText}>AI Provider Details</Text>
                  <Ionicons name="chevron-forward" size={12} color="#156C60" />
                </Pressable>
              </View>
            </View>

            {/* Section 3: Training */}
            <View style={s.trainingCard}>
              <View style={s.trainingHeaderRow}>
                <Ionicons name="pie-chart-outline" size={16} color="#156C60" />
                <Text style={s.trainingTitle}>AI model training</Text>
              </View>
              <Text style={s.trainingBody}>
                Your personal health information is <Text style={{fontWeight:'700', color:'#1a2e35'}}>not</Text> used to train or improve third-party general-purpose AI models.
              </Text>
            </View>

            {/* Badges */}
            <View style={s.badgeRow}>
              <View style={s.badge}>
                <Ionicons name="lock-closed" size={18} color="#156C60" />
                <Text style={s.badgeText}>Encrypted{'\n'}in transit & at rest</Text>
              </View>
              <View style={s.badge}>
                <Ionicons name="person-outline" size={18} color="#156C60" />
                <Text style={s.badgeText}>Access{'\n'}controls</Text>
              </View>
              <View style={s.badge}>
                <Ionicons name="hardware-chip-outline" size={18} color="#156C60" />
                <Text style={s.badgeText}>Secure AI{'\n'}processing</Text>
              </View>
            </View>

            {/* Withdraw Notice */}
            <View style={s.withdrawBox}>
              <Text style={s.withdrawText}>
                You can withdraw AI-processing consent anytime from{'\n'}
                <Text style={{fontWeight:'700', color:'#1a2e35'}}>Settings → Privacy → AI Processing</Text>
              </Text>
            </View>

          </ScrollView>

          <View style={s.actions}>
            <Pressable style={s.agreeBtn} onPress={handleAgree}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.agreeBtnText}>I Agree — Allow AI Processing</Text>
            </Pressable>
            <Pressable style={s.declineBtn} onPress={onDecline}>
              <Text style={s.declineBtnText}>Decline AI Processing</Text>
            </Pressable>
            <Text style={s.footerText}>You can change your choice later in Privacy Settings.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '95%', paddingBottom: 24 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingRight: 20 },
  mainIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#156C60', justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: ms(18), fontWeight: '800', color: '#112228', lineHeight: ms(24) },
  subtitle: { fontSize: ms(12.5), color: '#4A6262', lineHeight: ms(19), marginBottom: 24 },
  boldGreen: { fontWeight: '700', color: '#156C60' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: ms(14), fontWeight: '800', color: '#112228' },

  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  dataIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F7F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5EFEF' },
  dataTextWrap: { flex: 1 },
  dataTitle: { fontSize: ms(13), fontWeight: '700', color: '#112228', marginBottom: 2 },
  dataDetail: { fontSize: ms(11.5), color: '#6A8A8A' },

  twoColWrap: { flexDirection: 'row', backgroundColor: '#F2F7F6', borderRadius: 12, padding: 16, marginTop: 8 },
  twoColBox: { flex: 1, paddingHorizontal: 4 },
  twoColDivider: { width: 1, backgroundColor: '#DCEBEA', marginHorizontal: 12 },
  twoColTitle: { fontSize: ms(12), fontWeight: '700', color: '#112228', marginBottom: 6 },
  twoColBody: { fontSize: ms(11), color: '#4A6262', lineHeight: ms(16) },

  providerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  providerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F7F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5EFEF' },
  providerTextWrap: { flex: 1 },
  providerName: { fontSize: ms(13), fontWeight: '700', color: '#112228', marginBottom: 2 },
  providerDesc: { fontSize: ms(11.5), color: '#6A8A8A', lineHeight: ms(16) },
  providerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  providerLinkText: { fontSize: ms(11.5), fontWeight: '700', color: '#156C60' },

  trainingCard: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8F0F0', backgroundColor: '#fff' },
  trainingHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  trainingTitle: { fontSize: ms(13), fontWeight: '700', color: '#112228' },
  trainingBody: { fontSize: ms(12), color: '#6A8A8A', lineHeight: ms(18) },

  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  badge: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8F0F0', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  badgeText: { fontSize: ms(10), color: '#112228', fontWeight: '600', textAlign: 'center', lineHeight: ms(14) },

  withdrawBox: { marginTop: 16, backgroundColor: '#F5F8F8', borderRadius: 10, padding: 14, alignItems: 'center' },
  withdrawText: { fontSize: ms(11.5), color: '#6A8A8A', textAlign: 'center', lineHeight: ms(18) },

  actions: { paddingHorizontal: 20, paddingTop: 16 },
  agreeBtn: { backgroundColor: '#156C60', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  agreeBtnText: { color: '#fff', fontSize: ms(14), fontWeight: '700' },
  declineBtn: { paddingVertical: 14, alignItems: 'center' },
  declineBtnText: { color: '#156C60', fontSize: ms(13), fontWeight: '700' },
  footerText: { textAlign: 'center', fontSize: ms(10.5), color: '#8BA8A8', marginTop: 4 },
});
