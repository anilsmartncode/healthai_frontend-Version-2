import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Alert, useWindowDimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import { Doctor, getDoctors } from '@/services/doctorsApi';

export function MyDoctorsWidget() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  
  const { width } = useWindowDimensions();
  // 32 for left/right padding (16 each), 12 for the gap between the 2 cards
  const CARD_WIDTH = (width - 32 - 12) / 2;

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [])
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  if (loading && doctors.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Doctors</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/doctors' as any)}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={{ position: 'relative' }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={styles.scrollContent}
          onScroll={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const contentWidth = e.nativeEvent.contentSize.width;
            const layoutWidth = e.nativeEvent.layoutMeasurement.width;
            // Hide arrow if scrolled near the end
            if (offsetX + layoutWidth >= contentWidth - 20) {
              setShowScrollArrow(false);
            } else {
              setShowScrollArrow(true);
            }
          }}
          scrollEventThrottle={16}
        >
          {doctors.map(doc => (
            <View key={doc.id} style={[styles.card, { width: CARD_WIDTH }]}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={16} color={Colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.spec} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{doc.specialty || 'General Physician'}</Text>
              </View>
            </View>
            <Pressable style={styles.callBtn} onPress={() => handleCall(doc.phone || '')}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.callText}>Call Now</Text>
            </Pressable>
          </View>
        ))}

          <Pressable style={[styles.addCard, { width: CARD_WIDTH }]} onPress={() => router.push('/doctors/new' as any)}>
            <Ionicons name="add" size={28} color={Colors.primary} />
            <Text style={styles.addText}>Add Doctor</Text>
          </Pressable>
        </ScrollView>
        
        {/* Scroll Indicator Arrow */}
        {showScrollArrow && (doctors.length + 1) > 2 && (
          <View style={styles.scrollIndicator}>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  spec: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollIndicator: {
    position: 'absolute',
    right: -16,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});
