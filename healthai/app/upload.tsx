import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Radius } from '@/constants/Colors';

export default function Upload() {
  const pickDoc = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled) router.push('/analyzing');
  };
  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!r.canceled) router.push('/analyzing');
  };
  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync();
    if (!r.canceled) router.push('/analyzing');
  };

  return (
    <View style={styles.c}>
      <Card style={styles.dropzone}>
        <Ionicons name="cloud-upload-outline" size={64} color={Colors.primary} />
        <Text style={styles.title}>Drag & drop your file here</Text>
        <Text style={styles.sub}>(JPG, PNG, PDF | Max 10MB)</Text>
      </Card>

      <Text style={styles.or}>OR</Text>

      <View style={styles.row}>
        <Pressable style={styles.opt} onPress={camera}>
          <Ionicons name="camera-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Camera Scan</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Gallery</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickDoc}>
          <Ionicons name="document-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Document Picker</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: Colors.bg, gap: 16 },
  dropzone: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderStyle: 'dashed', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  sub: { color: Colors.textMuted, fontSize: 12 },
  or: { textAlign: 'center', color: Colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  opt: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, gap: 6, backgroundColor: Colors.surface },
  optLabel: { fontSize: 12, color: Colors.text, textAlign: 'center' },
});
