import { Config } from '@/config/env';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${Config.apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = { request };
