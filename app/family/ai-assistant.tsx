/**
 * app/family/ai-assistant.tsx — S11: Family AI Assistant
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FamilyTopBar }      from '@/components/family/FamilyTopBar';
import { FamilyAIAssistant } from '@/components/family/FamilyAIAssistant';

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar title="Family AI Assistant" onBack={() => router.back()} />
      <FamilyAIAssistant />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#F4F7F6' } });
