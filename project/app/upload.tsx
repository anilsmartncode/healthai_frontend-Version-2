import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { reportsService } from "@/services/reports";

type PickedFile = { uri: string; name: string; mimeType: string };

export default function Upload() {
  const { t } = useLang();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [loading, setLoading] = useState(false);

  const pickDoc = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType ?? "application/pdf",
      });
    }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({
        uri: a.uri,
        name: a.fileName ?? "report.jpg",
        mimeType: a.mimeType ?? "image/jpeg",
      });
    }
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync();
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({
        uri: a.uri,
        name: a.fileName ?? "photo.jpg",
        mimeType: a.mimeType ?? "image/jpeg",
      });
    }
  };

  const handleSend = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as any);

      const result = await reportsService.analyze(formData);

      // Pass result to analysis screen via params
      router.push({
        pathname: "/analysis",
        params: {
          reportId: String(result.reportId),
          patientName: result.patientName,
          hospitalName: result.hospitalName,
          summary: result.summary, // ← add this
          values: JSON.stringify(result.values),
        },
      });
    } catch (err: any) {
      Alert.alert("Analysis Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.c}>
      <Pressable onPress={pickDoc}>
        <Card style={styles.dropzone}>
          {file ? (
            <>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={Colors.primary}
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.sub}>Tap to change</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={64}
                color={Colors.primary}
              />
              <Text style={styles.title}>{t("upload_report")}</Text>
              <Text style={styles.sub}>(JPG, PNG, PDF | Max 10MB)</Text>
            </>
          )}
        </Card>
      </Pressable>

      <Text style={styles.or}>OR choose from</Text>

      <View style={styles.row}>
        <Pressable style={styles.opt} onPress={camera}>
          <Ionicons name="camera-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Camera</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Gallery</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickDoc}>
          <Ionicons name="document-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Document</Text>
        </Pressable>
      </View>

      {file && (
        <Button
          title={loading ? "Analyzing..." : "Send & Analyze"}
          onPress={handleSend}
          disabled={loading}
          style={styles.sendBtn}
        />
      )}

      {loading && <ActivityIndicator size="large" color={Colors.primary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: Colors.bg, gap: 16 },
  dropzone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderStyle: "dashed",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "600", color: Colors.text },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    maxWidth: "80%",
  },
  sub: { color: Colors.textMuted, fontSize: 12 },
  or: { textAlign: "center", color: Colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  opt: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    gap: 6,
    backgroundColor: Colors.surface,
  },
  optLabel: { fontSize: 12, color: Colors.text, textAlign: "center" },
  sendBtn: { borderRadius: Radius.lg, paddingVertical: 16 },
});
