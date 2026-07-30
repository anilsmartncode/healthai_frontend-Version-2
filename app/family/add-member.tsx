/**
 * app/family/add-member.tsx — Add Family Member
 * Step 1 Basic Info → Step 2 Permissions (invite options) → share-invite
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { AddMemberForm } from '@/components/family/AddMemberForm';
import type { AddMemberFormData } from '@/components/family/AddMemberForm';

export default function AddMemberScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    router.back();
  };

  const handleInvite = (data: AddMemberFormData) => {
    router.push({ pathname: '/family/share-invite', params: data as any });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Add Family Member" onBack={handleBack} />
      <AddMemberForm
        step={step}
        onStepChange={setStep}
        onInvite={handleInvite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
});
