import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useUsage } from '@/context/UsageContext';
import { PLAN_LIMITS } from '@/constants/plans';
import { router } from 'expo-router';

export default function PlansScreen() {
  const { activePlan, upgradeToPremium } = useUsage();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    // Simulate a network request to Google Play/Apple IAP
    setTimeout(async () => {
      await upgradeToPremium();
      setIsProcessing(false);
      alert('Payment Successful! Welcome to Premium! 🎉');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Subscription & Plans</Text>
          <Text style={styles.subtitle}>Unlock the full potential of HealthAI</Text>
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
            <Text style={styles.premiumBadgeText}>RECOMMENDED</Text>
          </View>
          
          <View style={styles.cardHeader}>
            <Text style={[styles.planName, { color: '#fff' }]}>Premium Plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={styles.strikePrice}>₹299</Text>
              <Text style={[styles.price, { color: '#fff' }]}>₹99 <Text style={[styles.period, { color: 'rgba(255,255,255,0.7)' }]}>/mo</Text></Text>
            </View>
          </View>
          
          <View style={styles.featureList}>
            <Feature icon="chatbubbles" text="Unlimited AI Chats" premium />
            <Feature icon="document-text" text={`${PLAN_LIMITS.PREMIUM.maxMonthlyReports} Report analyses per month`} premium />
            <Feature icon="barcode" text="Unlimited Medicine scans" premium />
            <Feature icon="people" text={`Up to ${PLAN_LIMITS.PREMIUM.maxFamilyMembers} Family members`} premium />
            <Feature icon="star" text="Priority AI Processing" premium />
          </View>

          {activePlan === 'FREE' ? (
            <Pressable 
              style={styles.upgradeBtn} 
              onPress={handleSimulatePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
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

      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 40, gap: 20 },
  
  header: { alignItems: 'center', marginTop: 10, marginBottom: 5 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textMuted },
  
  currentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, paddingVertical: 12, borderRadius: Radius.lg,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
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
  planName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  price: { fontSize: 24, fontWeight: '800', color: Colors.text },
  period: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  strikePrice: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through', marginBottom: 3 },

  featureList: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 14, color: Colors.text, flex: 1, fontWeight: '500' },

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
