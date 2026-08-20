import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking, Modal, Platform } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useUsage } from '@/context/UsageContext';
import { PLAN_LIMITS } from '@/constants/plans';
import { router } from 'expo-router';

export default function PlansScreen() {
  const { activePlan, upgradeToPremium, upgradeToFamily, restorePurchases } = useUsage();
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
        alert('Payment Successful! Welcome to Premium! 🎉');
      } else {
        setIsProcessingFamily(true);
        await upgradeToFamily(isOneTime);
        alert('Payment Successful! Welcome to the Family Plan! 🎉');
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        alert('Payment failed. Please try again.');
      }
    } finally {
      setIsProcessingPremium(false);
      setIsProcessingFamily(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Subscription & Plans</Text>
            <Text style={styles.subtitle}>Unlock the full potential of HealthAI</Text>
          </View>
        </View>

        {/* Current Plan Banner */}
        <View style={styles.currentBanner}>
          <Text style={styles.currentText}>Your current plan is:</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activePlan}</Text>
          </View>
        </View>

        {/* Free Plan Card */}
        <View style={[styles.card, activePlan === 'FREE' && styles.activeCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.planName}>Free Plan</Text>
            <Text style={styles.price}>₹0 <Text style={styles.period}>/mo</Text></Text>
          </View>

          <View style={styles.featureList}>
            <Feature icon="chatbubbles-outline" text={`${PLAN_LIMITS.FREE.maxDailyAiChats} AI Chats per day`} />
            <Feature icon="document-text-outline" text={`${PLAN_LIMITS.FREE.maxMonthlyReports} Report analysis per month`} />
            <Feature icon="barcode-outline" text={`${PLAN_LIMITS.FREE.maxDailyMedicineScans} Medicine scan per day`} />
            <Feature icon="people-outline" text={`${PLAN_LIMITS.FREE.maxFamilyMembers} Family member included`} />
          </View>
        </View>

        {/* Premium Plan Card */}
        <View style={[styles.card, styles.premiumCard, activePlan === 'PREMIUM' && styles.activeCard]}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>POPULAR</Text>
          </View>

          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.planName, { color: '#fff' }]}>Premium</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>Single User</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>Pay Once or Auto-Renew Monthly</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.strikePrice}>₹299</Text>
              <Text style={[styles.price, { color: '#fff' }]}>₹99 <Text style={[styles.period, { color: 'rgba(255,255,255,0.7)' }]}>/mo</Text></Text>
            </View>
          </View>

          <View style={styles.featureList}>
            <Feature icon="chatbubbles" text="Unlimited AI Chats" premium />
            <Feature icon="document-text" text={`${PLAN_LIMITS.PREMIUM.maxMonthlyReports} Report analyses per month`} premium />
            <Feature icon="barcode" text="Unlimited Medicine scans" premium />
            <Feature icon="person" text="Single User Account" premium />
            <Feature icon="star" text="Priority AI Processing" premium />
          </View>

          {activePlan !== 'PREMIUM' ? (
            <Pressable
              style={styles.upgradeBtn}
              onPress={() => openPaymentModal('PREMIUM')}
              disabled={isProcessingPremium || isProcessingFamily}
            >
              {isProcessingPremium ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.activePlanBtn}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.activePlanBtnText}>Active Plan</Text>
            </View>
          )}
        </View>

        {/* Family Plan Card */}
        <View style={[styles.card, styles.familyCard, activePlan === 'FAMILY' && styles.activeCard]}>
          <View style={[styles.premiumBadge, { backgroundColor: '#8B5CF6' }]}>
            <Text style={[styles.premiumBadgeText, { color: '#fff' }]}>BEST VALUE</Text>
          </View>

          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.planName, { color: '#fff' }]}>Family Plan</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>Up to {PLAN_LIMITS.FAMILY.maxFamilyMembers} Members</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>Pay Once or Auto-Renew Monthly</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={[styles.price, { color: '#fff' }]}>₹299 <Text style={[styles.period, { color: 'rgba(255,255,255,0.7)' }]}>/mo</Text></Text>
            </View>
          </View>

          <View style={styles.featureList}>
            <Feature icon="chatbubbles" text="Unlimited AI Chats" premium />
            <Feature icon="document-text" text={`${PLAN_LIMITS.FAMILY.maxMonthlyReports} Report analyses per month`} premium />
            <Feature icon="barcode" text="Unlimited Medicine scans" premium />
            <Feature icon="people" text={`Up to ${PLAN_LIMITS.FAMILY.maxFamilyMembers} Family members included`} premium />
            <Feature icon="share-social" text="Shared Family Dashboard" premium />
            <Feature icon="star" text="Priority AI Processing" premium />
          </View>

          {activePlan !== 'FAMILY' ? (
            <Pressable
              style={[styles.upgradeBtn, { backgroundColor: '#fff' }]}
              onPress={() => openPaymentModal('FAMILY')}
              disabled={isProcessingPremium || isProcessingFamily}
            >
              {isProcessingFamily ? (
                <ActivityIndicator color="#8B5CF6" />
              ) : (
                <Text style={[styles.upgradeBtnText, { color: '#7C3AED' }]}>Upgrade to Family</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.activePlanBtn}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.activePlanBtnText}>Active Plan</Text>
            </View>
          )}
        </View>

        {/* Restore Purchases Button */}
        <Pressable
          style={{ paddingVertical: 10, alignItems: 'center', marginTop: 10 }}
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
          <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 15 }}>Restore Purchases</Text>
        </Pressable>

        {/* Apple/Google-required subscription disclosure */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6, marginTop: 10 }}>
          <Text style={{ fontSize: 11, color: Colors.textMuted, lineHeight: 17, textAlign: 'center' }}>
            A ₹99/month "Premium" or ₹299/month "Family Plan" auto-renewing subscription will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings in the {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} after purchase.
          </Text>
        </View>

        {/* Legal Links for App Store Compliance */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, paddingBottom: 20 }}>
          <Pressable onPress={() => Linking.openURL('https://healthai.smartncode.com/terms')}>
            <Text style={{ color: Colors.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>Terms of Use (EULA)</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://healthai.smartncode.com/privacy')}>
            <Text style={{ color: Colors.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>Privacy Policy</Text>
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
              <Text style={styles.modalTitle}>Choose Payment Option</Text>
            </View>

            {/* Option A: Auto-Renew */}
            <Pressable
              style={[
                styles.optionCard,
                selectedPaymentOption === 'AUTO_RENEW' && styles.optionCardSelected
              ]}
              onPress={() => setSelectedPaymentOption('AUTO_RENEW')}
            >
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Auto-Renewing Subscription</Text>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              </View>
              <Text style={styles.optionDesc}>Enjoy continuous access to all premium features without interruption.</Text>
              <View style={styles.optionPriceRow}>
                <Text style={styles.optionPrice}>
                  {selectedPlanType === 'FAMILY' ? '₹299' : '₹99'}
                  <Text style={styles.optionPeriod}>/month</Text>
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
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>One-Time Pass</Text>
              </View>
              <Text style={styles.optionDesc}>Full access for 30 days. No automatic renewal, pay manually next time.</Text>
              <View style={styles.optionPriceRow}>
                <Text style={styles.optionPrice}>
                  {selectedPlanType === 'FAMILY' ? '₹299' : '₹99'}
                  <Text style={styles.optionPeriod}> for 30 days</Text>
                </Text>
                {selectedPaymentOption === 'ONE_TIME' && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </View>
            </Pressable>

            <Text style={styles.modalDisclaimer}>
              By proceeding, you agree to our Terms of Use & Privacy Policy.
            </Text>

            <Pressable style={styles.modalSubmitBtn} onPress={handlePayment}>
              <Text style={styles.modalSubmitText}>Subscribe & Pay</Text>
            </Pressable>

            <Pressable style={styles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.modalCancelText}>I'll choose later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function Feature({ icon, text, premium = false }: { icon: any, text: string, premium?: boolean }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={20} color={premium ? '#93C5FD' : Colors.primary} />
      <Text style={[styles.featureText, premium && { color: '#F8FAFC' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 40, gap: 28 }, // Increased gap for breathability

  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 15, paddingHorizontal: 4 },
  backButton: { padding: 4, marginRight: 16 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textMuted },

  currentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, paddingVertical: 10, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, gap: 10
  },
  currentText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  badge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  activeCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  premiumCard: {
    marginTop: 12, // Prevents badge from overlapping the card above
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  familyCard: {
    marginTop: 12, // Prevents badge from overlapping the card above
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    borderWidth: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumBadge: {
    position: 'absolute', top: -12, alignSelf: 'center',
    backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: Radius.pill, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  premiumBadgeText: { color: Colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  planName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  price: { fontSize: 24, fontWeight: '800', color: Colors.text },
  period: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  strikePrice: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through', marginBottom: 3 },

  featureList: { gap: 16 }, // Increased spacing between features
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: Colors.text, fontWeight: '500' },

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
  popularBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
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

  upgradeBtn: {
    backgroundColor: '#fff',
    marginTop: 24, paddingVertical: 16, borderRadius: Radius.lg,
    alignItems: 'center',
  },
  upgradeBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  activePlanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 24, paddingVertical: 16, borderRadius: Radius.lg,
  },
  activePlanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
