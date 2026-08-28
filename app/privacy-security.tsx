/**
 * app/privacy-security.tsx
 *
 * Privacy and Security Screen — Matching Prototype v2 (scr-privacysecurity).
 * Central security hub connecting Consent Center, Data Export, App Lock,
 * Privacy Policy, and Account Deletion.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useAuth } from '@/context/AuthContext';
import { medicineApiCall } from '@/services/Medicineapiclient';
import { ENDPOINTS } from '@/constants/api';

export default function PrivacySecurityScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { signOut } = useAuth();

  const handleDownloadData = () => {
    Alert.alert(
      t('download_data'),
      'Export a structured copy of your health records, biomarker trends, and timelines. We will generate your secure download archive within 24 hours.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Request Archive',
          onPress: () => {
            Alert.alert('Archive Requested', 'A secure download link will be prepared and sent to your registered contact.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account'),
      t('delete_account_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete_btn'),
          style: 'destructive',
          onPress: async () => {
            try {
              await medicineApiCall(ENDPOINTS.deleteAccount, { method: 'DELETE' });
              Alert.alert(t('account_deleted'), t('account_deleted_sub'), [
                {
                  text: 'OK',
                  onPress: () => {
                    signOut().then(() => router.replace('/(auth)/onboarding'));
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete account. Please contact support.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
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
          <Text style={[styles.title, { textAlign }]}>{t('privacy_security')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main List Card matching Prototype v2 */}
        <View style={styles.card}>
          {/* 1. Consent Center */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/consent-center')}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('consent_center')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 2. Download My Data */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/data-export')}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('download_data')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 3. App Lock & Biometrics */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/app-lock')}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('app_lock')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 4. Privacy Policy */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/privacy')}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('privacy_policy')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 5. Delete My Account */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              styles.lastItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.itemText, { color: Colors.danger, textAlign }]}>
              {t('delete_account')}
            </Text>
            <Text style={[styles.chevron, { color: Colors.danger }]}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>
        </View>

        {/* Disclaimer Banner matching Prototype v2 */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="shield-checkmark" size={18} color="#0F766E" style={{ marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            {t('privacy_disclaimer')}
          </Text>
        </View>
      </ScrollView>
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
    borderWidth: 1,
    borderColor: '#E4E8E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  listItem: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 14,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#065F46',
    lineHeight: 18,
  },
});
