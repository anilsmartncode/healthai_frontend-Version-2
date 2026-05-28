import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '@/utils/storage';

interface AuthState {
  token: string | null;
  phone: string | null;
  signIn: (token: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  ready: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await storage.get<string>('token');
      const p = await storage.get<string>('phone');
      setToken(t);
      setPhone(p);
      setReady(true);
    })();
  }, []);

  const signIn = async (t: string, p: string) => {
    await storage.set('token', t);
    await storage.set('phone', p);
    setToken(t);
    setPhone(p);
  };
  const signOut = async () => {
    await storage.remove('token');
    await storage.remove('phone');
    setToken(null);
    setPhone(null);
  };

  return (
    <AuthContext.Provider value={{ token, phone, signIn, signOut, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
