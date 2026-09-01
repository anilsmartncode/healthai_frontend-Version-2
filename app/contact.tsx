/**
 * app/contact.tsx
 *
 * Contact Support Screen — matching Prototype v2 (scr-contactsupport).
 * (Excludes live chat and helpline options per user instructions).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import {
  getSupportTickets,
  submitSupportTicket,
  type SupportTicket,
} from '@/services/supportApi';

const CATEGORIES = [
  { key: 'General', labelKey: 'category_general' },
  { key: 'Billing', labelKey: 'category_billing' },
  { key: 'Reports', labelKey: 'category_reports' },
  { key: 'Bug', labelKey: 'category_bug' },
];

export default function ContactSupportScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();

  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await getSupportTickets();
      setTickets(data);
    } catch (err) {
      console.warn('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handlePickAttachment = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow photo library access to attach a screenshot.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setAttachmentUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUri(null);
  };

  const handleSubmitTicket = async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      Alert.alert(
        t('describe_issue'),
        t('describe_issue_placeholder'),
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitSupportTicket({
        subject: `${category} Issue`,
        category,
        description: trimmed,
        attachmentUri,
      });

      // Update state
      setTickets((prev) => [created, ...prev.filter((tk) => tk.id !== created.id)]);
      setDescription('');
      setAttachmentUri(null);

      Alert.alert(
        'Success',
        `Ticket #${created.ticketNumber} created — we'll reply within 24 hours.`,
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailUs = () => {
    Linking.openURL('mailto:support@smartncode.com?subject=HealthAI%20Support%20Request');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return { bg: '#EAF3DE', color: '#3B6D11', label: 'Resolved' };
      case 'IN_PROGRESS':
        return { bg: '#FAEEDA', color: '#BA7517', label: 'In Progress' };
      case 'CLOSED':
        return { bg: '#F4F6F5', color: '#6B756F', label: 'Closed' };
      default:
        return { bg: '#E1F5EE', color: '#085041', label: 'Open' };
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar matching Prototype v2 */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={18}
              color={Colors.text}
            />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>
            {t('contact_support_title')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Direct Contact Tile (Email us — no livechat or helpline per user instructions) */}
          <Pressable
            style={[styles.tile, { flexDirection: rowDirection }]}
            onPress={handleEmailUs}
          >
            <View style={styles.tileIconWrap}>
              <Ionicons name="mail-outline" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tileTitle, { textAlign }]}>
                {t('email_us')}
              </Text>
              <Text style={[styles.tileSub, { textAlign }]}>
                {t('email_us_sub')}
              </Text>
            </View>
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>

          {/* Issue Category Selector */}
          <Text style={[styles.fieldLabel, { textAlign }]}>
            {t('ticket_category')}
          </Text>
          <View style={[styles.categoryRow, { flexDirection: rowDirection }]}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.chip,
                    isSelected && styles.chipActive,
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {t(cat.labelKey as any)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Describe your issue */}
          <Text style={[styles.fieldLabel, { textAlign }]}>
            {t('describe_issue')}
          </Text>
          <TextInput
            style={[styles.textarea, { textAlign }]}
            placeholder={t('describe_issue_placeholder')}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          {/* Attach Screenshot (optional) */}
          <Text style={[styles.fieldLabel, { textAlign }]}>
            {t('attach_screenshot')}
          </Text>
          {attachmentUri ? (
            <View style={[styles.attachmentPreviewCard, { flexDirection: rowDirection }]}>
              <Image source={{ uri: attachmentUri }} style={styles.previewThumb} />
              <View style={{ flex: 1, paddingHorizontal: 10 }}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Screenshot attached
                </Text>
                <Text style={styles.attachmentSub}>Ready to submit</Text>
              </View>
              <Pressable
                style={styles.removeAttachBtn}
                onPress={handleRemoveAttachment}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={22} color="#DC2626" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.attachmentTile, { flexDirection: rowDirection }]}
              onPress={handlePickAttachment}
            >
              <Ionicons name="attach-outline" size={20} color={Colors.primary} />
              <Text style={styles.attachmentText}>
                {t('add_attachment')}
              </Text>
            </Pressable>
          )}

          {/* Submit Ticket Button */}
          <Pressable
            style={[styles.btn, submitting && styles.btnDisabled]}
            onPress={handleSubmitTicket}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>{t('submit_ticket')}</Text>
            )}
          </Pressable>

          {/* Recent Tickets Section (Only shown if tickets exist) */}
          {tickets.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { textAlign }]}>
                {t('recent_tickets')}
              </Text>
              <View style={styles.card}>
                {tickets.map((tk, idx) => {
                  const badge = getStatusBadge(tk.status);
                  const isLast = idx === tickets.length - 1;
                  return (
                    <View
                      key={tk.id || tk.ticketNumber || idx}
                      style={[
                        styles.ticketRow,
                        { flexDirection: rowDirection },
                        !isLast && styles.ticketRowBorder,
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.ticketSubject, { textAlign }]}>
                          {tk.subject}
                        </Text>
                        <Text style={[styles.ticketMeta, { textAlign }]}>
                          #{tk.ticketNumber} · {new Date(tk.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  topbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  backrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconbtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  tileSub: {
    fontSize: 12.5,
    color: '#6B756F',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B756F',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E8E6',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#E1F5EE',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B756F',
  },
  chipTextActive: {
    color: '#085041',
    fontWeight: '700',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E8E6',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1A2B2A',
    minHeight: 110,
    marginBottom: 16,
  },
  attachmentTile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E8E6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  attachmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F766E',
  },
  attachmentPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#E4E8E6',
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  attachmentSub: {
    fontSize: 11,
    color: '#16A34A',
    marginTop: 2,
  },
  removeAttachBtn: {
    padding: 4,
  },
  btn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2B2A',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  ticketRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  ticketSubject: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  ticketMeta: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 3,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#6B756F',
    textAlign: 'center',
    paddingVertical: 18,
  },
});
