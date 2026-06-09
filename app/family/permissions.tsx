/**
 * app/family/permissions.tsx — S5: Set Permissions
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar }        from '@/components/family/FamilyTopBar';
import { PermissionsEditor }   from '@/components/family/PermissionsEditor';
import { DEFAULT_PERMISSIONS } from '@/services/familyMockData';
import { updateMemberPermissions } from '@/services/familyApi';
import type { MemberPermissions } from '@/services/familyApi';

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const { member_id = 'mem2', name = 'Member' } = useLocalSearchParams<{ member_id?: string; name?: string }>();
  const [perms,  setPerms]  = useState<MemberPermissions>({ ...DEFAULT_PERMISSIONS });
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof MemberPermissions, value: boolean) =>
    setPerms((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMemberPermissions(member_id, perms);
      Alert.alert('Saved', 'Permissions updated successfully.');
      router.push('/family');
    } catch {
      Alert.alert('Error', 'Could not save permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Set Permissions" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.sub}>Choose what {name} can access</Text>
        <PermissionsEditor permissions={perms} onChange={handleChange} />
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveTxt}>Save Permissions</Text>
          }
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#F4F7F6' },
  page:    { padding: 16, paddingBottom: 40 },
  sub:     { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
