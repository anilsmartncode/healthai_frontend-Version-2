/**
 * app/symptom-checker.tsx — Step-by-step Symptom Checker Wizard
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, KeyboardAvoidingView
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
  success: '#137333',
  warning: '#B45309',
};

const SYMPTOMS_LIST = [
  'Headache', 'Fever', 'Fatigue', 'Cough',
  'Sore throat', 'Body pain', 'Nausea', 'Dizziness',
  'Runny nose', 'Chills', 'Shortness of breath', 'Chest congestion'
];

export default function SymptomChecker() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  // Step 2 state
  const [duration, setDuration] = useState('1-2 days');
  const [severity, setSeverity] = useState('Moderate');

  // Step 3 state
  const [age, setAge] = useState('');
  const [existingConditions, setExistingConditions] = useState<string[]>([]);

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(prev => prev.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms(prev => [...prev, symptom]);
    }
  };

  const toggleCondition = (condition: string) => {
    if (existingConditions.includes(condition)) {
      setExistingConditions(prev => prev.filter(c => c !== condition));
    } else {
      setExistingConditions(prev => [...prev, condition]);
    }
  };

  const getPossibleConditions = () => {
    const list = selectedSymptoms.map(s => s.toLowerCase());
    if (list.includes('headache') && list.includes('fatigue') && list.length === 2) {
      return {
        name: 'Tension Headache',
        sub: '(Due to stress or fatigue)',
        desc: 'Often caused by muscle contractions in the head and neck, common under high stress or sleep deprivation.',
        tips: ['Rest in a quiet, dark room', 'Stay hydrated', 'Apply a cold compress', 'Gentle neck stretches']
      };
    }
    if (list.includes('fever') || list.includes('cough') || list.includes('sore throat')) {
      return {
        name: 'Viral Fever',
        sub: '(Common Cold / Flu)',
        desc: 'A respiratory viral infection that typically resolves within 5-7 days with proper care.',
        tips: ['Get plenty of bed rest', 'Drink warm fluids & water', 'Take paracetamol for high fever', 'Gargle warm salt water']
      };
    }
    if (list.includes('nausea') || list.includes('dizziness')) {
      return {
        name: 'Mild Gastroenteritis',
        sub: '(Stomach discomfort)',
        desc: 'Irritation of the digestive tract. Usually gets better within a couple of days.',
        tips: ['Sip electrolyte solutions (ORS)', 'Follow the BRAT diet (Bananas, Rice, Applesauce, Toast)', 'Avoid dairy and fatty foods', 'Rest your stomach']
      };
    }
    return {
      name: 'General Malaise',
      sub: '(Mild viral fatigue)',
      desc: 'Mild systemic tiredness. Frequently occurs during minor immune responses or change of weather.',
      tips: ['Ensure 8+ hours of sleep', 'Hydrate with warm water', 'Eat light, digestible meals', 'Avoid strenuous workouts']
    };
  };

  const filteredSymptoms = SYMPTOMS_LIST.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startAIChat = () => {
    const findings = getPossibleConditions();
    const prompt = `I ran the Symptom Checker. Symptoms: ${selectedSymptoms.join(', ')}. Duration: ${duration}. Severity: ${severity}. Possible Condition suggested: ${findings.name}. Can you explain this condition in detail and tell me what I should do next?`;
    router.push({
      pathname: '/(tabs)/ai-chat',
      params: { prefill: prompt, newSession: Date.now().toString() }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Symptom checker</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress indicators */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(num => (
          <React.Fragment key={num}>
            {num > 1 && (
              <View style={[styles.progressLine, step >= num ? styles.progressLineActive : null]} />
            )}
            <View style={[styles.progressCircle, step >= num ? styles.progressCircleActive : null]}>
              <Text style={[styles.progressText, step >= num ? styles.progressTextActive : null]}>
                {num}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Step 1: Select Symptoms */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleWrap}>
              <Text style={styles.stepTitle}>Select your symptoms</Text>
              <Text style={styles.stepSubtitle}>Choose all that apply</Text>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search symptoms..."
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView contentContainerStyle={styles.chipsGrid} showsVerticalScrollIndicator={false}>
              {filteredSymptoms.map(item => {
                const isSelected = selectedSymptoms.includes(item);
                return (
                  <Pressable
                    key={item}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    onPress={() => toggleSymptom(item)}
                  >
                    <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                      {item} {isSelected ? '✓' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.nextBtn, selectedSymptoms.length === 0 ? styles.btnDisabled : null]}
              onPress={() => selectedSymptoms.length > 0 && setStep(2)}
              disabled={selectedSymptoms.length === 0}
            >
              <Text style={styles.btnText}>Next</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Duration & Severity */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleWrap}>
              <Text style={styles.stepTitle}>Duration & Severity</Text>
              <Text style={styles.stepSubtitle}>Tell us more about how you feel</Text>
            </View>

            <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
              {/* Duration Options */}
              <Text style={styles.sectionLabel}>How long have you had these symptoms?</Text>
              <View style={styles.optionGrid}>
                {['1-2 days', '3-5 days', '1 week+'].map(d => (
                  <Pressable
                    key={d}
                    style={[styles.optionCard, duration === d ? styles.optionCardActive : null]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.optionCardText, duration === d ? styles.optionCardTextActive : null]}>
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Severity Options */}
              <Text style={styles.sectionLabel}>Select the severity level</Text>
              <View style={styles.optionGrid}>
                {['Mild', 'Moderate', 'Severe'].map(s => (
                  <Pressable
                    key={s}
                    style={[styles.optionCard, severity === s ? styles.optionCardActive : null]}
                    onPress={() => setSeverity(s)}
                  >
                    <Text style={[styles.optionCardText, severity === s ? styles.optionCardTextActive : null]}>
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable style={styles.nextBtn} onPress={() => setStep(3)}>
              <Text style={styles.btnText}>Next</Text>
            </Pressable>
          </View>
        )}

        {/* Step 3: Age & Medical History */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleWrap}>
              <Text style={styles.stepTitle}>Additional details</Text>
              <Text style={styles.stepSubtitle}>Help refine your analysis</Text>
            </View>

            <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Your Age</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your age (optional)"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />

              <Text style={styles.sectionLabel}>Pre-existing health conditions (optional)</Text>
              <View style={styles.chipsGrid}>
                {['Diabetes', 'Hypertension', 'Asthma', 'Heart disease'].map(c => {
                  const isSelected = existingConditions.includes(c);
                  return (
                    <Pressable
                      key={c}
                      style={[styles.chip, isSelected ? styles.chipSelected : null]}
                      onPress={() => toggleCondition(c)}
                    >
                      <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                        {c} {isSelected ? '✓' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable style={styles.nextBtn} onPress={() => setStep(4)}>
              <Text style={styles.btnText}>Calculate Results</Text>
            </Pressable>
          </View>
        )}

        {/* Step 4: Results Display */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.resultsHeader}>Possible findings</Text>
              
              <View style={styles.resultCard}>
                <Text style={styles.possibleLabel}>Possible Condition</Text>
                
                <View style={styles.resultMainRow}>
                  <View style={styles.shieldWrap}>
                    <Ionicons name="shield-checkmark" size={24} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conditionName}>{getPossibleConditions().name}</Text>
                    <Text style={styles.conditionSub}>{getPossibleConditions().sub}</Text>
                  </View>
                </View>

                <Text style={styles.conditionDesc}>{getPossibleConditions().desc}</Text>
              </View>

              <Text style={styles.sectionLabel}>What you can do</Text>
              {getPossibleConditions().tips.map(tip => (
                <View key={tip} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}

              <View style={styles.warningBox}>
                <Ionicons name="warning" size={20} color="#EA580C" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.warningText}>
                  This assessment is for informational purposes. If symptoms persist, worsen, or cause you concern, please consult a healthcare professional immediately.
                </Text>
              </View>

              <Pressable style={styles.talkAiBtn} onPress={startAIChat}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.talkAiText}>Discuss with AI Assistant</Text>
              </Pressable>

              <Pressable style={styles.homeBtn} onPress={() => router.navigate('/(tabs)/ai')}>
                <Text style={styles.homeBtnText}>Return to Dashboard</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
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

  // Progress Indicators
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  progressCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  progressCircleActive: {
    backgroundColor: '#0D7B5F',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  progressTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: -2,
    zIndex: 1,
  },
  progressLineActive: {
    backgroundColor: '#0D7B5F',
  },

  // Step Containers
  stepContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  titleWrap: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },

  // Search input
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  // Symptom Chips
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '46%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: '#E6F4EA',
    borderColor: '#0D7B5F',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#0D7B5F',
  },

  // Option selections
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  optionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: '#0D7B5F',
    backgroundColor: '#E6F4EA',
  },
  optionCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  optionCardTextActive: {
    color: '#0D7B5F',
    fontWeight: '700',
  },

  // Form input
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
  },

  // Results styling
  resultsHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginTop: 10,
  },
  possibleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D7B5F',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  conditionSub: {
    fontSize: 12,
    color: '#64748B',
  },
  conditionDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#334155',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 14,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 16,
  },

  // Action Buttons
  nextBtn: {
    backgroundColor: '#0D7B5F',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  talkAiBtn: {
    flexDirection: 'row',
    backgroundColor: '#0D7B5F',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  talkAiText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});
