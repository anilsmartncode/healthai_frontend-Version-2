import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';
import { logVital, VitalType } from '@/services/vitalsApi';

const formatCurrentDate = () => {
  const d = new Date();
  const day = d.getDate();
  const month = d.toLocaleString('default', { month: 'short' });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export default function LogVital() {
  const [type, setType] = useState<VitalType>('Blood pressure');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date());
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  
  const [showDropdown, setShowDropdown] = useState(false);
  const types: VitalType[] = ['Blood pressure', 'Blood glucose', 'SpO2', 'Weight', 'Heart rate', 'HbA1c'];

  const handleSave = async () => {
    if (!value.trim()) {
      Alert.alert('Validation Error', 'Please enter a value.');
      return;
    }
    try {
      await logVital(type, value, date.toISOString());
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save vital.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Log a vital</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.label}>Vital type</Text>
        <View style={{ zIndex: 10 }}>
          <Pressable style={styles.dropdownBtn} onPress={() => setShowDropdown(!showDropdown)}>
            <Text style={styles.dropdownTxt}>{type}</Text>
            <Ionicons name="chevron-down" size={20} color={Colors.text} />
          </Pressable>
          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {types.map(t => (
                <Pressable 
                  key={t} 
                  style={[styles.dropdownItem, type === t && styles.dropdownItemActive]}
                  onPress={() => { setType(t); setShowDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemTxt, type === t && styles.dropdownItemTxtActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>Value</Text>
        <TextInput
          style={styles.input}
          placeholder={type === 'Blood pressure' ? 'e.g. 120/80' : 'e.g. 98'}
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#94A3B8"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Date and time</Text>
        <Pressable 
          style={styles.dropdownBtn} 
          onPress={() => {
            setPickerMode('date');
            setShowPicker(true);
          }}
        >
          <Text style={styles.dropdownTxt}>
            {date.toLocaleString('en-GB', { 
              day: 'numeric', month: 'short', year: 'numeric', 
              hour: 'numeric', minute: '2-digit', hour12: true 
            })}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
            display="default"
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowPicker(false);
              }
              if (selectedDate) {
                setDate(selectedDate);
                if (Platform.OS === 'android' && pickerMode === 'date') {
                  setTimeout(() => {
                    setPickerMode('time');
                    setShowPicker(true);
                  }, 50);
                }
              }
            }}
          />
        )}

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnTxt}>Save entry</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
    marginLeft: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownTxt: { fontSize: 15, color: Colors.text },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: { backgroundColor: '#2563EB' },
  dropdownItemTxt: { fontSize: 15, color: Colors.text },
  dropdownItemTxtActive: { color: '#fff', fontWeight: '500' },
  
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: '#0F766E',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
