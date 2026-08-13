import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Text,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors, Radius } from '@/constants/Colors';

const ALLOWED_EXTENSIONS = ['doc', 'docx', 'jpeg', 'jpg', 'pdf', 'png'];

function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function validatePickedFile(name: string): boolean {
  const ext = getExtension(name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    Alert.alert(
      'Unsupported File Type',
      `"${ext ? '.' + ext : 'This file'}" isn't supported. Please choose a JPG, PNG, PDF, DOC, or DOCX file.`,
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

export function ChatInputBar() {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!input || input.trim().length === 0) {
      setInputHeight(36);
    }
  }, [input]);

  const handlePlusPress = () => {
    setShowMenu(!showMenu);
  };

  const camera = async () => {
    setShowMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission Required', 'Please allow camera access.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const name = a.fileName ?? 'photo.jpg';
      if (!validatePickedFile(name)) return;
      setAttachedFile({ uri: a.uri, name, mimeType: a.mimeType ?? 'image/jpeg', size: (a as any).fileSize });
    }
  };

  const pickImage = async () => {
    setShowMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Gallery Permission Required', 'Please allow photo library access.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const name = a.fileName ?? 'report.jpg';
      if (!validatePickedFile(name)) return;
      setAttachedFile({ uri: a.uri, name, mimeType: a.mimeType ?? 'image/jpeg', size: (a as any).fileSize });
    }
  };

  const pickDoc = async () => {
    setShowMenu(false);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      if (!validatePickedFile(a.name)) return;
      setAttachedFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size });
    }
  };

  const handleSend = () => {
    if (!input.trim() && !attachedFile) return;

    if (attachedFile) {
      router.push({
        pathname: '/upload',
        params: {
          fileUri: attachedFile.uri,
          fileName: attachedFile.name,
          mimeType: attachedFile.mimeType,
          prefillText: input.trim(),
        }
      });
    } else {
      router.push({
        pathname: '/upload',
        params: { prefillText: input.trim() }
      });
    }

    setInput('');
    setAttachedFile(null);
  };

  function formatBytes(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const hasInput = input.trim().length > 0 || attachedFile !== null;

  return (
    <View style={styles.container}>
      {/* File Pill */}
      {attachedFile && (
        <View style={styles.pillContainer}>
          <View style={styles.pill}>
            <Ionicons
              name={attachedFile.mimeType?.includes('pdf') ? 'document-text' : 'image'}
              size={18}
              color={Colors.primary}
            />
            <View style={styles.pillTextWrap}>
              <Text style={styles.pillName} numberOfLines={1}>{attachedFile.name}</Text>
              <Text style={styles.pillMeta}>{formatBytes(attachedFile.size)}</Text>
            </View>
            <Pressable onPress={() => setAttachedFile(null)} hitSlop={8} style={styles.pillClose}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.inputWrap, { zIndex: showMenu ? 50 : 1 }]}>
        
        {/* Giant invisible backdrop to catch outside taps without a Modal */}
        {showMenu && (
          <Pressable 
            style={styles.giantBackdrop}
            onPress={() => setShowMenu(false)} 
          />
        )}

        {/* Inline Absolute Menu directly above the plus button */}
        {showMenu && (
          <View style={styles.inlineMenuContainer}>
            <Pressable style={styles.menuItem} onPress={camera}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Camera</Text>
                <Text style={styles.menuItemSubtext}>Take a photo of a document</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={pickImage}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="images-outline" size={20} color="#D97706" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Gallery</Text>
                <Text style={styles.menuItemSubtext}>Choose from your camera roll</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={pickDoc}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="document-outline" size={20} color="#059669" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Document</Text>
                <Text style={styles.menuItemSubtext}>Upload a PDF, DOC, or DOCX</Text>
              </View>
            </Pressable>
          </View>
        )}

        <Pressable style={styles.innerPlusBtn} onPress={handlePlusPress} hitSlop={8}>
          <Ionicons name="add" size={24} color={showMenu ? Colors.primary : Colors.textMuted} />
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
          style={[styles.innerMicBtn, hasInput ? { backgroundColor: Colors.primary } : { backgroundColor: '#F1F5F9' }]} 
          onPress={handleSend}
          disabled={!hasInput}
        >
          <Ionicons name="arrow-up" size={18} color={hasInput ? "#fff" : Colors.textMuted} />
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
  pillContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  pillTextWrap: {
    marginLeft: 10,
    flexShrink: 1,
  },
  pillName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  pillMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pillClose: {
    marginLeft: 10,
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
  inlineMenuContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 250,
    zIndex: 100,
  },
  giantBackdrop: {
    position: 'absolute',
    top: -2000,
    bottom: -2000,
    left: -2000,
    right: -2000,
    zIndex: 90,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  menuItemSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
