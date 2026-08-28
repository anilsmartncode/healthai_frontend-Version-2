// ─── Mock flag — set false when backend is ready ─────────────────────────────
const USE_MOCK = false; // 🟢 MOCK | 🔴 set false when backend ready

export const authService = {
  async sendOtp(phone: string) {
    if (USE_MOCK) {
      console.log('[authService.sendOtp] 🟢 MOCK — phone:', phone);
      // TODO: POST /api/auth/send-otp  { phone }
      return { ok: true, phone };
    }
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  async verifyOtp(phone: string, code: string) {
    if (USE_MOCK) {
      console.log('[authService.verifyOtp] 🟢 MOCK — code:', code);
      // Validate: must be exactly 4 digits
      const isValid = /^\d{4}$/.test(code.trim());
      if (!isValid) return { ok: false, token: null, error: 'Invalid OTP' };
      // In mock mode, accept 1234 as the test OTP (any 4-digit code in dev)
      return { ok: true, token: 'mock-token-' + phone, error: null };
      // TODO: POST /api/auth/verify-otp  { phone, code }
    }
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return res.json();
  },
};
