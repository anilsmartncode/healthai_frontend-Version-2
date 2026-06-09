/**
 * AddMemberForm.tsx — S2: Add Family Member form
 * Mirrors s-addmember screen: relationship grid, name, phone, DOB.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const RELATIONSHIPS = ['Father','Mother','Husband','Wife','Son','Daughter','Brother','Sister','Other'];

export interface AddMemberFormData {
  relationship: string; full_name: string; phone: string; date_of_birth: string;
}

interface Props { onContinue: (data: AddMemberFormData) => void }

export function AddMemberForm({ onContinue }: Props) {
  const [rel,   setRel]   = useState('Mother');
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [dob,   setDob]   = useState('');

  const canContinue = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">

      {/* Relationship grid */}
      <Text style={styles.fieldLabel}>Relationship</Text>
      <View style={styles.relGrid}>
        {RELATIONSHIPS.map((r) => (
          <Pressable key={r} style={styles.relChip} onPress={() => setRel(r)}>
            <View style={[styles.relIcon, r === rel && styles.relIconSel]}>
              <Ionicons name="person-outline" size={18} color={r === rel ? '#fff' : Colors.textMuted} />
            </View>
            <Text style={[styles.relName, r === rel && styles.relNameSel]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      {/* Full name */}
      <Text style={styles.fieldLabel}>Full Name</Text>
      <TextInput style={styles.inp} placeholder="Enter full name"
        placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />

      {/* Phone */}
      <Text style={styles.fieldLabel}>Mobile Number</Text>
      <View style={styles.phoneRow}>
        <View style={styles.countryCode}><Text style={styles.countryTxt}>+91</Text></View>
        <TextInput style={[styles.inp, { flex: 1 }]} placeholder="Enter mobile number"
          placeholderTextColor={Colors.textMuted} keyboardType="phone-pad"
          value={phone} onChangeText={setPhone} />
      </View>

      {/* DOB */}
      <Text style={styles.fieldLabel}>Date of Birth</Text>
      <View style={styles.dobRow}>
        <TextInput style={[styles.inp, { flex: 1, borderWidth: 0 }]} placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textMuted} value={dob} onChangeText={setDob} />
        <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} style={{ paddingRight: 12 }} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, !canContinue && styles.btnDisabled, pressed && { opacity: 0.85 }]}
        onPress={() => canContinue && onContinue({ relationship: rel, full_name: name, phone, date_of_birth: dob })}
      >
        <Text style={styles.btnTxt}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page:        { padding: 16 },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginTop: 14, marginBottom: 7 },
  relGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  relChip:     { width: '22%', alignItems: 'center', paddingVertical: 6 },
  relIcon:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  relIconSel:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  relName:     { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  relNameSel:  { color: Colors.primary, fontWeight: '700' },
  inp:         { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 11, fontSize: 14, color: Colors.text },
  phoneRow:    { flexDirection: 'row', gap: 7 },
  countryCode: { backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 11, justifyContent: 'center' },
  countryTxt:  { fontSize: 14, fontWeight: '600', color: Colors.text },
  dobRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  btn:         { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.5 },
  btnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
