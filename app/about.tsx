/**
 * app/about.tsx
 *
 * About HealthAI Screen — EXACTLY matching Prototype v2 (scr-aboutapp).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/healthai/id6794323149'
    : 'https://play.google.com/store/apps/details?id=com.smartncode.healthai';

const APP_VERSION = '1.0.2';

export default function AboutScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();

  const handleRateApp = async () => {
    try {
      await Linking.openURL(STORE_URL);
    } catch {
      Alert.alert('Error', 'Could not open the App Store.');
    }
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
          <Text style={[styles.title, { textAlign }]}>{t('about_app')}</Text>
        </View>
      </View>

      {/* Content — Exact Prototype v2 Card */}
      <View style={styles.content}>
        <View style={styles.card}>
          {/* 1. App Version */}
          <View style={[styles.listItem, { flexDirection: rowDirection }]}>
            <Text style={[styles.itemText, { textAlign }]}>{t('app_version')}</Text>
            <Text style={styles.itemValue}>{APP_VERSION}</Text>
          </View>

          {/* 2. Terms of Service */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/terms' as any)}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('terms_of_service')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 3. Privacy Policy */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={() => router.push('/privacy' as any)}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('privacy_policy')}</Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </Pressable>

          {/* 4. Rate the App */}
          <Pressable
            style={({ pressed }) => [
              styles.listItem,
              styles.lastItem,
              { flexDirection: rowDirection },
              pressed && { backgroundColor: '#F8FAFC' },
            ]}
            onPress={handleRateApp}
          >
            <Text style={[styles.itemText, { textAlign }]}>{t('rate_app')}</Text>
            <Text style={styles.stars}>★★★★★</Text>
          </Pressable>
        </View>
      </View>
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
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemText: {
    fontSize: 14.5,
    color: '#1A2B2A',
    fontWeight: '500',
    flex: 1,
  },
  itemValue: {
    fontSize: 13.5,
    color: '#6B756F',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '400',
    lineHeight: 20,
  },
  stars: {
    fontSize: 14,
    color: '#BA7517',
    letterSpacing: 2,
  },
});
