/**
 * app/family/add-member.tsx — S2: Add Family Member
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyTopBar }    from '@/components/family/FamilyTopBar';
import { AddMemberForm }   from '@/components/family/AddMemberForm';
import type { AddMemberFormData } from '@/components/family/AddMemberForm';

export default function AddMemberScreen() {
  const insets = useSafeAreaInsets();

  const handleContinue = (data: AddMemberFormData) => {
    router.push({ pathname: '/family/invite-options', params: data as any });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Add Family Member" onBack={() => router.back()} />
      <AddMemberForm onContinue={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F4F7F6' } });
