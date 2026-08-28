import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useAccessibility, type TextSizeOption } from '@/context/AccessibilityContext';

export default function AccessibilityScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const {
    textSize,
    highContrast,
    reduceMotion,
    boldText,
    screenReaderActive,
    setTextSize,
    setHighContrast,
    setReduceMotion,
    setBoldText,
  } = useAccessibility();

  const textColor = highContrast ? '#000000' : '#1A2B2A';
  const subTextColor = highContrast ? '#374151' : '#6B756F';
  const cardBorderColor = highContrast ? '#94A3B8' : '#E4E8E6';
  const fontWeightBold = boldText ? '700' : '600';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Topbar matching Prototype v2 (scr-accessibility) ── */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={Colors.text} />
          </Pressable>
          <Text style={[styles.title, { textAlign, color: textColor }]}>
            {t('accessibility')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Text Size Section ── */}
        <Text style={[styles.sectionLabel, { textAlign, color: subTextColor }]}>
          {t('text_size')}
        </Text>

        <View style={[styles.grid3, { flexDirection: rowDirection }]}>
          {(
            [
              { key: 'default', label: t('text_default'), sizePreview: 'Aa' },
              { key: 'large', label: t('text_large'), sizePreview: 'Aa' },
              { key: 'xlarge', label: t('text_xlarge'), sizePreview: 'Aa' },
            ] as { key: TextSizeOption; label: string; sizePreview: string }[]
          ).map((item) => {
            const isSelected = textSize === item.key;
            return (
              <Pressable
                key={item.key}
                style={[
                  styles.tile,
                  isSelected && styles.tileSelected,
                  highContrast && isSelected && styles.tileSelectedHighContrast,
                  { borderColor: cardBorderColor },
                ]}
                onPress={() => setTextSize(item.key)}
                accessible={true}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.label} text size`}
              >
                <Text
                  style={[
                    styles.tilePreview,
                    item.key === 'large' && { fontSize: 16 },
                    item.key === 'xlarge' && { fontSize: 19 },
                    isSelected && styles.tileTextSelected,
                    boldText && { fontWeight: '800' },
                  ]}
                >
                  {item.sizePreview}
                </Text>
                <Text
                  style={[
                    styles.tileLabel,
                    isSelected && styles.tileTextSelected,
                    boldText && { fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Settings Card ── */}
        <View style={[styles.card, { borderColor: cardBorderColor }]}>
          {/* High contrast mode */}
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.itemTitle, { textAlign, color: textColor, fontWeight: fontWeightBold }]}>
                {t('high_contrast')}
              </Text>
              <Text style={[styles.itemSub, { textAlign, color: subTextColor }]}>
                {t('high_contrast_sub')}
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessible={true}
              accessibilityLabel={t('high_contrast')}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: highContrast ? '#E2E8F0' : '#F1F5F9' }]} />

          {/* Reduce motion */}
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.itemTitle, { textAlign, color: textColor, fontWeight: fontWeightBold }]}>
                {t('reduce_motion')}
              </Text>
              <Text style={[styles.itemSub, { textAlign, color: subTextColor }]}>
                {t('reduce_motion_sub')}
              </Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessible={true}
              accessibilityLabel={t('reduce_motion')}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: highContrast ? '#E2E8F0' : '#F1F5F9' }]} />

          {/* Bold text */}
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.itemTitle, { textAlign, color: textColor, fontWeight: fontWeightBold }]}>
                {t('bold_text')}
              </Text>
              <Text style={[styles.itemSub, { textAlign, color: subTextColor }]}>
                {t('bold_text_sub')}
              </Text>
            </View>
            <Switch
              value={boldText}
              onValueChange={setBoldText}
              trackColor={{ false: '#D1D5DB', true: '#0F766E' }}
              thumbColor="#FFFFFF"
              accessible={true}
              accessibilityLabel={t('bold_text')}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: highContrast ? '#E2E8F0' : '#F1F5F9' }]} />

          {/* Screen reader optimizations */}
          <View style={[styles.row, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 12, paddingLeft: isRTL ? 12 : 0 }}>
              <Text style={[styles.itemTitle, { textAlign, color: textColor, fontWeight: fontWeightBold }]}>
                {t('screen_reader_opt')}
              </Text>
              <Text style={[styles.itemSub, { textAlign, color: subTextColor }]}>
                {t('screen_reader_sub')}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                screenReaderActive ? styles.badgeActive : styles.badgeDefault,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  screenReaderActive ? styles.badgeTextActive : styles.badgeTextDefault,
                ]}
              >
                {screenReaderActive ? 'Active' : 'Ready'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── WCAG 2.1 AA Disclaimer Box ── */}
        <View
          style={[
            styles.disclaimerBox,
            highContrast && styles.disclaimerBoxHighContrast,
          ]}
        >
          <View style={[styles.disclaimerHeader, { flexDirection: rowDirection }]}>
            <Ionicons name="shield-checkmark" size={16} color="#0F766E" />
            <Text style={styles.disclaimerTitle}>WCAG 2.1 AA Standard</Text>
          </View>
          <Text style={[styles.disclaimerText, { textAlign }]}>
            {t('wcag_disclaimer')}
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
    paddingBottom: 40,
  },

  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B756F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── 3-Tile Grid ──
  grid3: {
    gap: 10,
    marginBottom: 6,
  },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileSelected: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  tileSelectedHighContrast: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  tilePreview: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  tileLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B756F',
  },
  tileTextSelected: {
    color: '#FFFFFF',
  },

  // ── Settings Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  itemSub: {
    fontSize: 11,
    color: '#6B756F',
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeDefault: {
    backgroundColor: '#E0F2FE',
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#15803D',
  },
  badgeTextDefault: {
    color: '#0369A1',
  },

  // ── Disclaimer Box ──
  disclaimerBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  disclaimerBoxHighContrast: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  disclaimerHeader: {
    alignItems: 'center',
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  disclaimerText: {
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
  },
});
