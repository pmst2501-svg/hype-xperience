import type { Ticket, Collaborator, VipTable, TicketTier } from '../types/ticket.ts';

/**
 * Normalizes a phone number by stripping all non-digit characters and keeping the last 10 digits
 * so Mexican numbers (+52 744 123 4567 vs 7441234567) match reliably.
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes an email address for case-insensitive matching.
 */
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Finds an active authorized collaborator by matching their registered email or phone number.
 */
export function findAuthorizedCollaboratorByContact(
  collaborators: Collaborator[],
  email?: string,
  phone?: string
): Collaborator | undefined {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  return collaborators.find((collab) => {
    if (collab.status !== 'active') return false;
    const collabEmail = normalizeEmail(collab.email);
    const collabPhone = normalizePhone(collab.phone);

    const emailMatches = cleanEmail.length > 3 && collabEmail === cleanEmail;
    const phoneMatches = cleanPhone.length >= 8 && collabPhone === cleanPhone;

    return emailMatches || phoneMatches;
  });
}

/**
 * Generates a unique ticket folio for Oleaje Beach Club events (e.g., OLJ-4821-VIP)
 */
export function generateTicketFolio(tier: TicketTier, prefix = 'OLJ'): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const tierCode =
    tier === 'General'
      ? 'GEN'
      : tier === 'VIP'
      ? 'VIP'
      : tier === 'Backstage'
      ? 'BCK'
      : 'MESA';
  return `${prefix}-${randomDigits}-${tierCode}`;
}

/**
 * Builds an individual structured JSON QR payload for a single purchased ticket.
 * Each ticket has its own independent QR code (never shared across multiple tickets).
 */
export function generateTicketQrPayload(params: {
  ticketId: string;
  eventId: string;
  eventCode: string;
  folio: string;
  guestName: string;
  guestEmail?: string;
  tier: TicketTier;
  issuedAt: string;
}): string {
  const checksum = Math.abs(
    `${params.ticketId}:${params.folio}:${params.eventId}`
      .split('')
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  )
    .toString(16)
    .slice(0, 8)
    .toUpperCase();

  return JSON.stringify({
    v: 'HYPE_QR_V3',
    ticketId: params.ticketId,
    eventId: params.eventId,
    eventCode: params.eventCode,
    folio: params.folio.trim().toUpperCase(),
    holder: params.guestName.trim(),
    email: params.guestEmail?.trim() || '',
    tier: params.tier,
    issuedAt: params.issuedAt,
    sig: `ACA-${checksum}`,
  });
}

/**
 * Parses either a JSON QR payload, a legacy pipe-delimited QR string, or a manual folio input.
 */
export function parseTicketQrPayload(rawInput: string): {
  folio: string;
  ticketId?: string;
  eventId?: string;
  eventCode?: string;
  isStructuredJson: boolean;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { folio: '', isStructuredJson: false };
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        folio: String(parsed.folio || '').trim().toUpperCase(),
        ticketId: parsed.ticketId ? String(parsed.ticketId) : undefined,
        eventId: parsed.eventId ? String(parsed.eventId) : undefined,
        eventCode: parsed.eventCode ? String(parsed.eventCode) : undefined,
        isStructuredJson: true,
      };
    } catch {
      // Fallback to plain string parsing
    }
  }

  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    return {
      folio: parts[0].trim().toUpperCase(),
      eventCode: parts[2] ? parts[2].trim().toUpperCase() : undefined,
      isStructuredJson: false,
    };
  }

  return {
    folio: trimmed.toUpperCase(),
    isStructuredJson: false,
  };
}

export interface ScanValidationResult {
  success: boolean;
  status: 'valid_checked_in' | 'already_used' | 'cancelled' | 'wrong_event' | 'not_found';
  message: string;
  ticket?: Ticket;
  updatedTicket?: Ticket;
}

/**
 * Validates a scanned QR payload or folio against the event's tickets and returns
 * the atomic check-in transition with collaborator attribution.
 */
export function validateAndProcessTicketScan(
  rawInput: string,
  tickets: Ticket[],
  activeEventId: string,
  collaborator: Pick<Collaborator, 'id' | 'name' | 'assignedGate'>,
  nowTimeStr?: string
): ScanValidationResult {
  const parsed = parseTicketQrPayload(rawInput);
  if (!parsed.folio && !parsed.ticketId) {
    return {
      success: false,
      status: 'not_found',
      message: 'Código QR o folio vacío. Escanea un boleto válido.',
    };
  }

  const matchedTicket = tickets.find((t) => {
    if (parsed.ticketId && t.id === parsed.ticketId) return true;
    if (parsed.folio && t.folio.toUpperCase() === parsed.folio) return true;
    if (t.qrPayload && t.qrPayload.toUpperCase() === rawInput.trim().toUpperCase()) return true;
    return false;
  });

  if (!matchedTicket) {
    return {
      success: false,
      status: 'not_found',
      message: `El código "${parsed.folio || rawInput.trim()}" no existe en el padrón de boletos vendidos.`,
    };
  }

  if (activeEventId && matchedTicket.eventId !== activeEventId) {
    return {
      success: false,
      status: 'wrong_event',
      message: `El boleto ${matchedTicket.folio} pertenece a otro evento distinto al activo.`,
      ticket: matchedTicket,
    };
  }

  if (matchedTicket.status === 'used') {
    return {
      success: false,
      status: 'already_used',
      message: `ALERTA DE REINGRESO: El boleto ${matchedTicket.folio} (${matchedTicket.guestName}) ya fue escaneado a las ${matchedTicket.usedAt || 'previamente'}${matchedTicket.checkedInByName ? ` por ${matchedTicket.checkedInByName}` : ''}.`,
      ticket: matchedTicket,
    };
  }

  if (matchedTicket.status === 'cancelled') {
    return {
      success: false,
      status: 'cancelled',
      message: `ACCESO DENEGADO: El boleto ${matchedTicket.folio} se encuentra CANCELADO.`,
      ticket: matchedTicket,
    };
  }

  const timestamp =
    nowTimeStr ||
    new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const updatedTicket: Ticket = {
    ...matchedTicket,
    status: 'used',
    usedAt: timestamp,
    checkedInByCollabId: collaborator.id,
    checkedInByName: collaborator.name,
    checkedInGate: collaborator.assignedGate,
  };

  return {
    success: true,
    status: 'valid_checked_in',
    message: `¡Acceso Autorizado! ${matchedTicket.guestName} · Zona ${matchedTicket.tier} (${matchedTicket.folio})`,
    ticket: matchedTicket,
    updatedTicket,
  };
}

/**
 * Calculates real-time KPI metrics for the Creator Dashboard & Collaborator Portal.
 */
export function calculateTicketingMetrics(
  tickets: Ticket[],
  tables: VipTable[],
  totalCapacity: number,
  eventId?: string
) {
  const scopedTickets = eventId ? tickets.filter((t) => t.eventId === eventId) : tickets;
  const scopedTables = eventId ? tables.filter((tb) => tb.eventId === eventId) : tables;

  const activeTickets = scopedTickets.filter((t) => t.status !== 'cancelled');
  const ticketsSold = activeTickets.length;
  const ticketsCheckedIn = scopedTickets.filter((t) => t.status === 'used').length;
  const ticketsPending = scopedTickets.filter((t) => t.status === 'valid').length;
  const ticketsCancelled = scopedTickets.filter((t) => t.status === 'cancelled').length;

  const checkinPct = ticketsSold > 0 ? Math.round((ticketsCheckedIn / ticketsSold) * 100) : 0;

  const ticketRevenue = activeTickets.reduce((sum, t) => sum + t.price, 0);
  const tablesRevenue = scopedTables
    .filter((tab) => tab.status !== 'available')
    .reduce((sum, tab) => sum + tab.price, 0);

  const totalRevenue = ticketRevenue + tablesRevenue;
  const capacityPct =
    totalCapacity > 0 ? Math.min(100, Math.round((ticketsSold / totalCapacity) * 100)) : 0;

  return {
    ticketsSold,
    ticketsCheckedIn,
    ticketsPending,
    ticketsCancelled,
    totalEntries: ticketsCheckedIn,
    checkinPct,
    ticketRevenue,
    tablesRevenue,
    totalRevenue,
    capacityPct,
  };
}

/**
 * Filters tickets by search query, status, and optional eventId.
 */
export function filterTickets(
  tickets: Ticket[],
  query: string,
  status: string,
  eventId?: string
): Ticket[] {
  const cleanQuery = query.toLowerCase().trim();
  return tickets.filter((ticket) => {
    const matchesEvent = !eventId || ticket.eventId === eventId;
    const matchesStatus = status === 'all' || ticket.status === status;
    const matchesQuery =
      !cleanQuery ||
      ticket.guestName.toLowerCase().includes(cleanQuery) ||
      ticket.folio.toLowerCase().includes(cleanQuery) ||
      ticket.tier.toLowerCase().includes(cleanQuery) ||
      (ticket.guestEmail && ticket.guestEmail.toLowerCase().includes(cleanQuery)) ||
      (ticket.guestPhone && ticket.guestPhone.toLowerCase().includes(cleanQuery)) ||
      (ticket.checkedInByName && ticket.checkedInByName.toLowerCase().includes(cleanQuery));

    return matchesEvent && matchesStatus && matchesQuery;
  });
}

/**
 * Filters tickets belonging to the currently logged-in user (by UID, email, or phone)
 */
export function getUserPurchasedTickets(
  tickets: Ticket[],
  user: { uid?: string; email?: string; phoneNumber?: string; displayName?: string }
): Ticket[] {
  const userEmail = normalizeEmail(user.email);
  const userPhone = normalizePhone(user.phoneNumber);
  const userName = (user.displayName || '').trim().toLowerCase();

  const matched = tickets.filter((t) => {
    if (user.uid && t.buyerUid && t.buyerUid === user.uid) return true;
    if (userEmail && normalizeEmail(t.guestEmail) === userEmail) return true;
    if (userPhone && userPhone.length >= 8 && normalizePhone(t.guestPhone) === userPhone) return true;
    if (userName && t.guestName.trim().toLowerCase() === userName) return true;
    return false;
  });

  return matched;
}
