import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius } from '@/constants/Colors';
import { useUsage } from '@/context/UsageContext';

const { width } = Dimensions.get('window');

export function PaywallModal() {
  const { showPaywall, setShowPaywall } = useUsage();

  if (!showPaywall) return null;

  return (
    <Modal transparent animationType="fade" visible={showPaywall}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>Limit Reached</Text>
          <Text style={styles.message}>
            You have reached the maximum limit for your current plan. Please upgrade your plan or contact your administrator to continue using this feature.
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={() => setShowPaywall(false)}>
              <Text style={styles.cancelText}>Maybe Later</Text>
            </Pressable>
            
            <Pressable style={styles.upgradeButton} onPress={() => { setShowPaywall(false); router.push('/plans'); }}>
              <Text style={styles.upgradeText}>Upgrade Plan</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(width - 40, 400),
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  upgradeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
