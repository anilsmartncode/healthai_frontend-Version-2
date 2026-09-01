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
  Keyboard,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useGlobalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { Colors, Radius } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';

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

interface ChatInputBarProps {
  context?: 'prescription';
}

export function ChatInputBar({ context }: ChatInputBarProps = {}) {
  const { t, isRTL, textAlign, rowDirection } = useLang();
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [autoDirection, setAutoDirection] = useState<'up' | 'down'>('up');
  const [showPasteBubble, setShowPasteBubble] = useState(false);

  const containerRef = useRef<View>(null);

  // Check if clipboard contains something to paste when input is focused or pressed
  const checkClipboardForBubble = async () => {
    try {
      const hasImg = await Clipboard.hasImageAsync();
      const hasStr = await Clipboard.hasStringAsync();
      if (hasImg || hasStr) {
        setShowPasteBubble(true);
      }
    } catch {
      // ignore
    }
  };

  const params = useGlobalSearchParams();

  useEffect(() => {
    if (params.sharedFileUri) {
      setAttachedFile({
        uri: params.sharedFileUri,
        name: params.sharedFileName || 'Shared_Document',
        mimeType: params.sharedFileMimeType || 'application/pdf',
        size: 0
      });
      // Optionally clear the params to prevent re-attachment on re-renders, 
      // though router.setParams works best inside the route itself.
      router.setParams({ sharedFileUri: undefined, sharedFileName: undefined, sharedFileMimeType: undefined });
    }
  }, [params.sharedFileUri]);

  useEffect(() => {
    if (!input || input.trim().length === 0) {
      setInputHeight(36);
    }
  }, [input]);

  const handlePlusPress = () => {
    if (!showMenu) {
      containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const screenHeight = Dimensions.get('window').height;
        // If element is in the top half of the screen, drop down.
        // If element is in the bottom half, drop up.
        if (pageY < screenHeight / 2) {
          setAutoDirection('down');
        } else {
          setAutoDirection('up');
        }
        setShowMenu(true);
      });
    } else {
      setShowMenu(false);
    }
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

  const scanDoc = async () => {
    setShowMenu(false);
    try {
      const DocumentScanner = require('react-native-document-scanner-plugin').default;
      const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
      });

      if (scannedImages && scannedImages.length > 0) {
        const uri = scannedImages[0];
        setAttachedFile({ uri, name: 'scanned_document.jpg', mimeType: 'image/jpeg', size: 0 });
      }
    } catch (e: any) {
      Alert.alert('Scanner Error', 'Failed to start the document scanner.');
    }
  };

  const pasteClipboard = async () => {
    setShowMenu(false);
    setShowPasteBubble(false);
    try {
      // 1. Check if an image is on the clipboard (e.g. copied from WhatsApp, browser, or gallery)
      const hasImg = await Clipboard.hasImageAsync();
      if (hasImg) {
        const img = await Clipboard.getImageAsync({ format: 'jpeg' });
        if (img && img.data) {
          setAttachedFile({
            uri: `data:image/jpeg;base64,${img.data}`,
            name: `pasted_image_${Date.now().toString().slice(-4)}.jpg`,
            mimeType: 'image/jpeg',
            size: Math.round(img.data.length * 0.75),
          });
          Alert.alert('Pasted', t('paste_success_image'));
          return;
        }
      }

      // 2. Check for copied text, URLs, file paths, or lab report values
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().length > 0) {
        const trimmed = text.trim();
        const lower = trimmed.toLowerCase();

        // Check if the copied string is a file URI or download link
        const isFileUri =
          trimmed.startsWith('file://') ||
          trimmed.startsWith('content://') ||
          ALLOWED_EXTENSIONS.some(ext => lower.endsWith('.' + ext));

        if (isFileUri && (trimmed.startsWith('file://') || trimmed.startsWith('content://') || trimmed.startsWith('http'))) {
          const rawName = trimmed.split('/').pop()?.split('?')[0] || 'pasted_document.pdf';
          const cleanName = decodeURIComponent(rawName);
          const isPdf = cleanName.toLowerCase().endsWith('.pdf');
          setAttachedFile({
            uri: trimmed,
            name: cleanName,
            mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
            size: 0,
          });
          Alert.alert('Pasted', t('paste_success_document'));
          return;
        }

        // It is plain or structured report text
        setInput(prev => (prev ? `${prev}\n${trimmed}` : trimmed));
        Alert.alert('Pasted', t('paste_success_text'));
      } else {
        Alert.alert(t('paste_clipboard_empty'), t('paste_clipboard_empty_sub'));
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
      Alert.alert(t('paste_clipboard_empty'), t('paste_clipboard_empty_sub'));
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
          context: context,
        }
      });
    } else {
      router.push({
        pathname: '/upload',
        params: { prefillText: input.trim(), context: context }
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
      <View
        ref={containerRef}
        style={[styles.inputWrap, { zIndex: showMenu ? 50 : 1 }]}
      >

        {/* Giant invisible backdrop to catch outside taps without a Modal */}
        {showMenu && (
          <Pressable
            style={styles.giantBackdrop}
            onPress={() => setShowMenu(false)}
          />
        )}

        {/* Inline Absolute Menu directly above the plus button */}
        {showMenu && (
          <View style={[
            styles.inlineMenuContainer,
            autoDirection === 'down' ? styles.menuDrop : styles.menuUp
          ]}>
            <Pressable style={styles.menuItem} onPress={pasteClipboard}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="clipboard-outline" size={16} color="#059669" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>{t('paste_report_or_chat')}</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={scanDoc}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="scan-outline" size={16} color="#9333EA" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Scan Document</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={camera}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="camera-outline" size={16} color={Colors.primary} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Camera</Text>
              </View>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={pickImage}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="images-outline" size={16} color="#D97706" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Gallery</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={pickDoc}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="folder-open-outline" size={16} color="#059669" />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Document / Drive</Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* File Pill inside the input wrap */}
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

        {/* Floating "Paste" Callout Bubble above the input bar */}
        {showPasteBubble && (
          <>
            <Pressable
              style={styles.giantBackdrop}
              onPress={() => setShowPasteBubble(false)}
            />
            <View style={styles.pasteBubbleContainer}>
              <Pressable
                style={styles.pasteBubbleBtn}
                onPress={pasteClipboard}
                hitSlop={6}
              >
                <Ionicons name="clipboard" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.pasteBubbleText}>{t('paste_callout') || 'Paste'}</Text>
              </Pressable>
              <View style={styles.pasteBubbleArrow} />
            </View>
          </>
        )}

        <View style={[styles.inputRow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.innerPlusBtn}
            onPress={handlePlusPress}
            onLongPress={pasteClipboard}
            delayLongPress={250}
            hitSlop={8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Attach or long press to paste from WhatsApp"
          >
            <Ionicons name="add" size={24} color={showMenu ? Colors.primary : Colors.textMuted} />
          </Pressable>

          <TextInput
            style={[
              styles.input,
              { height: Math.min(Math.max(36, inputHeight), 76), textAlign }
            ]}
            onFocus={() => {
              checkClipboardForBubble();
            }}
            onPressIn={() => {
              checkClipboardForBubble();
            }}
            onChangeText={(text) => {
              const trimmed = text.trim();
              const lower = trimmed.toLowerCase();
              const isFileUri =
                (trimmed.startsWith('file://') || trimmed.startsWith('content://') || trimmed.startsWith('http')) &&
                ALLOWED_EXTENSIONS.some(ext => lower.endsWith('.' + ext));

              if (isFileUri) {
                const rawName = trimmed.split('/').pop()?.split('?')[0] || 'document.pdf';
                const cleanName = decodeURIComponent(rawName);
                const isPdf = cleanName.toLowerCase().endsWith('.pdf');
                setAttachedFile({
                  uri: trimmed,
                  name: cleanName,
                  mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
                  size: 0,
                });
                setInput('');
                return;
              }
              setInput(text);
            }}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              if (h > 0) setInputHeight(h);
            }}
            placeholder={context === 'prescription' ? t("upload_prescription_placeholder") : t("upload_ask_placeholder")}
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

      </View>
      <Text style={styles.disclaimerText}>{t("ai_disclaimer")}</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    width: '100%',
  },
  pillContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
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
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    lineHeight: 14,
  },
  inputWrap: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingVertical: 6,
    minHeight: 48,
    shadowColor: Colors.text,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 14.5,
    color: Colors.text,
    minHeight: 36,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 8,
  },
  innerPlusBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  innerMicBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    backgroundColor: '#0F766E',
    shadowColor: '#0F766E',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  inlineMenuContainer: {
    position: 'absolute',
    left: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    width: 210,
    zIndex: 100,
  },
  menuUp: {
    bottom: '100%',
    marginBottom: 10,
  },
  menuDrop: {
    top: '100%',
    marginTop: 10,
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
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
  pasteBubbleContainer: {
    position: 'absolute',
    bottom: '100%',
    left: 48,
    marginBottom: 8,
    zIndex: 100,
    alignItems: 'center',
  },
  pasteBubbleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  pasteBubbleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pasteBubbleArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
    marginTop: -1,
  },
});