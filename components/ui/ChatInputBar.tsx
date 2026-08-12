import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export function ChatInputBar() {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const plusBtnRef = useRef<View>(null);

  useEffect(() => {
    if (!input || input.trim().length === 0) {
      setInputHeight(36);
    }
  }, [input]);

  const handlePlusPress = () => {
    plusBtnRef.current?.measure((x, y, w, h, px, py) => {
      router.push({
        pathname: '/upload',
        params: { btnY: py, btnX: px, btnW: w, btnH: h }
      });
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    router.push({
      pathname: '/upload',
      params: { prefillText: input.trim() }
    });
    setInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Pressable ref={plusBtnRef as any} style={styles.innerPlusBtn} onPress={handlePlusPress} hitSlop={8}>
          <Ionicons name="add" size={24} color={Colors.textMuted} />
        </Pressable>
        
        <TextInput
          style={[
            styles.input,
            { height: Math.min(Math.max(36, inputHeight), 76) }
          ]}
          value={input}
          onChangeText={setInput}
          onContentSizeChange={(e) => {
            const h = e.nativeEvent.contentSize.height;
            if (h > 0) setInputHeight(h);
          }}
          placeholder="Analyze a report or paste text..."
          placeholderTextColor={Colors.textMuted}
          multiline
          scrollEnabled={inputHeight >= 76}
          maxLength={1000}
        />

        <Pressable 
          style={[styles.innerMicBtn, input.trim() ? { backgroundColor: Colors.primary } : { backgroundColor: '#F1F5F9' }]} 
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Ionicons name="arrow-up" size={18} color={input.trim() ? "#fff" : Colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.disclaimerText}>HealthAI acts as an assistant, not a doctor.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    width: '100%',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    lineHeight: 14,
  },
  inputWrap: { 
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 88,
    shadowColor: Colors.text,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    fontSize: 15,
    color: Colors.text,
    minHeight: 36,
  },
  innerPlusBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 16,
  },
  innerMicBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
});
