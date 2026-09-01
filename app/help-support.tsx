/**
 * app/help-support.tsx
 *
 * Help and Support Screen — EXACTLY matching Prototype v2 (scr-helpsupport).
 * Includes:
 *   • Prototype v2 Topbar with circular back button and title
 *   • Prominent "💬 Contact support" button (navigates to /contact)
 *   • "Frequently asked questions" accordion matching Prototype v2
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  qKey: 'faq_q1' | 'faq_q2' | 'faq_q3' | 'faq_q4';
  aKey: 'faq_a1' | 'faq_a2' | 'faq_a3' | 'faq_a4';
}

const FAQS: FAQItem[] = [
  { id: '1', qKey: 'faq_q1', aKey: 'faq_a1' },
  { id: '2', qKey: 'faq_q2', aKey: 'faq_a2' },
  { id: '3', qKey: 'faq_q3', aKey: 'faq_a3' },
  { id: '4', qKey: 'faq_q4', aKey: 'faq_a4' },
];

export default function HelpSupport() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar matching Prototype v2 */}
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
          <Text style={[styles.title, { textAlign }]}>{t('help_support')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Prototype v2 prominent Contact Support CTA */}
        <Pressable
          style={[styles.btn, { flexDirection: rowDirection }]}
          onPress={() => router.push('/contact')}
        >
          <Text style={styles.btnIcon}>💬</Text>
          <Text style={styles.btnText}>{t('contact_support_title')}</Text>
        </Pressable>

        {/* Frequently asked questions header */}
        <Text style={[styles.sectionTitle, { textAlign }]}>{t('faq_title')}</Text>

        {/* Exact Prototype v2 Card with Accordions */}
        <View style={styles.card}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const isLast = idx === FAQS.length - 1;
            return (
              <View
                key={faq.id}
                style={[
                  styles.accordionWrapper,
                  !isLast && styles.itemBorder,
                ]}
              >
                <Pressable
                  style={[styles.accordionHead, { flexDirection: rowDirection }]}
                  onPress={() => toggleAccordion(idx)}
                >
                  <Text style={[styles.questionText, { textAlign }]}>
                    {t(faq.qKey)}
                  </Text>
                  <Text style={[styles.caret, isOpen && styles.caretRotated]}>
                    ▾
                  </Text>
                </Pressable>

                {isOpen && (
                  <View style={styles.accordionBody}>
                    <Text style={[styles.answerText, { textAlign }]}>
                      {t(faq.aKey)}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
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
    paddingBottom: 40,
  },
  btn: {
    backgroundColor: '#0F6E56',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnIcon: {
    fontSize: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 13.5,
    color: '#1A2B2A',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  accordionWrapper: {
    overflow: 'hidden',
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  accordionHead: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  questionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2B2A',
    flex: 1,
    paddingRight: 10,
  },
  caret: {
    fontSize: 16,
    color: '#6B756F',
    fontWeight: '700',
  },
  caretRotated: {
    transform: [{ rotate: '180deg' }],
  },
  accordionBody: {
    paddingBottom: 14,
    paddingTop: 2,
  },
  answerText: {
    fontSize: 12.5,
    color: '#6B756F',
    lineHeight: 19,
  },
});
