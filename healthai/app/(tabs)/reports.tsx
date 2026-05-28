import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportItem } from '@/components/common/ReportItem';
import { Colors } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';

export default function Reports() {
  const { data } = useReports();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.title}>All Reports</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <ReportItem report={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
});
