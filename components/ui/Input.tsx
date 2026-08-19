import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

interface Props extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...rest }: Props) {
  return (
    <View style={{ width: '100%' }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: Colors.text, marginBottom: 4, fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
});
