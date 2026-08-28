import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking, Modal, Platform } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useUsage } from '@/context/UsageContext';
import { useCountry } from '@/context/CountryContext';
import { useLang } from '@/context/Languagecontext';
import { PLAN_LIMITS } from '@/constants/plans';
import { router } from 'expo-router';

const REGIONAL_PRICING: Record<string, {
  currencySymbol: string;
  freePrice: string;
  premiumOriginal: string;
  premiumPrice: string;
  familyOriginal: string;
  familyPrice: string;
}> = {
  US: { currencySymbol: '$', freePrice: '$0', premiumOriginal: '$5.99', premiumPrice: '$2.99', familyOriginal: '$15.99', familyPrice: '$7.99' },
  GB: { currencySymbol: '£', freePrice: '£0', premiumOriginal: '£4.99', premiumPrice: '£2.49', familyOriginal: '£13.99', familyPrice: '£6.99' },
  CA: { currencySymbol: 'CA$', freePrice: 'CA$0', premiumOriginal: 'CA$7.99', premiumPrice: 'CA$3.99', familyOriginal: 'CA$19.99', familyPrice: 'CA$9.99' },
  AU: { currencySymbol: 'A$', freePrice: 'A$0', premiumOriginal: 'A$8.99', premiumPrice: 'A$4.49', familyOriginal: 'A$23.99', familyPrice: 'A$11.99' },
  AE: { currencySymbol: 'AED ', freePrice: '0 AED', premiumOriginal: '19.99 AED', premiumPrice: '9.99 AED', familyOriginal: '59.99 AED', familyPrice: '29.99 AED' },
  SA: { currencySymbol: 'SAR ', freePrice: '0 SAR', premiumOriginal: '19.99 SAR', premiumPrice: '9.99 SAR', familyOriginal: '59.99 SAR', familyPrice: '29.99 SAR' },
  SG: { currencySymbol: 'S$', freePrice: 'S$0', premiumOriginal: 'S$7.99', premiumPrice: 'S$3.99', familyOriginal: 'S$19.99', familyPrice: 'S$9.99' },
  IN: { currencySymbol: '₹', freePrice: '₹0', premiumOriginal: '₹199', premiumPrice: '₹99', familyOriginal: '₹599', familyPrice: '₹299' },
};

export default function PlansScreen() {
  const { country } = useCountry();
  const pricing = REGIONAL_PRICING[country?.code] || REGIONAL_PRICING.US;
  const { activePlan, upgradeToPremium, upgradeToFamily, restorePurchases } = useUsage();
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const [isProcessingPremium, setIsProcessingPremium] = useState(false);
  const [isProcessingFamily, setIsProcessingFamily] = useState(false);

  // Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'PREMIUM' | 'FAMILY' | null>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'AUTO_RENEW' | 'ONE_TIME'>('AUTO_RENEW');

  const openPaymentModal = (planType: 'PREMIUM' | 'FAMILY') => {
    setSelectedPlanType(planType);
    setSelectedPaymentOption('AUTO_RENEW'); // Default
    setPaymentModalVisible(true);
  };

  const handlePayment = async () => {
    if (!selectedPlanType) return;
    setPaymentModalVisible(false);

    const isOneTime = selectedPaymentOption === 'ONE_TIME';
    const plan = selectedPlanType;
    try {
      if (plan === 'PREMIUM') {
        setIsProcessingPremium(true);
        await upgradeToPremium(isOneTime);
        alert(`${t('payment_successful')} ${t('welcome_premium')}`);
      } else {
        setIsProcessingFamily(true);
        await upgradeToFamily(isOneTime);
        alert(`${t('payment_successful')} ${t('welcome_family')}`);
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        alert(t('payment_failed'));
      }
    } finally {
      setIsProcessingPremium(false);
      setIsProcessingFamily(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={[styles.header, { flexDirection: rowDirection }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7, backgroundColor: '#F1F5F9' }]}
            hitSlop={12}
          >
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { textAlign }]}>{t('subscription_plans')}</Text>
            <Text style={[styles.subtitle, { textAlign }]}>{t('plans_subtitle')}</Text>
          </View>
        </View>

        {/* ── Current Plan Banner ── */}
        <View style={[styles.currentBanner, { flexDirection: rowDirection }]}>
          <View style={[styles.currentBannerLeft, { flexDirection: rowDirection }]}>
            <View style={styles.statusDot} />
            <Text style={styles.currentText}>{t('current_plan_is')}</Text>
          </View>
          <View style={[
            styles.badge,
            activePlan === 'PREMIUM' && styles.badgePremium,
            activePlan === 'FAMILY' && styles.badgeFamily,
          ]}>
            <Ionicons
              name={activePlan === 'FREE' ? 'sparkles' : (activePlan === 'FAMILY' ? 'people' : 'ribbon')}
              size={12}
              color={activePlan === 'FREE' ? Colors.primary : (activePlan === 'FAMILY' ? '#7C3AED' : '#0F766E')}
            />
            <Text style={[
              styles.badgeText,
              activePlan === 'PREMIUM' && styles.badgeTextPremium,
              activePlan === 'FAMILY' && styles.badgeTextFamily,
            ]}>
              {activePlan === 'FREE' ? t('free_plan') : (activePlan === 'PREMIUM' ? t('premium_plan') : t('family_plan'))}
            </Text>
          </View>
        </View>

        {/* ── Free Plan Card ── */}
        <View style={[styles.card, activePlan === 'FREE' && styles.activeCard]}>
          {activePlan === 'FREE' && (
            <View style={styles.activeFloatingPill}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.activeFloatingPillText}>{t('active_plan_badge')}</Text>
            </View>
          )}

          <View style={styles.cardHeader}>
            <Text style={[styles.planName, { textAlign }]}>{t('free_plan')}</Text>
            <Text style={[styles.planSubtitle, { textAlign }]}>{t('standard_access')}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{pricing.freePrice} <Text style={styles.period}>{t('per_month')}</Text></Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureList}>
            <Feature
              icon="chatbubbles-outline"
              text={PLAN_LIMITS.FREE.maxDailyAiChats >= 999 ? t('unlimited_ai_chats') : t('ai_chats_per_day').replace('%s', String(PLAN_LIMITS.FREE.maxDailyAiChats))}
              variant="free"
            />
            <Feature
              icon="document-text-outline"
              text={PLAN_LIMITS.FREE.maxMonthlyReports >= 999 ? t('unlimited_reports') : t('reports_per_month').replace('%s', String(PLAN_LIMITS.FREE.maxMonthlyReports))}
              variant="free"
            />
            <Feature
              icon="barcode-outline"
              text={PLAN_LIMITS.FREE.maxDailyMedicineScans >= 999 ? t('unlimited_medicine_scans') : t('medicine_scans_per_day').replace('%s', String(PLAN_LIMITS.FREE.maxDailyMedicineScans))}
              variant="free"
            />
            <Feature
              icon="people-outline"
              text={PLAN_LIMITS.FREE.maxFamilyMembers >= 999 ? t('unlimited_family_members') : t('family_members_included').replace('%s', String(PLAN_LIMITS.FREE.maxFamilyMembers))}
              variant="free"
            />
          </View>
        </View>

        {/* ── Premium Plan Card (₹199 -> ₹99) ── */}
        <View style={[styles.card, styles.premiumCard, activePlan === 'PREMIUM' && styles.activeCard]}>
          <View style={styles.popularBadge}>
            <Ionicons name="sparkles" size={12} color="#0F766E" />
            <Text style={styles.popularBadgeText}>{t('plan_popular')}</Text>
          </View>

          {activePlan === 'PREMIUM' && (
            <View style={styles.activeFloatingPill}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.activeFloatingPillText}>{t('active_plan_badge')}</Text>
            </View>
          )}

          <View style={[styles.cardHeader, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: '#0F172A', textAlign }]}>{t('premium_plan')}</Text>
              <Text style={[styles.planSubtitle, { textAlign }]}>{t('single_user')}</Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2, fontWeight: '500', textAlign }}>{t('pay_once_or_monthly')}</Text>
              <View style={[styles.offerBadge, { flexDirection: rowDirection }]}>
                <Ionicons name="flame" size={11} color="#EA580C" />
                <Text style={styles.offerBadgeText}>{t('limited_period_offer')}</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.discountRow}>
                <Text style={styles.strikePrice}>{pricing.premiumOriginal}</Text>
                <View style={styles.saveTag}>
                  <Text style={styles.saveTagText}>{t('discount_50_off')}</Text>
                </View>
              </View>
              <Text style={[styles.price, { color: '#0F766E' }]}>{pricing.premiumPrice} <Text style={styles.period}>{t('per_month')}</Text></Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureList}>
            <Feature icon="chatbubbles" text={t('unlimited_ai_chats')} variant="premium" />
            <Feature
              icon="document-text"
              text={PLAN_LIMITS.PREMIUM.maxMonthlyReports >= 999 ? t('unlimited_reports') : t('reports_per_month').replace('%s', String(PLAN_LIMITS.PREMIUM.maxMonthlyReports))}
              variant="premium"
            />
            <Feature icon="barcode" text={t('unlimited_medicine_scans')} variant="premium" />
            <Feature icon="person" text={t('single_user_account')} variant="premium" />
            <Feature icon="star" text={t('priority_ai_processing')} variant="premium" />
          </View>

          {activePlan !== 'PREMIUM' ? (
            <Pressable
              style={({ pressed }) => [styles.upgradeBtn, styles.premiumUpgradeBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
              onPress={() => openPaymentModal('PREMIUM')}
              disabled={isProcessingPremium || isProcessingFamily}
            >
              {isProcessingPremium ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={[styles.btnContentRow, { flexDirection: rowDirection }]}>
                  <Text style={styles.upgradeBtnText}>{t('upgrade_to_premium')}</Text>
                  <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={17} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          ) : (
            <View style={[styles.activePlanBtn, { flexDirection: rowDirection }]}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.activePlanBtnText}>{t('current_plan')}</Text>
            </View>
          )}
        </View>

        {/* ── Family Plan Card (₹599 -> ₹299) ── */}
        <View style={[styles.card, styles.familyCard, activePlan === 'FAMILY' && styles.activeCard]}>
          <View style={styles.familyBadge}>
            <Ionicons name="people" size={12} color="#7C3AED" />
            <Text style={styles.familyBadgeText}>{t('plan_best_value')}</Text>
          </View>

          {activePlan === 'FAMILY' && (
            <View style={styles.activeFloatingPill}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
              <Text style={styles.activeFloatingPillText}>{t('active_plan_badge')}</Text>
            </View>
          )}

          <View style={[styles.cardHeader, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: '#0F172A', textAlign }]}>{t('family_plan')}</Text>
              <Text style={[styles.planSubtitle, { textAlign }]}>{t('up_to_members').replace('%s', String(PLAN_LIMITS.FAMILY.maxFamilyMembers))}</Text>
              <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2, fontWeight: '500', textAlign }}>{t('pay_once_or_monthly')}</Text>
              <View style={[styles.offerBadge, styles.offerBadgeFamily, { flexDirection: rowDirection }]}>
                <Ionicons name="flame" size={11} color="#7C3AED" />
                <Text style={[styles.offerBadgeText, { color: '#7C3AED' }]}>{t('limited_period_offer')}</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.discountRow}>
                <Text style={styles.strikePrice}>{pricing.familyOriginal}</Text>
                <View style={[styles.saveTag, styles.saveTagFamily]}>
                  <Text style={[styles.saveTagText, { color: '#7C3AED' }]}>{t('discount_50_off')}</Text>
                </View>
              </View>
              <Text style={[styles.price, { color: '#7C3AED' }]}>{pricing.familyPrice} <Text style={styles.period}>{t('per_month')}</Text></Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureList}>
            <Feature icon="chatbubbles" text={t('unlimited_ai_chats')} variant="family" />
            <Feature
              icon="document-text"
              text={PLAN_LIMITS.FAMILY.maxMonthlyReports >= 999 ? t('unlimited_reports') : t('reports_per_month').replace('%s', String(PLAN_LIMITS.FAMILY.maxMonthlyReports))}
              variant="family"
            />
            <Feature icon="barcode" text={t('unlimited_medicine_scans')} variant="family" />
            <Feature
              icon="people"
              text={PLAN_LIMITS.FAMILY.maxFamilyMembers >= 999 ? t('unlimited_family_members') : t('family_members_included_plural').replace('%s', String(PLAN_LIMITS.FAMILY.maxFamilyMembers))}
              variant="family"
            />
            <Feature icon="share-social" text={t('shared_family_dashboard')} variant="family" />
            <Feature icon="star" text={t('priority_ai_processing')} variant="family" />
          </View>

          {activePlan !== 'FAMILY' ? (
            <Pressable
              style={({ pressed }) => [styles.upgradeBtn, styles.familyUpgradeBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
              onPress={() => openPaymentModal('FAMILY')}
              disabled={isProcessingPremium || isProcessingFamily}
            >
              {isProcessingFamily ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={[styles.btnContentRow, { flexDirection: rowDirection }]}>
                  <Text style={styles.upgradeBtnText}>{t('upgrade_to_family')}</Text>
                  <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={17} color="#FFFFFF" />
                </View>
              )}
            </Pressable>
          ) : (
            <View style={[styles.activePlanBtn, { flexDirection: rowDirection }]}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.activePlanBtnText}>{t('current_plan')}</Text>
            </View>
          )}
        </View>

        {/* ── Restore Purchases Button ── */}
        <Pressable
          style={({ pressed }) => [styles.restoreBtn, { flexDirection: rowDirection }, pressed && { opacity: 0.6 }]}
          onPress={async () => {
            try {
              const restored = await restorePurchases();
              if (restored) {
                alert('Purchases restored successfully!');
              } else {
                alert('No active subscriptions found to restore.');
              }
            } catch (e) {
              alert('Failed to restore purchases.');
            }
          }}
        >
          <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          <Text style={styles.restoreBtnText}>{t('restore_purchases')}</Text>
        </Pressable>

        {/* Apple/Google-required subscription disclosure */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6, marginTop: 10 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted, lineHeight: 17, textAlign: 'center' }}>
            A {pricing.premiumPrice}/month "Premium" or {pricing.familyPrice}/month "Family Plan" auto-renewing subscription will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings in the {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} after purchase.
          </Text>
        </View>

        {/* Legal Links for App Store Compliance */}
        <View style={{ flexDirection: rowDirection, justifyContent: 'center', gap: 20, paddingBottom: 20 }}>
          <Pressable onPress={() => Linking.openURL('https://healthai.smartncode.com/terms')}>
            <Text style={{ color: Colors.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>Terms of Use (EULA)</Text>
          </Pressable>
          <Text style={styles.legalDot}>•</Text>
          <Pressable onPress={() => Linking.openURL('https://healthai.smartncode.com/privacy')} hitSlop={8}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Choose Payment Option Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('choose_billing')}</Text>
            </View>

            {/* Option A: Auto-Renew */}
            <Pressable
              style={[
                styles.optionCard,
                selectedPaymentOption === 'AUTO_RENEW' && styles.optionCardSelected
              ]}
              onPress={() => setSelectedPaymentOption('AUTO_RENEW')}
            >
              <View style={[styles.optionHeader, { flexDirection: rowDirection }]}>
                <Text style={styles.optionTitle}>{t('auto_renew')}</Text>
                <View style={styles.modalPopularBadge}>
                  <Text style={styles.modalPopularBadgeText}>{t('plan_popular')}</Text>
                </View>
              </View>
              <Text style={[styles.optionDesc, { textAlign }]}>{t('auto_renew_desc')}</Text>
              <View style={[styles.optionPriceRow, { flexDirection: rowDirection }]}>
                <Text style={styles.optionPrice}>
                  {selectedPlanType === 'FAMILY' ? pricing.familyPrice : pricing.premiumPrice}
                  <Text style={styles.optionPeriod}>{t('per_month_full')}</Text>
                </Text>
                {selectedPaymentOption === 'AUTO_RENEW' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </View>
            </Pressable>

            {/* Option B: One-Time Pass */}
            <Pressable
              style={[
                styles.optionCard,
                selectedPaymentOption === 'ONE_TIME' && styles.optionCardSelected
              ]}
              onPress={() => setSelectedPaymentOption('ONE_TIME')}
            >
              <View style={[styles.optionHeader, { flexDirection: rowDirection }]}>
                <Text style={styles.optionTitle}>{t('one_time_payment')}</Text>
              </View>
              <Text style={[styles.optionDesc, { textAlign }]}>{t('one_time_pass_desc')}</Text>
              <View style={[styles.optionPriceRow, { flexDirection: rowDirection }]}>
                <Text style={styles.optionPrice}>
                  {selectedPlanType === 'FAMILY' ? pricing.familyPrice : pricing.premiumPrice}
                  <Text style={styles.optionPeriod}> {t('for_30_days')}</Text>
                </Text>
                {selectedPaymentOption === 'ONE_TIME' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </View>
            </Pressable>

            <Text style={styles.modalDisclaimer}>
              {t('terms_privacy_disclaimer')}
            </Text>

            <Pressable style={styles.modalSubmitBtn} onPress={handlePayment}>
              <Text style={styles.modalSubmitText}>{t('proceed_to_payment')}</Text>
            </Pressable>

            <Pressable style={styles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.modalCancelText}>{t('ill_choose_later')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function Feature({ icon, text, variant = 'free' }: { icon: any; text: string; variant?: 'free' | 'premium' | 'family' }) {
  const { rowDirection, textAlign } = useLang();
  const getTheme = () => {
    switch (variant) {
      case 'premium':
        return {
          iconWrapBg: '#F0FDFA',
          iconColor: '#0F766E',
          textColor: '#0F172A',
        };
      case 'family':
        return {
          iconWrapBg: '#F5F3FF',
          iconColor: '#7C3AED',
          textColor: '#0F172A',
        };
      default:
        return {
          iconWrapBg: '#F8FAFC',
          iconColor: '#64748B',
          textColor: '#334155',
        };
    }
  };

  const theme = getTheme();

  return (
    <View style={[styles.featureRow, { flexDirection: rowDirection }]}>
      <View style={[styles.featureIconWrap, { backgroundColor: theme.iconWrapBg }]}>
        <Ionicons name={icon} size={16} color={theme.iconColor} />
      </View>
      <Text style={[styles.featureText, { color: theme.textColor, textAlign }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 18,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* Current Plan Banner */
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  currentBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  currentText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgePremium: {
    backgroundColor: '#CCFBF1',
  },
  badgeFamily: {
    backgroundColor: '#EDE9FE',
  },
  badgeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextPremium: {
    color: '#0F766E',
  },
  badgeTextFamily: {
    color: '#7C3AED',
  },

  /* Cards Common */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  premiumCard: {
    borderColor: '#0F766E',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  familyCard: {
    borderColor: '#C4B5FD',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  activeCard: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },

  /* Floating Badges (Top Left & Top Right) */
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  popularBadgeText: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  familyBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  familyBadgeText: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  activeFloatingPill: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeFloatingPillText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Card Header & Price */
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
    gap: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  planSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  offerBadgeFamily: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  offerBadgeText: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  period: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  strikePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  saveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saveTagFamily: {
    backgroundColor: '#EDE9FE',
  },
  saveTagText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // Account for safe area
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF', // light blue tint
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  modalPopularBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalPopularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  optionPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  optionPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalDisclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },

  /* Features */
  featureList: {
    gap: 11,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  /* CTA Buttons */
  upgradeBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumUpgradeBtn: {
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
  },
  familyUpgradeBtn: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activePlanBtnText: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Restore */
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  restoreBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Legal */
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: -4,
    paddingBottom: 16,
  },
  legalText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: '#CBD5E1',
    fontSize: 12,
  },
});
