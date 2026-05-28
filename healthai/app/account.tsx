import { ScrollView, Text, StyleSheet } from "react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Account() {
  const { phone } = useAuth();
  const [name, setName] = useState("Anil");
  const [email, setEmail] = useState("anil@gmail.com");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={styles.title}>Account Information</Text>
      <Card style={{ gap: 12 }}>
        <Input label="Full name" value={name} onChangeText={setName} />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input label="Phone" value={phone ?? ""} editable={false} />
      </Card>
      <Button title="Save Changes" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: Colors.text },
});
