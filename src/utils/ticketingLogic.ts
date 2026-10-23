import type {
  Ticket,
  Collaborator,
  VipTable,
  TicketTier,
  UserRole,
  UserProfile,
  OrganizerProfile,
  StripeOrder,
} from '../types/ticket.ts';

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
 * Simple deterministic hash for storing password credentials in user/collaborator profiles.
 */
export function hashPasswordCredential(rawPassword: string): string {
  const clean = rawPassword.trim();
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `hp_${(hash >>> 0).toString(16)}_${clean.length}`;
}

export interface ZeroRegistrationInput {
  role: UserRole;
  displayName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  photoURL?: string;
  // Producer / Organization specific
  organizationName?: string;
  taxId?: string;
  city?: string;
  instagram?: string;
  website?: string;
  stripeAccountEmail?: string;
  bio?: string;
  // Staff specific
  assignedGate?: string;
  staffRoleTitle?: string;
  pin?: string;
  // Buyer specific
  documentId?: string;
}

export interface ZeroRegistrationResult {
  valid: boolean;
  error?: string;
  userProfile?: UserProfile;
  organizerProfile?: OrganizerProfile;
  collaboratorProfile?: Collaborator;
}

/**
 * Validates and builds complete zero-to-one profiles for Producer ('admin'), Staff ('collab'), or Buyer ('user').
 */
export function buildRegistrationFromZero(
  input: ZeroRegistrationInput,
  nowIso = new Date().toISOString()
): ZeroRegistrationResult {
  const cleanName = (input.displayName || '').trim();
  const cleanEmail = normalizeEmail(input.email);
  const cleanPassword = (input.password || '').trim();
  const cleanPhone = (input.phoneNumber || '').trim();
  const cleanOrgName = (input.organizationName || '').trim();

  if (!cleanName || cleanName.length < 2) {
    return {
      valid: false,
      error: 'Ingresa el nombre completo del titular o representante.',
    };
  }

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      valid: false,
      error: 'Ingresa un correo electrónico válido.',
    };
  }

  if (!cleanPassword || cleanPassword.length < 6) {
    return {
      valid: false,
      error: 'La contraseña debe tener al menos 6 caracteres.',
    };
  }

  if (input.role === 'admin' && !cleanOrgName) {
    return {
      valid: false,
      error: 'Para registrar un Creador de Eventos es obligatorio el Nombre de la Organización / Productora.',
    };
  }

  const uid = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = hashPasswordCredential(cleanPassword);
  const resolvedAvatar =
    (input.photoURL || '').trim() ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanOrgName || cleanName)}`;

  const orgId =
    input.role === 'admin'
      ? `org-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      : undefined;

  const userProfile: UserProfile = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    passwordHash,
    phoneNumber: cleanPhone || undefined,
    photoURL: resolvedAvatar,
    role: input.role,
    company:
      input.role === 'admin'
        ? cleanOrgName
        : input.role === 'collab'
        ? cleanOrgName || 'Staff Operativo Autorizado'
        : 'Comprador Verificado',
    organizationId: orgId,
    taxId: input.taxId?.trim() || undefined,
    city: input.city?.trim() || 'Acapulco, Guerrero',
    instagram: input.instagram?.trim() || undefined,
    website: input.website?.trim() || undefined,
    stripeAccountEmail: input.stripeAccountEmail?.trim() || cleanEmail,
    assignedGate:
      input.role === 'collab'
        ? input.assignedGate?.trim() || 'Acceso Principal Costera'
        : undefined,
    staffRoleTitle:
      input.role === 'collab'
        ? input.staffRoleTitle?.trim() || 'Staff Verificación QR · Puerta'
        : undefined,
    pin: input.role === 'collab' ? input.pin?.trim() || '1234' : undefined,
    documentId: input.documentId?.trim() || undefined,
    bio:
      input.bio?.trim() ||
      (input.role === 'admin'
        ? `Productora Oficial · ${cleanOrgName}`
        : input.role === 'collab'
        ? `Staff de Escaneo QR · ${input.assignedGate || 'Acceso Principal'}`
        : 'Usuario Comprador con Cartera QR Individual'),
    provider: 'email',
    isRegistered: true,
    createdAt: nowIso,
  };

  let organizerProfile: OrganizerProfile | undefined;
  if (input.role === 'admin') {
    organizerProfile = {
      id: orgId!,
      ownerUid: uid,
      name: cleanOrgName,
      tagline: input.bio?.trim() || `Productora Oficial de Eventos · ${input.city?.trim() || 'Acapulco'}`,
      bio:
        input.bio?.trim() ||
        `Organización registrada en Hype Ticket por ${cleanName}. Venta oficial de entradas con QR individual y pagos vía Stripe.`,
      avatar: resolvedAvatar,
      coverImage:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      verified: true,
      email: cleanEmail,
      phone: cleanPhone,
      taxId: input.taxId?.trim() || undefined,
      stripeAccountEmail: input.stripeAccountEmail?.trim() || cleanEmail,
      website: input.website?.trim() || '',
      instagram: input.instagram?.trim() || '',
      eventsCount: 0,
    };
  }

  let collaboratorProfile: Collaborator | undefined;
  if (input.role === 'collab') {
    collaboratorProfile = {
      id: `col-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      uid,
      name: cleanName,
      roleTitle: input.staffRoleTitle?.trim() || 'Staff Verificación QR · Acceso Principal',
      email: cleanEmail,
      phone: cleanPhone || 'Sin teléfono',
      passwordHash,
      pin: input.pin?.trim() || '1234',
      organizationName: cleanOrgName || undefined,
      status: 'active',
      checkinsCount: 0,
      assignedGate: input.assignedGate?.trim() || 'Acceso Principal Costera',
      avatar: resolvedAvatar,
      lastActive: 'Recién registrado',
    };
  }

  return {
    valid: true,
    userProfile,
    organizerProfile,
    collaboratorProfile,
  };
}

/**
 * Authenticates a user by email and password against registered users and staff records.
 */
export function authenticateRegisteredUser(
  users: UserProfile[],
  collaborators: Collaborator[],
  email: string,
  password: string
): { success: boolean; error?: string; user?: UserProfile; collaborator?: Collaborator } {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return {
      success: false,
      error: 'Ingresa tu correo electrónico y contraseña.',
    };
  }

  const expectedHash = hashPasswordCredential(cleanPassword);

  const matchedUser = users.find((u) => normalizeEmail(u.email) === cleanEmail);
  if (matchedUser) {
    if (matchedUser.passwordHash && matchedUser.passwordHash !== expectedHash) {
      return {
        success: false,
        error: 'Contraseña incorrecta para esta cuenta.',
      };
    }
    const matchedCollab = findAuthorizedCollaboratorByContact(
      collaborators,
      matchedUser.email,
      matchedUser.phoneNumber
    );
    return {
      success: true,
      user: { ...matchedUser, isRegistered: true },
      collaborator: matchedCollab,
    };
  }

  // Check if a collaborator was created by the Producer in the Staff panel and is logging in
  const collabOnly = collaborators.find((c) => normalizeEmail(c.email) === cleanEmail);
  if (collabOnly) {
    if (
      collabOnly.passwordHash &&
      collabOnly.passwordHash !== expectedHash &&
      collabOnly.pin !== cleanPassword
    ) {
      return {
        success: false,
        error: 'Contraseña o PIN operativo incorrecto para la cuenta de trabajador.',
      };
    }
    const derivedUser: UserProfile = {
      uid: collabOnly.uid || `usr-${collabOnly.id}`,
      displayName: collabOnly.name,
      email: collabOnly.email,
      passwordHash: collabOnly.passwordHash || expectedHash,
      phoneNumber: collabOnly.phone,
      photoURL: collabOnly.avatar,
      role: 'collab',
      company: collabOnly.organizationName || 'Staff Autorizado',
      assignedGate: collabOnly.assignedGate,
      staffRoleTitle: collabOnly.roleTitle,
      pin: collabOnly.pin,
      bio: `${collabOnly.roleTitle} · ${collabOnly.assignedGate}`,
      provider: 'email',
      isRegistered: true,
      createdAt: new Date().toISOString(),
    };
    return {
      success: true,
      user: derivedUser,
      collaborator: collabOnly,
    };
  }

  return {
    success: false,
    error: 'No encontramos una cuenta registrada con ese correo. Regístrate primero en la pestaña "Crear Cuenta desde 0".',
  };
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
 * Calculates Stripe checkout breakdown (subtotal, Stripe service fee, total in MXN).
 */
export function calculateStripeCheckoutTotals(
  unitPrice: number,
  quantity: number,
  includeServiceFee = true
): {
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
} {
  const cleanQty = Math.max(1, Math.floor(quantity));
  const cleanUnit = Math.max(0, Number(unitPrice) || 0);
  const subtotal = Math.round(cleanUnit * cleanQty);
  // Standard Stripe Mexico processing fee: 3.6% + $3 MXN
  const serviceFee =
    includeServiceFee && subtotal > 0 ? Math.round(subtotal * 0.036 + 3) : 0;
  const totalAmount = subtotal + serviceFee;
  return { subtotal, serviceFee, totalAmount };
}

/**
 * Detects card brand and validates Stripe card details.
 */
export function validateStripeCardDetails(params: {
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardholderName: string;
}): {
  valid: boolean;
  error?: string;
  brand: string;
  last4: string;
} {
  const digits = (params.cardNumber || '').replace(/\D/g, '');
  const brand = digits.startsWith('4')
    ? 'Visa'
    : /^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)
    ? 'Mastercard'
    : /^3[47]/.test(digits)
    ? 'American Express'
    : 'Tarjeta';

  const last4 = digits.slice(-4) || '4242';

  if (digits.length < 13 || digits.length > 19) {
    return {
      valid: false,
      error: 'Ingresa un número de tarjeta válido (16 dígitos).',
      brand,
      last4,
    };
  }

  const expMatch = (params.cardExpiry || '').trim().match(/^(\d{2})\s*\/?\s*(\d{2,4})$/);
  if (!expMatch) {
    return {
      valid: false,
      error: 'Ingresa la fecha de vencimiento en formato MM/AA.',
      brand,
      last4,
    };
  }

  const month = Number(expMatch[1]);
  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'El mes de vencimiento debe estar entre 01 y 12.',
      brand,
      last4,
    };
  }

  const cvcDigits = (params.cardCvc || '').replace(/\D/g, '');
  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    return {
      valid: false,
      error: 'Ingresa el código de seguridad CVC (3 o 4 dígitos).',
      brand,
      last4,
    };
  }

  if (!params.cardholderName || params.cardholderName.trim().length < 2) {
    return {
      valid: false,
      error: 'Ingresa el nombre del titular de la tarjeta.',
      brand,
      last4,
    };
  }

  return {
    valid: true,
    brand,
    last4,
  };
}

/**
 * Creates a StripeOrder and the corresponding individual QR Tickets.
 */
export function buildStripeOrderAndTickets(params: {
  eventId: string;
  eventTitle: string;
  eventCode: string;
  currency?: string;
  buyerUid: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestDocumentId?: string;
  tier: TicketTier;
  unitPrice: number;
  quantity: number;
  paymentMethodType: 'card' | 'apple_pay' | 'spei';
  cardBrand?: string;
  cardLast4?: string;
  paymentIntentId?: string;
  chargeId?: string;
  includeServiceFee?: boolean;
  issuedAt?: string;
}): {
  order: StripeOrder;
  tickets: Ticket[];
} {
  const { subtotal, serviceFee, totalAmount } = calculateStripeCheckoutTotals(
    params.unitPrice,
    params.quantity,
    params.includeServiceFee ?? true
  );

  const nowStr =
    params.issuedAt ||
    new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const paymentIntentId =
    params.paymentIntentId ||
    `pi_3Q${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString().slice(-4)}`;
  const chargeId =
    params.chargeId ||
    `ch_3Q${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const receiptNumber = `STRP-${Math.floor(100000 + Math.random() * 900000)}`;

  const paymentMethodLabel =
    params.paymentMethodType === 'apple_pay'
      ? 'Apple Pay · Stripe Express'
      : params.paymentMethodType === 'spei'
      ? 'SPEI Transferencia Instantánea · Stripe'
      : `${params.cardBrand || 'Visa'} •••• ${params.cardLast4 || '4242'}`;

  const seatLabel =
    params.tier === 'General'
      ? 'Acceso General Playa & Dancefloor'
      : params.tier === 'VIP'
      ? 'Sunbed & Terraza VIP Frente al Mar'
      : params.tier === 'Backstage'
      ? 'Deck Cabina DJ & Barra Premium'
      : 'Cama Balinesa Reservada';

  const tickets: Ticket[] = [];
  const ticketFolios: string[] = [];
  const prefix = (params.eventCode || 'OLJ').split('-')[0].slice(0, 4).toUpperCase() || 'OLJ';

  for (let i = 0; i < params.quantity; i++) {
    const ticketId = `tkt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`;
    const folio = generateTicketFolio(params.tier, prefix);
    ticketFolios.push(folio);

    const holderName =
      params.quantity > 1
        ? `${params.guestName.trim()} (Boleto ${i + 1}/${params.quantity})`
        : params.guestName.trim();

    const qrPayload = generateTicketQrPayload({
      ticketId,
      eventId: params.eventId,
      eventCode: params.eventCode,
      folio,
      guestName: holderName,
      guestEmail: params.guestEmail.trim(),
      tier: params.tier,
      issuedAt: nowStr,
    });

    tickets.push({
      id: ticketId,
      eventId: params.eventId,
      folio,
      guestName: holderName,
      guestEmail: params.guestEmail.trim(),
      guestPhone: params.guestPhone?.trim() || undefined,
      guestDocumentId: params.guestDocumentId?.trim() || undefined,
      buyerUid: params.buyerUid,
      tier: params.tier,
      price: params.unitPrice,
      status: 'valid',
      issuedAt: nowStr,
      qrPayload,
      seatInfo: seatLabel,
      stripePaymentIntentId: paymentIntentId,
      stripeOrderId: orderId,
      paymentMethod: paymentMethodLabel,
      paymentStatus: 'paid',
    });
  }

  const order: StripeOrder = {
    id: orderId,
    paymentIntentId,
    chargeId,
    receiptNumber,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    eventCode: params.eventCode,
    buyerUid: params.buyerUid,
    buyerName: params.guestName.trim(),
    buyerEmail: params.guestEmail.trim(),
    buyerPhone: params.guestPhone?.trim() || undefined,
    tier: params.tier,
    quantity: params.quantity,
    unitPrice: params.unitPrice,
    serviceFee,
    totalAmount: totalAmount || subtotal,
    currency: params.currency || 'MXN',
    paymentMethodType: params.paymentMethodType,
    paymentMethodLabel,
    cardBrand: params.cardBrand,
    cardLast4: params.cardLast4,
    status: 'succeeded',
    ticketFolios,
    createdAt: new Date().toISOString(),
  };

  return { order, tickets };
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

  if (activeEventId && activeEventId !== 'evt-template' && matchedTicket.eventId !== activeEventId) {
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
  const scopedTickets =
    eventId && eventId !== 'evt-template'
      ? tickets.filter((t) => t.eventId === eventId)
      : tickets;
  const scopedTables =
    eventId && eventId !== 'evt-template'
      ? tables.filter((tb) => tb.eventId === eventId)
      : tables;

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
    const matchesEvent =
      !eventId || eventId === 'evt-template' || ticket.eventId === eventId;
    const matchesStatus = status === 'all' || ticket.status === status;
    const matchesQuery =
      !cleanQuery ||
      ticket.guestName.toLowerCase().includes(cleanQuery) ||
      ticket.folio.toLowerCase().includes(cleanQuery) ||
      ticket.tier.toLowerCase().includes(cleanQuery) ||
      (ticket.guestEmail && ticket.guestEmail.toLowerCase().includes(cleanQuery)) ||
      (ticket.guestPhone && ticket.guestPhone.toLowerCase().includes(cleanQuery)) ||
      (ticket.checkedInByName && ticket.checkedInByName.toLowerCase().includes(cleanQuery)) ||
      (ticket.stripePaymentIntentId &&
        ticket.stripePaymentIntentId.toLowerCase().includes(cleanQuery));

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

  return tickets.filter((t) => {
    if (t.status === 'cancelled') return false;
    if (user.uid && t.buyerUid && t.buyerUid === user.uid) return true;
    if (userEmail && normalizeEmail(t.guestEmail) === userEmail) return true;
    if (userPhone && userPhone.length >= 8 && normalizePhone(t.guestPhone) === userPhone)
      return true;
    if (userName && t.guestName.trim().toLowerCase().startsWith(userName)) return true;
    return false;
  });
}
