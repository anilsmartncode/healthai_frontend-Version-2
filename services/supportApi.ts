/**
 * services/supportApi.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Support ticket service matching Prototype v2 (scr-contactsupport).
 * 
 * Provides:
 *   • submitTicket: Creates a support ticket with optional attachment.
 *   • getTickets: Retrieves tickets from backend with local AsyncStorage fallback.
 *   • Ticket type contracts for backend API integration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g. "SP-2291"
  subject: string;
  category: string;
  description: string;
  status: TicketStatus;
  attachmentUri?: string | null;
  createdAt: string;
  updatedAt?: string;
  response?: string;
}

export interface CreateTicketPayload {
  subject: string;
  category: string;
  description: string;
  attachmentUri?: string | null;
}

const STORAGE_KEY = '@healthai_support_tickets';

/**
 * Get all support tickets.
 * Merges backend tickets (if available) with locally cached tickets.
 */
export async function getSupportTickets(): Promise<SupportTicket[]> {
  let localTickets: SupportTicket[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: SupportTicket[] = JSON.parse(raw);
      // Filter out any mock/sample tickets that might have been seeded previously
      localTickets = parsed.filter(t => t.id !== 'sample-1' && t.ticketNumber !== 'SP-2291');
      if (localTickets.length !== parsed.length) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localTickets));
      }
    }
  } catch (err) {
    console.warn('[supportApi] Error reading cached tickets:', err);
    localTickets = [];
  }

  // Attempt backend fetch
  try {
    const res = await medicineApiCall<any>(ENDPOINTS.supportTickets, { method: 'GET' });
    const remoteTickets: SupportTicket[] = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.tickets)
      ? res.tickets
      : Array.isArray(res)
      ? res
      : [];

    if (remoteTickets.length > 0) {
      // Merge unique by ticketNumber / id
      const existingIds = new Set(remoteTickets.map(t => t.ticketNumber || t.id));
      const combined = [
        ...remoteTickets,
        ...localTickets.filter(lt => !existingIds.has(lt.ticketNumber || lt.id)),
      ];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
      return combined;
    }
  } catch (err) {
    console.log('[supportApi] Backend GET tickets offline or pending implementation; using local storage.');
  }

  return localTickets;
}

/**
 * Submit a new support ticket.
 * Instantly caches locally and attempts POST to backend.
 */
export async function submitSupportTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newTicket: SupportTicket = {
    id: `local-${Date.now()}`,
    ticketNumber: `SP-${randomNum}`,
    subject: payload.subject || 'Support Request',
    category: payload.category || 'General',
    description: payload.description,
    status: 'OPEN',
    attachmentUri: payload.attachmentUri || null,
    createdAt: new Date().toISOString(),
  };

  // Persist locally first for instant UI response
  try {
    const existing = await getSupportTickets();
    const updated = [newTicket, ...existing.filter(t => t.id !== newTicket.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[supportApi] Error saving ticket locally:', err);
  }

  // Attempt remote POST
  try {
    const bodyPayload = {
      ticket_number: newTicket.ticketNumber,
      subject: newTicket.subject,
      category: newTicket.category,
      description: newTicket.description,
      attachment_url: newTicket.attachmentUri,
    };

    const res = await medicineApiCall<any>(ENDPOINTS.supportTickets, {
      method: 'POST',
      body: bodyPayload,
    });

    if (res?.data?.id || res?.id) {
      newTicket.id = res.data?.id || res.id;
    }
  } catch (err) {
    console.log('[supportApi] Backend POST ticket offline or pending; ticket queued in local cache.');
  }

  return newTicket;
}
