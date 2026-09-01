/**
 * app/(auth)/first-run-consent.tsx
 *
 * Before You Continue Screen — EXACTLY matching Prototype v2 (scr-firstrunconsent).
 * Shows initial patient privacy choices required under health data protection laws.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { updateConsents } from '@/services/consentApi';

export default function FirstRunConsentScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();

  const [researchConsent, setResearchConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAgreeAndContinue = async () => {
    setSaving(true);
    try {
      await updateConsents({
        process_health_data: true,
        ai_analysis: true,
        anonymized_research: researchConsent,
        marketing_tips: marketingConsent,
      });
    } catch (e) {
      console.warn('[FirstRunConsent] Error saving consents:', e);
    } finally {
      setSaving(false);
      // Navigates to Sign up / Login per Prototype v2 flow
      router.push('/(auth)/signup');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar matching Prototype v2 */}
      <View style={styles.topbar}>
        <Text style={[styles.title, { textAlign }]}>
          {t('first_run_consent_title')}
        </Text>
        <Text style={[styles.sub, { textAlign }]}>
          {t('first_run_consent_sub')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Process my health data (Required) */}
        <View style={[styles.card, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>
              {t('process_health_data')}
            </Text>
            <Text style={[styles.cardSub, { textAlign }]}>
              {t('process_health_data_sub')}
            </Text>
          </View>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>{t('required_badge')}</Text>
          </View>
        </View>

        {/* Card 2: AI analysis of uploaded reports (Required) */}
        <View style={[styles.card, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>
              {t('ai_analysis_consent')}
            </Text>
            <Text style={[styles.cardSub, { textAlign }]}>
              {t('ai_analysis_sub')}
            </Text>
          </View>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>{t('required_badge')}</Text>
          </View>
        </View>

        {/* Card 3: Anonymized research (Optional Toggle) */}
        <View style={[styles.card, { flexDirection: rowDirection }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>
              {t('research_consent')}
            </Text>
            <Text style={[styles.cardSub, { textAlign }]}>
              {t('research_sub')}
            </Text>
          </View>
          <Switch
            value={researchConsent}
            onValueChange={setResearchConsent}
            trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Card 4: Marketing and product tips (Optional Toggle) */}
        <View style={[styles.card, { flexDirection: rowDirection, marginBottom: 14 }]}>
          <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
            <Text style={[styles.cardTitle, { textAlign }]}>
              {t('marketing_tips')}
            </Text>
            <Text style={[styles.cardSub, { textAlign }]}>
              {t('marketing_tips_sub')}
            </Text>
          </View>
          <Switch
            value={marketingConsent}
            onValueChange={setMarketingConsent}
            trackColor={{ false: '#E2E8F0', true: '#0F766E' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Disclaimer Callout matching Prototype v2 */}
        <View style={styles.disclaimerBox}>
          <Text style={[styles.disclaimerText, { textAlign }]}>
            {t('first_run_disclaimer')}
          </Text>
        </View>

        {/* Primary CTA Button */}
        <Pressable
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleAgreeAndContinue}
          disabled={saving}
        >
          <Text style={styles.btnText}>{t('agree_and_continue')}</Text>
        </Pressable>

        {/* Footer Terms & Privacy links */}
        <View style={[styles.hintRow, { flexDirection: rowDirection }]}>
          <Text style={styles.hintText}>{t('by_continuing_agree')} </Text>
          <Pressable onPress={() => router.push('/terms')}>
            <Text style={styles.linkText}>{t('terms_link')}</Text>
          </Pressable>
          <Text style={styles.hintText}> {t('and')} </Text>
          <Pressable onPress={() => router.push('/privacy')}>
            <Text style={styles.linkText}>{t('privacy_link')}</Text>
          </Pressable>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
    lineHeight: 26,
  },
  sub: {
    fontSize: 12.5,
    color: '#6B756F',
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  cardSub: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 3,
    lineHeight: 16,
  },
  badgeNeutral: {
    backgroundColor: '#F4F6F5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  badgeNeutralText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B756F',
  },
  disclaimerBox: {
    backgroundColor: '#EAF0EE',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11.5,
    color: '#4B5550',
    lineHeight: 17,
  },
  btn: {
    backgroundColor: '#0F6E56',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hintRow: {
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  hintText: {
    fontSize: 11.5,
    color: '#6B756F',
  },
  linkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F6E56',
  },
});
