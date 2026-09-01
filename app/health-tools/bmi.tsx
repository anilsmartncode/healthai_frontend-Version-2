/**
 * app/health-tools/bmi.tsx — BMI Calculator
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Keyboard, TouchableWithoutFeedback, Platform, KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#0D7B5F', // Green matching check-interactions & mockups
  primaryBg: '#E6F4EA',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
};

export default function BmiCalculator() {
  const [height, setHeight] = useState('172');
  const [weight, setWeight] = useState('78');
  const [bmiResult, setBmiResult] = useState<number | null>(null);

  const calculateBmi = () => {
    Keyboard.dismiss();
    const h = parseFloat(height) / 100; // cm to meters
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = w / (h * h);
      setBmiResult(parseFloat(bmi.toFixed(1)));
    }
  };

  const getBmiDetails = (bmi: number) => {
    if (bmi < 18.5) {
      return {
        status: 'Underweight',
        color: '#0284C7',
        bgColor: '#E0F2FE',
        desc: 'A BMI of less than 18.5 is considered underweight. Focus on nutrient-dense meals and consult a healthcare provider.',
      };
    } else if (bmi < 25) {
      return {
        status: 'Normal',
        color: '#137333',
        bgColor: '#E6F4EA',
        desc: 'A BMI of 18.5–24.9 is considered normal weight. Keep up the balanced diet and regular physical activity.',
      };
    } else if (bmi < 30) {
      return {
        status: 'Overweight',
        color: '#B45309',
        bgColor: '#FEF3C7',
        desc: 'A BMI of 25–29.9 is considered overweight. Consider discussing a nutrition plan with a professional.',
      };
    } else {
      return {
        status: 'Obese',
        color: '#C5221F',
        bgColor: '#FCE8E6',
        desc: 'A BMI of 30 or higher is considered obese. Consult a medical professional or dietician for customized weight management advice.',
      };
    }
  };

  const details = bmiResult ? getBmiDetails(bmiResult) : null;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>BMI calculator</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            
            {/* Height input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                maxLength={3}
              />
            </View>

            {/* Weight input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                maxLength={3}
              />
            </View>

            {/* Calculate Button */}
            <Pressable style={styles.calculateBtn} onPress={calculateBmi}>
              <Text style={styles.calculateBtnText}>Calculate</Text>
            </Pressable>

            {/* Result Card */}
            {bmiResult !== null && details && (
              <View style={styles.resultCard}>
                <Text style={styles.resultSubTitle}>Your BMI</Text>
                
                <Text style={styles.resultValue}>{bmiResult}</Text>
                
                <View style={[styles.badge, { backgroundColor: details.bgColor }]}>
                  <Text style={[styles.badgeText, { color: details.color }]}>
                    {details.status}
                  </Text>
                </View>

                <Text style={styles.resultDesc}>{details.desc}</Text>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Content
  content: {
    padding: 16,
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: C.text,
  },

  // Calculate Button
  calculateBtn: {
    backgroundColor: '#0D7B5F',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  calculateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    marginTop: 10,
  },
  resultSubTitle: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultValue: {
    fontSize: 36,
    fontWeight: '800',
    color: C.text,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultDesc: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});
