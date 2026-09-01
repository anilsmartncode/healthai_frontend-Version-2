/**
 * app/health-tools/calorie.tsx — Calorie Tracker
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  primary: '#0D7B5F', // Green matching check-interactions & mockups
  primaryBg: '#E6F4EA',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
};

interface MealLog {
  id: string;
  name: string;
  calories: number;
  category: string;
}

const INITIAL_MEALS: MealLog[] = [
  { id: '1', name: 'Oatmeal with berries', calories: 420, category: 'Breakfast' },
  { id: '2', name: 'Chicken & quinoa bowl', calories: 1000, category: 'Lunch' }
];

export default function CalorieTracker() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState('Breakfast');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dailyGoal = 2000;

  // Load meals on mount
  useEffect(() => {
    AsyncStorage.getItem('healthai_calorie_meals').then(raw => {
      if (raw) {
        setMeals(JSON.parse(raw));
      } else {
        // Set initial mockup meals
        setMeals(INITIAL_MEALS);
        AsyncStorage.setItem('healthai_calorie_meals', JSON.stringify(INITIAL_MEALS));
      }
    });
  }, []);

  const saveMeals = async (updatedMeals: MealLog[]) => {
    setMeals(updatedMeals);
    await AsyncStorage.setItem('healthai_calorie_meals', JSON.stringify(updatedMeals));
  };

  const handleLogMeal = () => {
    Keyboard.dismiss();
    setDropdownOpen(false);
    const kcal = parseInt(calories);
    if (!mealName.trim() || isNaN(kcal) || kcal <= 0) return;

    const newMeal: MealLog = {
      id: Date.now().toString(),
      name: mealName.trim(),
      calories: kcal,
      category
    };

    const updated = [...meals, newMeal];
    saveMeals(updated);
    
    // Clear inputs
    setMealName('');
    setCalories('');
  };

  const handleDeleteMeal = (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    saveMeals(updated);
  };

  const totalCalories = meals.reduce((acc, curr) => acc + curr.calories, 0);
  const progressPct = Math.min((totalCalories / dailyGoal) * 100, 100);

  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setDropdownOpen(false); }}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Calorie tracker</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Today's Intake Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Today's intake</Text>
                <Text style={styles.progressValue}>
                  {totalCalories.toLocaleString()} / {dailyGoal.toLocaleString()} kcal
                </Text>
              </View>
              
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
            </View>

            {/* Add Meal Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Add a meal</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Grilled chicken salad"
                placeholderTextColor={C.textMuted}
                value={mealName}
                onChangeText={setMealName}
              />

              <View style={styles.formRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Calories (kcal)"
                  placeholderTextColor={C.textMuted}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  maxLength={4}
                />

                <View style={styles.dropdownContainer}>
                  <Pressable
                    style={styles.dropdownTrigger}
                    onPress={() => {
                      Keyboard.dismiss();
                      setDropdownOpen(!dropdownOpen);
                    }}
                  >
                    <Text style={styles.dropdownTriggerText}>{category}</Text>
                    <Ionicons name="chevron-down" size={14} color={C.text} />
                  </Pressable>

                  {dropdownOpen && (
                    <View style={styles.dropdownList}>
                      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(option => (
                        <Pressable
                          key={option}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategory(option);
                            setDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{option}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Pressable
                style={[styles.logBtn, !mealName.trim() || !calories.trim() ? styles.logBtnDisabled : null]}
                onPress={handleLogMeal}
                disabled={!mealName.trim() || !calories.trim()}
              >
                <Text style={styles.logBtnText}>Log meal</Text>
              </Pressable>
            </View>

            {/* Logged Meals List */}
            {meals.length > 0 && (
              <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Logged meals</Text>
                {meals.map(item => (
                  <View key={item.id} style={styles.mealRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealName}>{item.name}</Text>
                      <Text style={styles.mealCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.mealRight}>
                      <Text style={styles.mealCalories}>{item.calories} kcal</Text>
                      <Pressable onPress={() => handleDeleteMeal(item.id)} hitSlop={10}>
                        <Ionicons name="trash-outline" size={16} color="#DC2626" style={{ marginLeft: 8 }} />
                      </Pressable>
                    </View>
                  </View>
                ))}
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

  // Scroll Content
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#0D7B5F', // Green bar from mockup
  },

  // Form Container
  formContainer: {
    gap: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: C.text,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    zIndex: 10,
  },

  // Dropdown Component
  dropdownContainer: {
    width: '45%',
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
  },
  dropdownList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: C.text,
    fontWeight: '600',
  },

  // Log Button
  logBtn: {
    backgroundColor: '#0D7B5F',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logBtnDisabled: {
    opacity: 0.5,
  },
  logBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Logged list
  listContainer: {
    marginTop: 10,
    gap: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  mealCategory: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
});
