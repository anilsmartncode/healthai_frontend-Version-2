/**
 * app/family/invite-success.tsx — Son-side: Joined Family Successfully
 * ─────────────────────────────────────────────────────────────────────
 * Shown after acceptInvitation() returns success: true.
 * No API call here — purely a celebration + navigation screen.
 * ─────────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const RELATIONSHIP_ICON: Record<string, string> = {
  Father: '👨', Mother: '👩', Son: '👦', Daughter: '👧',
  Brother: '👦', Sister: '👧', Grandfather: '👴', Grandmother: '👵',
  Spouse: '💑', default: '👤',
};

export default function InviteSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { invited_by = 'your family member', relationship = 'Member' } =
    useLocalSearchParams<{ invited_by: string; relationship: string }>();

  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const icon = RELATIONSHIP_ICON[relationship] ?? RELATIONSHIP_ICON.default;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>

      {/* Animated tick */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={52} color="#fff" />
      </Animated.View>

      <Animated.View style={{ opacity, alignItems: 'center', paddingHorizontal: 28 }}>
        <Text style={styles.emoji}>{icon}</Text>
        <Text style={styles.title}>You've joined!</Text>
        <Text style={styles.sub}>
          You are now connected to{' '}
          <Text style={styles.highlight}>{invited_by}</Text>'s family as{' '}
          <Text style={styles.highlight}>{relationship}</Text>.
        </Text>

        {/* Feature summary */}
        <View style={styles.featuresCard}>
          {[
            { icon: 'document-text-outline' as const, txt: 'View shared health reports' },
            { icon: 'medical-outline'        as const, txt: 'See family medications & reminders' },
            { icon: 'sparkles-outline'       as const, txt: 'Access AI health insights together' },
            { icon: 'shield-checkmark-outline' as const, txt: 'Emergency contact enabled' },
          ].map((f, i) => (
            <View key={i} style={styles.featRow}>
              <View style={styles.featIcon}>
                <Ionicons name={f.icon} size={15} color={Colors.primary} />
              </View>
              <Text style={styles.featTxt}>{f.txt}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Ionicons name="home-outline" size={18} color="#fff" />
          <Text style={styles.btnTxt}>Go to Home</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.7 }]}
          onPress={() => router.replace('/family')}
        >
          <Text style={styles.btnSecTxt}>View Family Dashboard</Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#F4F7F6', alignItems: 'center', justifyContent: 'center' },

  checkCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },

  emoji:       { fontSize: 44, marginBottom: 10, marginTop: 4 },
  title:       { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  sub:         { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  highlight:   { fontWeight: '700', color: Colors.primary },

  featuresCard:{ width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, gap: 12 },
  featRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featIcon:    { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8F9F0', justifyContent: 'center', alignItems: 'center' },
  featTxt:     { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },

  btnPrimary:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, padding: 15, width: '100%', marginBottom: 10 },
  btnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary:{ borderRadius: 14, padding: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  btnSecTxt:   { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
