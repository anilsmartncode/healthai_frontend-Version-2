/**
 * FamilyTreeView.tsx — S10 visual family tree
 * Mirrors the .tree-wrap / .tree-node layout in the HTML reference.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { FamilyTreeNode, HealthStatus } from '@/services/familyApi';

export function FamilyTreeView({ tree }: { tree: FamilyTreeNode[] }) {
  const parents  = tree.filter((n) => n.parent_ids.length === 0);
  const children = tree.filter((n) => n.parent_ids.length > 0);

  return (
    <View style={styles.wrap}>
      {/* Parents */}
      <View style={styles.row}>
        {parents.map((n, i) => (
          <View key={n.member_id} style={styles.rowItem}>
            <TreeNode node={n} />
            {i < parents.length - 1 && <View style={styles.hline} />}
          </View>
        ))}
      </View>

      {children.length > 0 && <View style={styles.vline} />}

      {/* Children */}
      {children.length > 0 && (
        <View style={styles.row}>
          {children.map((n, i) => (
            <View key={n.member_id} style={styles.rowItem}>
              <TreeNode node={n} />
              {i < children.length - 1 && <View style={styles.hline} />}
            </View>
          ))}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Excellent / Good', color: Colors.success },
          { label: 'Attention',        color: Colors.warning },
          { label: 'Critical',         color: Colors.danger },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: l.color }]} />
            <Text style={styles.legendTxt}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TreeNode({ node }: { node: FamilyTreeNode }) {
  const color = statusColor(node.status);
  return (
    <View style={styles.node}>
      <View style={[styles.avatar, { borderColor: color }]}>
        <Ionicons name="person-outline" size={20} color={color} />
      </View>
      <Text style={styles.nodeName}>{node.name}</Text>
      <Text style={[styles.nodeScore, { color }]}>{node.health_score}</Text>
    </View>
  );
}

function statusColor(s: HealthStatus) {
  return s === 'Excellent' || s === 'Good' ? Colors.success
       : s === 'Attention'                 ? Colors.warning : Colors.danger;
}

const styles = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingVertical: 20 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rowItem:    { flexDirection: 'row', alignItems: 'center' },
  hline:      { width: 36, height: 1.5, backgroundColor: Colors.border },
  vline:      { width: 1.5, height: 44, backgroundColor: Colors.border, marginVertical: 8 },
  node:       { alignItems: 'center', gap: 4, marginHorizontal: 10 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5F0', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  nodeName:   { fontSize: 12, fontWeight: '500', color: Colors.text },
  nodeScore:  { fontSize: 15, fontWeight: '700' },
  legend:     { flexDirection: 'row', gap: 18, marginTop: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 9, height: 9, borderRadius: 5 },
  legendTxt:  { fontSize: 11, color: Colors.textMuted },
});
