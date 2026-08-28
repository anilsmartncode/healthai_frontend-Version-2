/**
 * app/linked-accounts.tsx
 *
 * Linked Accounts and Devices Screen — Matching Prototype v2 (scr-linkedaccounts).
 * Displays connected third-party integrations (Google, Calendar, HealthKit/Google Fit)
 * and active device sessions with remote sign-out capability.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useAuth } from '@/context/AuthContext';
import {
  getActiveSessions,
  revokeSession,
  UserSession,
  LinkedServices,
} from '@/services/sessionsApi';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';

export default function LinkedAccountsScreen() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const { phone } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [services, setServices] = useState<LinkedServices>({
    google_connected: true,
    google_email: 'user@healthai.app',
    calendar_connected: true,
    health_sync_connected: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const storedServices = await AsyncStorage.getItem('@healthai_linked_services');
        if (storedServices) {
          setServices(JSON.parse(storedServices));
        } else if (phone) {
          setServices((prev) => ({
            ...prev,
            google_email: `${phone}@healthai.app`,
          }));
        }

        const activeList = await getActiveSessions();
        setSessions(activeList);
      } catch (e) {
        console.warn('[LinkedAccounts] Load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [phone]);

  const updateServices = async (updated: LinkedServices) => {
    setServices(updated);
    try {
      await AsyncStorage.setItem('@healthai_linked_services', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const handleToggleGoogle = () => {
    if (services.google_connected) {
      Alert.alert(
        'Unlink Google Account',
        'Are you sure you want to unlink your Google account? You may need to use phone OTP to log in next time.',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('unlink_btn'),
            style: 'destructive',
            onPress: () => {
              updateServices({ ...services, google_connected: false });
              Alert.alert('Google disconnected');
            },
          },
        ]
      );
    } else {
      updateServices({ ...services, google_connected: true });
      Alert.alert('Success', 'Google account connected successfully.');
    }
  };

  const handleToggleCalendar = () => {
    const nextState = !services.calendar_connected;
    updateServices({ ...services, calendar_connected: nextState });
    Alert.alert(
      nextState ? 'Calendar Connected' : 'Calendar Disconnected',
      nextState
        ? 'Medication alarms and clinic appointments will sync with your device calendar.'
        : 'Calendar sync has been paused.'
    );
  };

  const handleToggleHealthSync = () => {
    const nextState = !services.health_sync_connected;
    updateServices({ ...services, health_sync_connected: nextState });
    Alert.alert(
      nextState ? 'Health Sync Connected' : 'Health Sync Disconnected',
      nextState
        ? `Connected with ${Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}. Daily activity and heart vitals will sync with HealthAI.`
        : 'Health data sync disconnected.'
    );
  };

  const handleSignOutSession = (session: UserSession) => {
    Alert.alert(
      'Sign Out Device',
      `Are you sure you want to sign out from ${session.device_name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('sign_out_session'),
          style: 'destructive',
          onPress: async () => {
            await revokeSession(session.id);
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
            Alert.alert('Session signed out');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={[styles.backrow, { flexDirection: rowDirection }]}>
          <Pressable
            style={styles.iconbtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons
              name={isRTL ? 'arrow-forward' : 'arrow-back'}
              size={18}
              color={Colors.text}
            />
          </Pressable>
          <Text style={[styles.title, { textAlign }]}>{t('linked_accounts')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section 1: Connected Services */}
        <Text style={[styles.sectionHeading, { textAlign }]}>
          {t('connected_services')}
        </Text>

        <View style={styles.card}>
          {/* Google */}
          <View style={[styles.listItem, { flexDirection: rowDirection }]}>
            <View style={[styles.avatarBox, { backgroundColor: '#F1F5F9' }]}>
              <Text style={styles.avatarLetter}>G</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { textAlign }]}>Google</Text>
              <Text style={[styles.itemSub, { textAlign }]}>
                {services.google_connected
                  ? `${t('connected_status')} • ${services.google_email ?? 'user@gmail.com'}`
                  : t('not_connected_status')}
              </Text>
            </View>
            <Pressable onPress={handleToggleGoogle} hitSlop={8}>
              <Text
                style={[
                  styles.actionLink,
                  services.google_connected ? styles.actionDanger : styles.actionPrimary,
                ]}
              >
                {services.google_connected ? t('unlink_btn') : t('connect_btn')}
              </Text>
            </Pressable>
          </View>

          {/* Calendar */}
          <View style={[styles.listItem, { flexDirection: rowDirection }]}>
            <View style={[styles.avatarBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { textAlign }]}>
                {Platform.OS === 'ios' ? 'Apple Calendar' : 'Google Calendar'}
              </Text>
              <Text style={[styles.itemSub, { textAlign }]}>
                {services.calendar_connected
                  ? t('calendar_sync_desc')
                  : t('not_connected_status')}
              </Text>
            </View>
            <Pressable onPress={handleToggleCalendar} hitSlop={8}>
              <Text
                style={[
                  styles.actionLink,
                  services.calendar_connected ? styles.actionDanger : styles.actionPrimary,
                ]}
              >
                {services.calendar_connected ? t('unlink_btn') : t('connect_btn')}
              </Text>
            </Pressable>
          </View>

          {/* Google Fit / Apple Health */}
          <View style={[styles.listItem, styles.lastItem, { flexDirection: rowDirection }]}>
            <View style={[styles.avatarBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="heart-outline" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { textAlign }]}>
                {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
              </Text>
              <Text style={[styles.itemSub, { textAlign }]}>
                {services.health_sync_connected
                  ? t('health_sync_desc')
                  : t('not_connected_status')}
              </Text>
            </View>
            <Pressable onPress={handleToggleHealthSync} hitSlop={8}>
              <Text
                style={[
                  styles.actionLink,
                  services.health_sync_connected ? styles.actionDanger : styles.actionPrimary,
                ]}
              >
                {services.health_sync_connected ? t('unlink_btn') : t('connect_btn')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Section 2: Active Sessions */}
        <Text style={[styles.sectionHeading, { textAlign, marginTop: 12 }]}>
          {t('active_sessions')}
        </Text>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 16 }} />
          ) : (
            sessions.map((sess, idx) => (
              <View
                key={sess.id}
                style={[
                  styles.sessionRow,
                  idx === sessions.length - 1 && styles.lastItem,
                  { flexDirection: rowDirection },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionDevice, { textAlign }]}>
                    {sess.device_name} • {sess.location}
                  </Text>
                  <Text style={[styles.sessionSub, { textAlign }]}>
                    {sess.platform} • {sess.last_active}
                  </Text>
                </View>

                {sess.is_current ? (
                  <View style={styles.badgeGood}>
                    <Text style={styles.badgeGoodText}>{t('this_device')}</Text>
                  </View>
                ) : (
                  <Pressable onPress={() => handleSignOutSession(sess)} hitSlop={8}>
                    <Text style={[styles.actionLink, styles.actionDanger]}>
                      {t('sign_out_session')}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  topbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
  },
  backrow: {
    alignItems: 'center',
    gap: 12,
  },
  iconbtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E4E8E6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2B2A',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8E6',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  listItem: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
    gap: 12,
  },
  sessionRow: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8E6',
    gap: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B2A',
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  itemSub: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 2,
  },
  actionLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionPrimary: {
    color: Colors.primary,
  },
  actionDanger: {
    color: '#DC2626',
  },
  sessionDevice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2B2A',
  },
  sessionSub: {
    fontSize: 11.5,
    color: '#6B756F',
    marginTop: 2,
  },
  badgeGood: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeGoodText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
});
