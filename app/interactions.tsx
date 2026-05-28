import { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MedChip } from "@/components/medicines/MedChip";
import { InteractionWarning } from "@/components/medicines/InteractionWarning";
import { useLang } from "@/context/Languagecontext";

export default function InteractionsScreen() {
  const { t } = useLang();
  const [meds, setMeds] = useState<string[]>([
    "Metformin 500mg",
    "Aspirin 75mg",
  ]);
  const [text, setText] = useState("");

  const remove = (m: string) => setMeds((s) => s.filter((x) => x !== m));
  const add = () => {
    if (text.trim()) {
      setMeds((s) => [...s, text.trim()]);
      setText("");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={styles.title}>{t("interactions_title")}</Text>
      <Text style={styles.sub}>{t("interactions_sub")}</Text>

      <Text style={styles.section}>{t("selected_meds")}</Text>
      {meds.map((m) => (
        <MedChip key={m} name={m} onRemove={() => remove(m)} />
      ))}

      <Text style={styles.section}>{t("add_medicine")}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder={t("search_medicine")}
            value={text}
            onChangeText={setText}
          />
        </View>
        <Pressable onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <InteractionWarning />
      <Button title={t("save_check")} onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: Colors.text },
  sub: { color: Colors.textMuted },
  section: { fontWeight: "700", color: Colors.text, marginTop: 8 },
  addBtn: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
});
