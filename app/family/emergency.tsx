/**
 * app/family/emergency.tsx — Emergency Details sub-screen
 * Screens: Emergency main → Add Contact | Edit Medical Info
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable,
  TextInput, Alert, Modal, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import {
  getMemberEmergency,
  addEmergencyContact,
  deleteEmergencyContact,
  updateMedicalInfo,
  type EmergencyContact,
  type MedicalInfo,
  type EmergencyDetailsResponse,
  type ContactRelationship,
} from '@/services/profileSubScreenApi';

// ── Constants ─────────────────────────────────────────────────────────

const RELATIONSHIP_OPTS: ContactRelationship[] = [
  'Son / Daughter', 'Spouse', 'Parent', 'Sibling', 'Doctor', 'Neighbour', 'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

type ActiveView = 'main' | 'add-contact' | 'edit-medical';

// ── Screen ────────────────────────────────────────────────────────────

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();

  const [data,        setData]        = useState<EmergencyDetailsResponse | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeView,  setActiveView]  = useState<ActiveView>('main');
  const [successMsg,  setSuccessMsg]  = useState('');

  useEffect(() => {
    getMemberEmergency(id)
      .then(setData)
      .catch((e) => {
        console.warn("Failed to load emergency details, using fallback:", e);
        setData({
          member_id: id,
          medical_info: {
            blood_group: 'Unknown',
            weight_kg: 0,
            height_cm: 0,
            allergies: [],
            conditions: [],
            emergency_notes: ''
          },
          emergency_contacts: []
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={{ marginTop: 16, color: Colors.textMuted }}>Could not load emergency data.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {activeView === 'main' && (
        <MainView
          data={data} setData={setData}
          memberId={id}
          onAddContact={() => setActiveView('add-contact')}
          onEditMedical={() => setActiveView('edit-medical')}
          onBack={() => router.back()}
          successMsg={successMsg}
          showSuccess={showSuccess}
        />
      )}
      {activeView === 'add-contact' && (
        <AddContactView
          memberId={id}
          onBack={() => setActiveView('main')}
          onSaved={(contact) => {
            setData((prev) => prev ? { ...prev, emergency_contacts: [...prev.emergency_contacts, contact] } : prev);
            setActiveView('main');
            showSuccess('Emergency contact saved');
          }}
        />
      )}

    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ════════════════════════════════════════════════════════════════════════

function MainView({
  data, setData, memberId,
  onAddContact, onEditMedical, onBack,
  successMsg, showSuccess,
}: {
  data: EmergencyDetailsResponse;
  setData: React.Dispatch<React.SetStateAction<EmergencyDetailsResponse | null>>;
  memberId: string;
  onAddContact: () => void;
  onBack: () => void;
  successMsg: string;
  showSuccess: (msg: string) => void;
}) {
  const { medical_info: mi, emergency_contacts: contacts } = data;

  const handleDelete = (c: EmergencyContact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${c.name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await deleteEmergencyContact(memberId, c.contact_id);
            setData((prev) => prev
              ? { ...prev, emergency_contacts: prev.emergency_contacts.filter((x) => x.contact_id !== c.contact_id) }
              : prev);
            showSuccess('Contact removed');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FamilyTopBar
        title="Emergency / SOS"
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* ── Success toast ─────────────────────────── */}
        {!!successMsg && (
          <View style={styles.successToast}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#065F46" />
            <Text style={styles.successTxt}>{successMsg}</Text>
          </View>
        )}

        {/* ── Top SOS Card ─────────────────────────── */}
        <View style={styles.topSosCard}>
          <Text style={styles.topSosTxt}>Emergency help is one tap away</Text>
          <Pressable
            style={styles.topSosBtn}
            onPress={() => Alert.alert('SOS', 'Call emergency services?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Call 108', onPress: () => Linking.openURL('tel:108') },
            ])}
          >
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.topSosBtnTxt}>Call emergency — 108</Text>
          </Pressable>
        </View>

        {/* ── Add Contact Button ───────────────────── */}
        <Pressable style={styles.outlineAddBtn} onPress={onAddContact}>
          <Text style={styles.outlineAddTxt}>Add emergency contact</Text>
        </Pressable>

        {/* ── Contacts section ─────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Emergency contacts</Text>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Ionicons name="people-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyContactsTxt}>No emergency contacts added yet</Text>
          </View>
        ) : (
          contacts.map((c) => (
          <View key={c.contact_id} style={styles.contactRow}>
            <View style={styles.contactAvatar}>
              <Ionicons name={c.relationship === 'Doctor' ? 'medkit-outline' : 'person-outline'} size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactSub}>
                {c.phone} · {c.is_primary ? 'Primary' : c.relationship}
              </Text>
            </View>
            <View style={styles.contactActions}>
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${c.phone.replace(/\s/g, '')}`)}
              >
                <Ionicons name="call-outline" size={15} color={Colors.primary} />
              </Pressable>
              <Pressable style={styles.delBtn} onPress={() => handleDelete(c)}>
                <Ionicons name="trash-outline" size={15} color={Colors.danger} />
              </Pressable>
            </View>
          </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADD CONTACT VIEW
// ════════════════════════════════════════════════════════════════════════

function AddContactView({
  memberId, onBack, onSaved,
}: {
  memberId: string;
  onBack: () => void;
  onSaved: (c: EmergencyContact) => void;
}) {
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [rel,       setRel]       = useState<ContactRelationship>('Son / Daughter');
  const [note,      setNote]      = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleSave = async () => {
    if (!name.trim())  { Alert.alert('Required', 'Please enter a name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter a phone number'); return; }
    setSaving(true);
    try {
      const res = await addEmergencyContact(memberId, {
        name: name.trim(), phone: `+91 ${phone.trim()}`,
        relationship: rel, note: note.trim(), is_primary: isPrimary,
      });
      onSaved({
        contact_id: res.contact_id,
        name: name.trim(), phone: `+91 ${phone.trim()}`,
        relationship: rel, note: note.trim(), is_primary: isPrimary,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FamilyTopBar title="Add Emergency Contact" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={styles.fl}>Full name</Text>
        <TextInput style={styles.inp} placeholder="e.g. Ravi Kumar" value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} />

        <Text style={styles.fl}>Phone number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}><Text style={styles.countryTxt}>+91</Text></View>
          <TextInput style={[styles.inp, { flex: 1 }]} placeholder="Enter mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={Colors.textMuted} />
        </View>

        <Text style={styles.fl}>Relationship</Text>
        <View style={styles.relWrap}>
          {RELATIONSHIP_OPTS.map((r) => (
            <Pressable
              key={r}
              style={[styles.relChip, rel === r && styles.relChipOn]}
              onPress={() => setRel(r)}
            >
              <Text style={[styles.relTxt, rel === r && styles.relTxtOn]}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fl}>Note (optional)</Text>
        <TextInput style={styles.inp} placeholder="e.g. Available after 6 PM" value={note} onChangeText={setNote} placeholderTextColor={Colors.textMuted} />

        {/* Primary toggle */}
        <Pressable style={styles.primaryRow} onPress={() => setIsPrimary((p) => !p)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryLbl}>Set as primary contact</Text>
            <Text style={styles.primarySub}>Called first in emergencies</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: isPrimary ? Colors.primary : Colors.border }]}>
            <View style={[styles.toggleKnob, { left: isPrimary ? 18 : 2 }]} />
          </View>
        </Pressable>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
          <Text style={styles.disclaimerTxt}>This contact will only be visible to authorised family members and caregivers.</Text>
        </View>

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveTxt}>Save Contact</Text>}
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelTxt}>Cancel</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}



// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  page:     { padding: 12, paddingBottom: 40 },

  // Success toast
  successToast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F5F0', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 10, padding: 10, marginBottom: 10 },
  successTxt:   { fontSize: 12, color: '#065F46', fontWeight: '500', flex: 1 },

  // Medical card
  sosCard:     { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 13, marginBottom: 10 },
  sosHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sosHeaderLeft:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  sosTitle:    { fontSize: 13, fontWeight: '700', color: '#7F1D1D' },
  editLink:    { fontSize: 11, color: Colors.danger, fontWeight: '600' },
  medGrid:     { flexDirection: 'row', gap: 16, marginBottom: 10 },
  medGridLbl:  { fontSize: 10, color: '#991B1B' },
  medGridVal:  { fontSize: 18, fontWeight: '700', color: '#7F1D1D' },
  medSubLbl:   { fontSize: 10, color: '#991B1B', marginBottom: 4 },
  chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  allergyChip: { backgroundColor: '#FFE8E8', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  allergyTxt:  { fontSize: 11, fontWeight: '500', color: '#991B1B' },
  condChip:    { backgroundColor: '#FEF9E8', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  condTxt:     { fontSize: 11, fontWeight: '500', color: '#92400E' },
  notesBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 8 },
  notesTxt:    { fontSize: 11, color: '#991B1B', flex: 1, lineHeight: 16 },

  // Section row
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  section:    { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnTxt:  { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Contact row
  emptyContacts:  { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyContactsTxt:{ fontSize: 13, color: Colors.textMuted, marginTop: 8, fontWeight: '500' },
  contactRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 7, gap: 10 },
  contactAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  contactName:    { fontSize: 13, fontWeight: '600', color: Colors.text },
  contactSub:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  contactActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  callBtn:        { width: 30, height: 30, borderRadius: 8, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center' },
  delBtn:         { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFE8E8', justifyContent: 'center', alignItems: 'center' },

  // Top SOS card
  topSosCard:  { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 14, marginBottom: 16 },
  topSosTxt:   { color: '#991B1B', fontSize: 13, fontWeight: '600', marginBottom: 12 },
  topSosBtn:   { backgroundColor: '#B91C1C', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  topSosBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },

  // Green Outline Add Button
  outlineAddBtn: { borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  outlineAddTxt: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  // Form
  fl:         { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: 14 },
  inp:        { backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: Colors.border, padding: 11, fontSize: 13, color: Colors.text },
  phoneRow:   { flexDirection: 'row', gap: 7 },
  countryCode:{ backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: Colors.border, padding: 11, justifyContent: 'center' },
  countryTxt: { fontSize: 13, fontWeight: '500', color: Colors.text },
  relWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  relChip:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 0.5, borderColor: Colors.border },
  relChipOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relTxt:     { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  relTxtOn:   { color: '#fff', fontWeight: '600' },

  // Primary toggle
  primaryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 12 },
  primaryLbl: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  primarySub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  toggle:     { width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0 },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', position: 'absolute', top: 2 },

  // Disclaimer
  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, marginTop: 12 },
  disclaimerTxt: { fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },

  // Buttons
  saveBtn:   { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20 },
  saveTxt:   { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 },
  cancelTxt: { fontSize: 14, fontWeight: '500', color: Colors.text },

  // Two column
  twoCol:  { flexDirection: 'row', gap: 10 },

  // Tag chips (edit medical)
  tagWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  tagChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFE8E8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagAllergyTxt:{ fontSize: 12, fontWeight: '500', color: '#991B1B' },
  tagCondChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF9E8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagCondTxt:   { fontSize: 12, fontWeight: '500', color: '#92400E' },
  tagX:         { fontSize: 16, lineHeight: 18, color: Colors.textMuted },

  // Inline add row
  inpAddRow:   { flexDirection: 'row', gap: 7 },
  inpAddBtn:   { backgroundColor: '#E8F5F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, justifyContent: 'center' },
  inpAddTxt:   { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
