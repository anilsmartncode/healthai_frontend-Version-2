import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';

export default function Otp() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const verify = async () => {
    setLoading(true);
    const r = await authService.verifyOtp(phone ?? '', code);
    setLoading(false);
    if (r.ok) {
      await signIn(r.token, phone ?? '');
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.sub}>Enter the 6-digit code sent to {phone}</Text>
      <View style={{ marginTop: 24, gap: 16 }}>
        <Input placeholder="• • • • • •" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
        <Button title="Verify" onPress={verify} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 24, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
});
