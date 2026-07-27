/**
 * app/family/geofence-setup.tsx — Geofence Safe-Zone Setup
 * ─────────────────────────────────────────────────────────────────────
 * Configure Home and Office/Institute safe-zone locations with
 * address inputs, coordinate display, SVG map preview, and radius control.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FamilyTopBar } from '@/components/family/FamilyTopBar';
import { useGeofenceSetup } from '@/hooks/useCommute';
import type { GeofenceZone } from '@/services/commuteApi';

// ── Local form state type ───────────────────────────────────────────
interface ZoneForm {
  zone_id: string;
  type: 'home' | 'office';
  label: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
}

const DEFAULT_HOME: ZoneForm = {
  zone_id: 'zone_home_001',
  type: 'home',
  label: 'Home',
  address: '',
  latitude: '',
  longitude: '',
  radius_meters: 150,
};

const DEFAULT_OFFICE: ZoneForm = {
  zone_id: 'zone_office_001',
  type: 'office',
  label: 'Office',
  address: '',
  latitude: '',
  longitude: '',
  radius_meters: 150,
};

// ════════════════════════════════════════════════════════════════════
export default function GeofenceSetupScreen() {
  const insets = useSafeAreaInsets();
  const { id = 'mem2', name = 'Member' } = useLocalSearchParams<{ id: string; name: string }>();
  const { zones, loading, saving, error, save } = useGeofenceSetup(id);

  const [home,   setHome]   = useState<ZoneForm>(DEFAULT_HOME);
  const [office, setOffice] = useState<ZoneForm>(DEFAULT_OFFICE);

  // Populate form from loaded zones
  useEffect(() => {
    const h = zones.find((z) => z.type === 'home');
    const o = zones.find((z) => z.type === 'office');
    if (h) {
      setHome({
        zone_id: h.zone_id,
        type: 'home',
        label: h.label,
        address: h.address,
        latitude: String(h.latitude),
        longitude: String(h.longitude),
        radius_meters: h.radius_meters,
      });
    }
    if (o) {
      setOffice({
        zone_id: o.zone_id,
        type: 'office',
        label: o.label,
        address: o.address,
        latitude: String(o.latitude),
        longitude: String(o.longitude),
        radius_meters: o.radius_meters,
      });
    }
  }, [zones]);

  const handleSave = async () => {
    if (!home.address || !home.latitude || !home.longitude) {
      Alert.alert('Missing Info', 'Please fill in the Home address and coordinates.');
      return;
    }
    if (!office.address || !office.latitude || !office.longitude) {
      Alert.alert('Missing Info', 'Please fill in the Office address and coordinates.');
      return;
    }

    const payload = [home, office].map((z) => ({
      zone_id: z.zone_id,
      type: z.type,
      label: z.label,
      address: z.address,
      latitude: parseFloat(z.latitude),
      longitude: parseFloat(z.longitude),
      radius_meters: z.radius_meters,
    }));

    const ok = await save(payload);
    if (ok) {
      Alert.alert('Success', 'Safe zones saved successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FamilyTopBar
        title="Safe Zone Setup"
        onBack={() => router.back()}
        rightIcon="help-circle-outline"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          {/* ── Intro ──────────────────────────────────────────────── */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text style={{ fontSize: 28 }}>📍</Text>
            </View>
            <Text style={styles.introTitle}>Define Safe Zones</Text>
            <Text style={styles.introSub}>
              Set your Home and Office locations. We'll automatically track arrival & departure events.
            </Text>
          </View>

          {/* ── Home Location Card ─────────────────────────────────── */}
          <LocationCard
            emoji="🏠"
            iconBg="#E8F5F0"
            title="Home"
            subtitle="Primary residence"
            form={home}
            onChange={setHome}
          />

          {/* ── Office Location Card ───────────────────────────────── */}
          <LocationCard
            emoji="🏢"
            iconBg="#E8F0FF"
            title="Office / Institute"
            subtitle="Work or study location"
            form={office}
            onChange={setOffice}
          />

          {/* ── Map Preview Placeholder ────────────────────────────── */}
          <View style={styles.mapPreview}>
            <View style={styles.mapContent}>
              <View style={[styles.mapZone, { borderColor: Colors.accent }]}>
                <Text style={{ fontSize: 16 }}>🏠</Text>
                <Text style={styles.mapZoneLabel}>Home</Text>
              </View>
              <View style={styles.mapPath}>
                <Text style={styles.mapPathDash}>- - - - - - -</Text>
              </View>
              <View style={[styles.mapZone, { borderColor: Colors.info }]}>
                <Text style={{ fontSize: 16 }}>🏢</Text>
                <Text style={styles.mapZoneLabel}>Office</Text>
              </View>
            </View>
            <Text style={styles.mapHint}>150m radius geofence zones</Text>
          </View>

          {/* ── Radius Control ─────────────────────────────────────── */}
          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>Geofence Radius</Text>
            <View style={styles.radiusValue}>
              <Text style={styles.radiusValueText}>150 m</Text>
            </View>
          </View>

          {/* ── Error ──────────────────────────────────────────────── */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Save Button ────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Safe Zones</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Location Card Component ─────────────────────────────────────────
function LocationCard({
  emoji, iconBg, title, subtitle, form, onChange,
}: {
  emoji: string;
  iconBg: string;
  title: string;
  subtitle: string;
  form: ZoneForm;
  onChange: (f: ZoneForm) => void;
}) {
  return (
    <View style={styles.locCard}>
      <View style={styles.locHeader}>
        <View style={[styles.locIcon, { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
        <View>
          <Text style={styles.locTitle}>{title}</Text>
          <Text style={styles.locSub}>{subtitle}</Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>ADDRESS</Text>
      <TextInput
        style={[styles.input, form.address ? styles.inputFilled : null]}
        value={form.address}
        onChangeText={(t) => onChange({ ...form, address: t })}
        placeholder="Enter address..."
        placeholderTextColor={Colors.textMuted}
      />

      <View style={styles.coordRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>LATITUDE</Text>
          <TextInput
            style={[styles.input, form.latitude ? styles.inputFilled : null]}
            value={form.latitude}
            onChangeText={(t) => onChange({ ...form, latitude: t })}
            placeholder="0.0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>LONGITUDE</Text>
          <TextInput
            style={[styles.input, form.longitude ? styles.inputFilled : null]}
            value={form.longitude}
            onChangeText={(t) => onChange({ ...form, longitude: t })}
            placeholder="0.0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#F4F7F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  page:     { padding: 12, paddingBottom: 40 },

  // Intro
  introCard:  { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  introIcon:  { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  introTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
  introSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 18 },

  // Location card
  locCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  locHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  locIcon:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  locTitle:   { fontSize: 14, fontWeight: '700', color: Colors.text },
  locSub:     { fontSize: 11, color: Colors.textMuted },

  // Input
  inputLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  input:      { width: '100%', padding: 10, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, fontSize: 13, color: Colors.text, backgroundColor: '#FAFBFC', marginBottom: 10 },
  inputFilled: { borderColor: Colors.accent, backgroundColor: '#F0FDFA' },
  coordRow:   { flexDirection: 'row', gap: 8 },

  // Map preview
  mapPreview: { backgroundColor: '#E0F2F1', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  mapContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  mapZone:    { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  mapZoneLabel: { fontSize: 9, fontWeight: '700', color: Colors.text, marginTop: 2 },
  mapPath:    { alignItems: 'center' },
  mapPathDash: { fontSize: 10, color: Colors.textMuted, letterSpacing: 2 },
  mapHint:    { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },

  // Radius
  radiusRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  radiusLabel:     { fontSize: 13, fontWeight: '600', color: Colors.text },
  radiusValue:     { backgroundColor: '#E8F5F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  radiusValueText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginBottom: 10 },
  errorText:   { fontSize: 12, color: Colors.danger, flex: 1 },

  // Save
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginTop: 6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
