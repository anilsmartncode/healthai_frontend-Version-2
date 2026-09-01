import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import { updateDoctor, getDoctorById } from '@/services/doctorsApi';
import { Button } from '@/components/ui/Button';

export default function EditDoctorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [showToFamily, setShowToFamily] = useState(true);
  const [isMine, setIsMine] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoctorById(id).then(doc => {
      if (doc) {
        setName(doc.name);
        setSpecialty(doc.specialty || '');
        setPhone(doc.phone || '');
        setEmail(doc.email || '');
        setClinicName(doc.clinic_name || '');
        setAddress(doc.address || '');
        setNotes(doc.notes || '');
        setShowToFamily(doc.show_to_family ?? true);
        setIsMine(doc.is_mine ?? true);
      } else {
        Alert.alert('Error', 'Doctor not found.', [{ text: 'OK', onPress: () => router.back() }]);
      }
      setLoading(false);
    }).catch(() => {
      Alert.alert('Error', 'Could not load doctor details.');
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || !specialty.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please fill out the name, specialty, and phone number.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateDoctor(id, {
        name: name.trim(),
        specialty: specialty.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        clinic_name: clinicName.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        show_to_family: showToFamily,
      });

      if (res.success) {
        Alert.alert('Success', 'Doctor updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Could not update doctor.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboard} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Family Doctor</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
          {!isMine && (
            <View style={styles.sharedBanner}>
              <Ionicons name="information-circle" size={20} color="#1D4ED8" />
              <Text style={styles.sharedBannerText}>Shared by family. You cannot edit this doctor.</Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Doctor's Name *</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. Dr. Sarah Jenkins"
              value={name}
              onChangeText={setName}
              editable={isMine}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Specialty *</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. Pediatrician, General Physician"
              value={specialty}
              onChangeText={setSpecialty}
              editable={isMine}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. +1 234 567 8900"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              editable={isMine}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address (Optional)</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. sarah.j@clinic.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={isMine}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Clinic Name (Optional)</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. City Hospital"
              value={clinicName}
              onChangeText={setClinicName}
              editable={isMine}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <TextInput
              style={[styles.input, !isMine && styles.inputDisabled]}
              placeholder="e.g. 123 Main St"
              value={address}
              onChangeText={setAddress}
              editable={isMine}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }, !isMine && styles.inputDisabled]}
              placeholder="e.g. Available on weekdays"
              multiline
              value={notes}
              onChangeText={setNotes}
              editable={isMine}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Share with Family</Text>
              <Text style={styles.switchDesc}>Allow family members to see this doctor</Text>
            </View>
            <Switch
              value={showToFamily}
              onValueChange={setShowToFamily}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
              disabled={!isMine}
            />
          </View>
        </ScrollView>

        {isMine && (
          <View style={styles.footer}>
            <Button 
              title={saving ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollPad: {
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#64748B',
  },
  sharedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 4,
  },
  sharedBannerText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  switchDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  }
});
