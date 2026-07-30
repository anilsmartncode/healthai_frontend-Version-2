import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors, Radius, Spacing } from '@/constants/Colors';

const STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/healthai/id6794323149'
    : 'https://play.google.com/store/apps/details?id=com.healthai.app';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Really good', 'Excellent!'];

export default function RateApp() {
  const [rating, setRating]   = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Please select a star rating first.');
      return;
    }
    // TODO: POST /api/app/rating  { rating, feedback }
    setSubmitted(true);
    if (rating >= 4) {
      setTimeout(() => Linking.openURL(STORE_URL), 1200);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Rate the app</Text>
        </View>
        <View style={styles.thankWrap}>
          <View style={styles.thankIcon}>
            <Ionicons name="heart" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.thankTitle}>Thank you!</Text>
          <Text style={styles.thankSub}>
            {rating >= 4
              ? 'Redirecting you to the store…'
              : 'Your feedback helps us improve HealthAI for everyone.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Rate the app</Text>
      </View>

      <View style={styles.body}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Enjoying HealthAI?</Text>
          <Text style={styles.heroSub}>Your rating helps us keep improving</Text>
        </View>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={40}
                color={n <= rating ? '#F59E0B' : Colors.border}
              />
            </Pressable>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
        )}

        {/* Feedback box (shown when rating ≤ 3) */}
        {rating > 0 && rating <= 3 && (
          <View style={styles.feedbackWrap}>
            <Text style={styles.feedbackLabel}>What can we do better?</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us more (optional)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, rating === 0 && styles.submitDisabled]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitLabel}>Submit rating</Text>
        </Pressable>

        <Text style={styles.hint}>
          {rating >= 4
            ? 'Tapping submit takes you to the store'
            : 'Your feedback is sent directly to our team'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, flex: 1 },
  body: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  heroWrap: { alignItems: 'center', gap: 8, marginTop: Spacing.xl },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textMuted },
  starsRow: { flexDirection: 'row', gap: 10 },
  ratingLabel: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  feedbackWrap: { width: '100%', gap: 8 },
  feedbackLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  feedbackInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 100,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  thankWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  thankIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  thankTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  thankSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
