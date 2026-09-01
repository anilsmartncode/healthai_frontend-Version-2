/**
 * app/blood-group-contacts.tsx
 *
 * Same Blood Group Contacts Screen.
 * Allows users to view (via GET), add (via POST), and manage multiple emergency/donor
 * contacts who share their blood group.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import {
  getBloodGroupContacts,
  saveBloodGroupContact,
  deleteBloodGroupContact,
  type BloodGroupContact,
} from '@/services/bloodGroupContactsApi';

export default function BloodGroupContactsScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const params = useLocalSearchParams<{ bloodGroup?: string }>();
  const userBloodGroup = params.bloodGroup || 'B+';

  const [contacts, setContacts] = useState<BloodGroupContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states for adding new contact
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // GET method to fetch existing contacts
      const data = await getBloodGroupContacts();
      setContacts(data);
    } catch (err) {
      console.warn('Failed to load blood group contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setContactName('');
    setContactPhone('');
    setContactRelationship('');
    setModalVisible(true);
  };

  const handleSaveContact = async () => {
    const trimmedName = contactName.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      Alert.alert('Validation', 'Please enter contact full name.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 6) {
      Alert.alert('Validation', 'Please enter a valid mobile number.');
      return;
    }

    setSaving(true);
    try {
      const created = await saveBloodGroupContact({
        name: trimmedName,
        phone: trimmedPhone,
        bloodGroup: userBloodGroup,
        relationship: contactRelationship.trim() || undefined,
      });

      setContacts((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      setModalVisible(false);
      Alert.alert('Success', t('contact_saved_success'));
    } catch (err) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const sanitized = phoneNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${sanitized}`);
  };

  const handleDelete = (contact: BloodGroupContact) => {
    Alert.alert(
      t('delete_contact'),
      `${t('delete_contact_confirm')} (${contact.name})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('delete_contact'),
          style: 'destructive',
          onPress: async () => {
            setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            await deleteBloodGroupContact(contact.id);
          },
        },
      ]
    );
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { textAlign }]} numberOfLines={1}>
              {t('blood_group_contacts')}
            </Text>
          </View>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeText}>{userBloodGroup}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Header Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="water" size={22} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { textAlign }]}>
              {userBloodGroup} Emergency Network
            </Text>
            <Text style={[styles.bannerSub, { textAlign }]}>
              {t('blood_group_contacts_sub')}
            </Text>
          </View>
        </View>

        {/* Add Contact CTA Button */}
        <Pressable
          style={[styles.addBtn, { flexDirection: rowDirection }]}
          onPress={handleOpenAddModal}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{t('add_blood_contact')}</Text>
        </Pressable>

        {/* Contacts List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>{t('no_blood_contacts_yet')}</Text>
            <Text style={styles.emptySub}>{t('no_blood_contacts_sub')}</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {contacts.map((c, index) => {
              const isLast = index === contacts.length - 1;
              return (
                <View
                  key={c.id}
                  style={[
                    styles.contactItem,
                    { flexDirection: rowDirection },
                    !isLast && styles.contactBorder,
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {c.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={[styles.contactName, { textAlign }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.contactPhone, { textAlign }]}>
                      {c.phone}
                    </Text>
                    {c.relationship ? (
                      <Text style={[styles.contactRel, { textAlign }]}>
                        {c.relationship}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.actionButtonsRow}>
                    <Pressable
                      style={styles.callIconBtn}
                      onPress={() => handleCall(c.phone)}
                      hitSlop={8}
                    >
                      <Ionicons name="call" size={16} color="#0F766E" />
                    </Pressable>
                    <Pressable
                      style={styles.deleteIconBtn}
                      onPress={() => handleDelete(c)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_blood_contact')}</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#6B756F" />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>{t('contact_name')}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Reddy"
              placeholderTextColor="#94A3B8"
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={styles.fieldLabel}>{t('contact_number')}</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />

            <Text style={styles.fieldLabel}>{t('relationship_optional')}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Brother, Friend, Colleague"
              placeholderTextColor="#94A3B8"
              value={contactRelationship}
              onChangeText={setContactRelationship}
            />

            <Pressable
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSaveContact}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{t('save_contact')}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  bannerSub: {
    fontSize: 12,
    color: '#6B756F',
    marginTop: 2,
    lineHeight: 16,
  },
  addBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B2A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#6B756F',
    textAlign: 'center',
    lineHeight: 18,
  },
  cardList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  contactItem: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  contactBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F766E',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  contactPhone: {
    fontSize: 12.5,
    color: '#6B756F',
    marginTop: 2,
  },
  contactRel: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  callIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E1F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B756F',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1A2B2A',
  },
  saveBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
