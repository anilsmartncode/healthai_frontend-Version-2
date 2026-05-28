export const authService = {
  async sendOtp(phone: string) {
    // TODO: call backend
    return { ok: true, phone };
  },
  async verifyOtp(phone: string, code: string) {
    return { ok: code.length === 6, token: 'mock-token' };
  },
};
