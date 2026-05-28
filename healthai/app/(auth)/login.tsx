import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { authService } from '@/services/auth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    await authService.sendOtp(phone);
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { phone } });
  };

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Login / Sign up</Text>
      <Text style={styles.sub}>Welcome back! Please login to continue</Text>

      <View style={{ marginTop: 24, gap: 16 }}>
        <Input label="Mobile Number" placeholder="+91 98765 43210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Button title="Send OTP" onPress={send} loading={loading} />
        <Text style={styles.or}>or continue with</Text>
        <Button title="Continue with Google" variant="outline" />
        <Button title="Continue as Guest" variant="ghost" onPress={() => router.replace('/(tabs)/home')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 24, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  or: { textAlign: 'center', color: Colors.textMuted, marginVertical: 4 },
});
