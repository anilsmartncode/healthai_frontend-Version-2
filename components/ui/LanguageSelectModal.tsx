import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (langCode: string, langName: string) => void;
}

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
];

function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)',
    kn: 'Kannada (ಕನ್ನಡ)',
  };
  return map[code.toLowerCase()] ?? code.toUpperCase();
}

export function LanguageSelectModal({ visible, onClose, onSelect }: Props) {
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>(DEFAULT_LANGUAGES);

  useEffect(() => {
    if (visible) {
      fetchLanguages();
    }
  }, [visible]);

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const res = await api.request<any>(ENDPOINTS.supportedLanguagesPath);
      
      // Defensively parse whatever payload the backend returns
      const rawList = res?.languages ?? res?.data ?? res?.supported_languages ?? res ?? [];
      const list = Array.isArray(rawList) ? rawList : [];

      const parsed = list
        .map((item: any) => {
          if (typeof item === 'string') {
            const code = item.toLowerCase();
            return { code, name: getLanguageName(code) };
          } else if (item && typeof item === 'object') {
            const code = String(item.code ?? item.language_code ?? item.lang ?? '').toLowerCase();
            const name = String(item.name ?? item.language_name ?? item.language ?? getLanguageName(code));
            if (code) return { code, name };
          }
          return null;
        })
        .filter(Boolean) as { code: string; name: string }[];

      if (parsed.length > 0) {
        setLanguages(parsed);
      } else {
        setLanguages(DEFAULT_LANGUAGES);
      }
    } catch (e) {
      console.warn('[LanguageSelectModal] Failed to load supported languages, using fallback defaults:', e);
      setLanguages(DEFAULT_LANGUAGES);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Language</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading languages...</Text>
          </View>
        ) : (
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            style={{ maxHeight: 340 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.optionRow, pressed && { backgroundColor: Colors.surface }]}
                onPress={() => {
                  onSelect(item.code, item.name);
                  onClose();
                }}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="globe-outline" size={18} color={Colors.textMuted} style={{ marginRight: 10 }} />
                  <Text style={styles.optionText}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  loaderWrap: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: Colors.textMuted },
});
