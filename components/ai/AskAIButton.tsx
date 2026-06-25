/**
 * components/ai/AskAIButton.tsx
 * ─────────────────────────────────────────────
 * Reusable "Ask AI" button for deep links from any screen.
 * Usage:
 *   <AskAIButton prefill="What does my CBC report mean?" />
 *   <AskAIButton prefill="..." context="report details..." variant="chip" />
 */
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  prefill: string;
  context?: string;
  label?: string;
  variant?: 'button' | 'chip' | 'icon' | 'banner';
}

export function AskAIButton({ prefill, context, label = 'Ask AI', variant = 'button' }: Props) {
  const handlePress = () => {
    router.push({
      pathname: '/ai-chat',
      params: { prefill, context: context ?? '' },
    });
  };

  if (variant === 'chip') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name="sparkles" size={12} color={Colors.primary} />
        <Text style={styles.chipText}>{label}</Text>
      </Pressable>
    );
  }

  if (variant === 'icon') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
        hitSlop={8}
      >
        <Ionicons name="sparkles" size={20} color={Colors.primary} />
      </Pressable>
    );
  }

  if (variant === 'banner') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.bannerLeft}>
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.bannerTitle}>{label}</Text>
            <Text style={styles.bannerSub} numberOfLines={1}>{prefill}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
      </Pressable>
    );
  }

  // default: button
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="sparkles" size={16} color={Colors.primary} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.primary + '0D',
  },
  buttonText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.primary + '50',
    borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: Colors.primary + '0D',
  },
  chipText: { color: Colors.primary, fontSize: 12, fontWeight: '500' },

  iconBtn: { padding: 4 },

  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
  },
  bannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bannerIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  bannerSub:   { fontSize: 12, color: Colors.textMuted, marginTop: 2, maxWidth: 220 },
});
