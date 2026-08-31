import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';

export default function VaccinationScreen() {
  const router = useRouter();

  const handleBookCheckup = () => {
    router.push('/appointments/nearby-doctors');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Vaccination and preventive care
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Summary Card ── */}
        <View style={styles.cardContainer}>
          {/* Item 1 */}
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>Influenza (annual)</Text>
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, styles.badgeTextGreen]}>Up to date</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Item 2 */}
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>Tetanus booster</Text>
            <View style={[styles.badge, styles.badgeAmber]}>
              <Text style={[styles.badgeText, styles.badgeTextAmber]}>Due in 3 months</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Item 3 */}
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>Annual health check-up</Text>
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={[styles.badgeText, styles.badgeTextRed]}>Overdue</Text>
            </View>
          </View>
        </View>

        {/* ── Book Checkup Button ── */}
        <Pressable style={styles.bookBtn} onPress={handleBookCheckup}>
          <Text style={styles.bookBtnText}>Book a check-up</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
    marginLeft: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    paddingRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextAmber: {
    color: '#B45309',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextRed: {
    color: '#991B1B',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0D7B5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7B5F',
  },
});
