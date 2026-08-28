import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // TODO: send to crash reporting (e.g. Sentry.captureException(error))
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="warning-outline" size={40} color={Colors.warning} />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.sub}>
          An unexpected error occurred. Tap below to restart this screen.
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, error: null })}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
        {__DEV__ && this.state.error && (
          <View style={styles.devBox}>
            <Text style={styles.devText}>{this.state.error.message}</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.bg, gap: 14 },
  iconWrap:{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  title:   { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  sub:     { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: Radius.pill, marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  devBox:  { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, width: '100%', marginTop: 8 },
  devText: { fontSize: 11, color: Colors.danger, fontFamily: 'monospace' },
});
