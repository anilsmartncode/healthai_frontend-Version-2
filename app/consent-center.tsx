/**
 * app/consent-center.tsx
 *
 * Consent Center Screen — Matching Prototype v2 (scr-consentcenter).
 * Provides granular control over AI analysis, family data sharing,
 * doctor data sharing, and anonymized research.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { getConsents, updateConsents, UserConsents } from '@/services/consentApi';

export default function ConsentCenterScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<UserConsents>({
    ai_analysis: true,
    share_family: true,
    share_doctors: true,
    anonymized_research: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getConsents();
        setConsents(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (key: keyof UserConsents, value: boolean) => {
    const updated = { ...consents, [key]: value };
    setConsents(updated);
    await updateConsents({ [key]: value });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.title, { textAlign }]}>{t('consent_center')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sub, { textAlign }]}>{t('consent_sub')}</Text>

        {/* Card 1: AI Analysis */}
        <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>{t('ai_analysis_consent')}</Text>
            <Text style={[styles.cardSub, { textAlign }]}>{t('ai_analysis_sub')}</Text>
          </View>
          <Switch
            value={consents.ai_analysis}
            onValueChange={(val) => handleToggle('ai_analysis', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Card 2: Family Data Sharing */}
        <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>{t('share_family_consent')}</Text>
            <Text style={[styles.cardSub, { textAlign }]}>{t('share_family_sub')}</Text>
          </View>
          <Switch
            value={consents.share_family}
            onValueChange={(val) => handleToggle('share_family', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Card 3: Doctor Data Sharing */}
        <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>{t('share_doctors_consent')}</Text>
            <Text style={[styles.cardSub, { textAlign }]}>{t('share_doctors_sub')}</Text>
          </View>
          <Switch
            value={consents.share_doctors}
            onValueChange={(val) => handleToggle('share_doctors', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Card 4: Anonymized Research */}
        <View style={[styles.card, styles.row, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>{t('research_consent')}</Text>
            <Text style={[styles.cardSub, { textAlign }]}>{t('research_sub')}</Text>
          </View>
          <Switch
            value={consents.anonymized_research}
            onValueChange={(val) => handleToggle('anonymized_research', val)}
            trackColor={{ false: '#E2E8F0', true: Colors.primary }}
            thumbColor="#FFFFFF"
          />
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
    gap: 12,
  },
  sub: {
    fontSize: 13,
    color: '#6B756F',
    marginBottom: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  cardSub: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 2,
  },
});
