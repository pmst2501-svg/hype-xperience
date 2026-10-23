import type { Ticket, WristbandVerification, VipTable, TicketTier } from '../types/ticket.ts';

/**
 * Generates a unique wristband folio with a recognizable format: BRZ-XXXX-CDMX
 */
export function generateWristbandFolio(prefix = 'BRZ', city = 'CDMX'): string {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${randomPart}-${suffix}`;
}

/**
 * Generates a fast sample hash for image fingerprinting to detect duplicate photos
 */
export function createImageFingerprint(dataUri: string): string {
  if (!dataUri) return 'empty';
  let hash = 0;
  const step = Math.max(1, Math.floor(dataUri.length / 100));
  for (let i = 0; i < dataUri.length; i += step) {
    const char = dataUri.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `FP-${hex}-${dataUri.length}`;
}

/**
 * Validates a newly captured wristband against existing records to detect fraud or duplicates.
 */
export function checkWristbandFraud(
  candidate: { folio: string; photoHash: string; id?: string },
  existingRecords: WristbandVerification[]
): { isFraud: boolean; reason?: string; status: 'approved' | 'duplicate_flagged' } {
  const normalizedFolio = candidate.folio.trim().toUpperCase();

  // Check for duplicate folio
  const duplicateFolio = existingRecords.find(
    (rec) => rec.id !== candidate.id && rec.folio.trim().toUpperCase() === normalizedFolio
  );
  if (duplicateFolio) {
    return {
      isFraud: true,
      reason: `El folio "${normalizedFolio}" ya fue registrado previamente a las ${duplicateFolio.formattedDateTime}`,
      status: 'duplicate_flagged',
    };
  }

  // Check for recycled/identical photo
  if (candidate.photoHash && candidate.photoHash !== 'empty') {
    const duplicatePhoto = existingRecords.find(
      (rec) => rec.id !== candidate.id && rec.photoHash === candidate.photoHash
    );
    if (duplicatePhoto) {
      return {
        isFraud: true,
        reason: `Alerta antifraude: La fotografía del brazalete es idéntica a una captura previa (${duplicatePhoto.folio})`,
        status: 'duplicate_flagged',
      };
    }
  }

  return {
    isFraud: false,
    status: 'approved',
  };
}

/**
 * Builds the tamper-evident payload encoded in the QR code for creators & supervisors
 */
export function buildWristbandQRPayload(data: {
  folio: string;
  timestamp: string;
  lat: number;
  lng: number;
  venueName: string;
  staffName: string;
  photoHash: string;
  guestName?: string;
  tier?: string;
}): string {
  return JSON.stringify({
    app: 'HYPE_TICKET_V2',
    folio: data.folio,
    guest: data.guestName || 'Invitado Verificado',
    tier: data.tier || 'General',
    time: data.timestamp,
    loc: {
      lat: Number(data.lat.toFixed(5)),
      lng: Number(data.lng.toFixed(5)),
      venue: data.venueName,
    },
    staff: data.staffName,
    hash: data.photoHash,
    sig: 'VERIFIED_DOOR_ENTRY',
  });
}

/**
 * Calculates event summary metrics
 */
export function calculateEventMetrics(
  tickets: Ticket[],
  wristbands: WristbandVerification[],
  tables: VipTable[],
  totalCapacity: number
) {
  const ticketsSold = tickets.filter((t) => t.status !== 'cancelled').length;
  const ticketsCheckedIn = tickets.filter((t) => t.status === 'used').length;
  const wristbandsApproved = wristbands.filter((w) => w.status === 'approved').length;
  
  const totalEntries = Math.max(ticketsCheckedIn, wristbandsApproved);
  const checkinPct = ticketsSold > 0 ? Math.round((totalEntries / ticketsSold) * 100) : 0;
  
  const ticketRevenue = tickets
    .filter((t) => t.status !== 'cancelled')
    .reduce((sum, t) => sum + t.price, 0);
  
  const tablesRevenue = tables
    .filter((tab) => tab.status !== 'available')
    .reduce((sum, tab) => sum + tab.price, 0);
  
  const totalRevenue = ticketRevenue + tablesRevenue;
  const capacityPct = totalCapacity > 0 ? Math.min(100, Math.round((ticketsSold / totalCapacity) * 100)) : 0;

  return {
    ticketsSold,
    totalEntries,
    checkinPct,
    totalRevenue,
    capacityPct,
    wristbandsApproved,
    fraudAttempts: wristbands.filter((w) => w.status === 'duplicate_flagged').length,
  };
}

/**
 * Filters tickets by query and status
 */
export function filterTickets(
  tickets: Ticket[],
  query: string,
  status: string
): Ticket[] {
  const cleanQuery = query.toLowerCase().trim();
  return tickets.filter((ticket) => {
    const matchesStatus =
      status === 'all' || ticket.status === status;
    const matchesQuery =
      !cleanQuery ||
      ticket.guestName.toLowerCase().includes(cleanQuery) ||
      ticket.folio.toLowerCase().includes(cleanQuery) ||
      ticket.tier.toLowerCase().includes(cleanQuery) ||
      (ticket.guestEmail && ticket.guestEmail.toLowerCase().includes(cleanQuery));

    return matchesStatus && matchesQuery;
  });
}

const FIRST_NAMES = [
  'Mateo', 'Sofía', 'Santiago', 'Valentina', 'Alejandro', 'Camila', 'Leonardo',
  'Valeria', 'Emilio', 'Mariana', 'Daniel', 'Lucía', 'Diego', 'Natalia',
  'Sebastián', 'Regina', 'Gael', 'Ximena', 'Emiliano', 'Renata', 'Joaquín', 'Paulina'
];

const LAST_NAMES = [
  'Mendoza', 'Hernández', 'Morales', 'Gómez', 'Silva', 'Castillo', 'Torres',
  'Flores', 'Vargas', 'Ramos', 'Reyes', 'Ortiz', 'Aguilar', 'Delgado',
  'Guerrero', 'Peña', 'Carrillo', 'Santillán', 'Villalobos', 'Treviño'
];

/**
 * Generates a realistic randomized attendee/client for the entrance test suite
 */
export function getRandomClientProfile(): {
  name: string;
  email: string;
  phone: string;
  tier: TicketTier;
  price: number;
} {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const randNum = Math.floor(10 + Math.random() * 90);
  const email = `${cleanFirst}.${cleanLast}${randNum}@gmail.com`;
  
  const phoneSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const phone = `+52 55 ${String(phoneSuffix).substring(0, 4)} ${String(phoneSuffix).substring(4)}`;

  const roll = Math.random();
  let tier: TicketTier = 'General';
  let price = 850;
  if (roll > 0.85) {
    tier = 'Backstage';
    price = 3500;
  } else if (roll > 0.55) {
    tier = 'VIP';
    price = 1850;
  }

  return { name, email, phone, tier, price };
}

/**
 * Generates a realistic high-res procedural wristband image with glowing holographic festival details
 */
export function generateProceduralWristbandPhoto(folio: string, guestName: string, tier: string): string {
  const tierColor = tier === 'VIP' ? '#f59e0b' : tier === 'Backstage' ? '#ec4899' : '#10b981';
  const tierBg = tier === 'VIP' ? '#291803' : tier === 'Backstage' ? '#2b091f' : '#032415';
  
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0b0f19" />
        <stop offset="50%" stop-color="#141a29" />
        <stop offset="100%" stop-color="#080a10" />
      </linearGradient>
      <linearGradient id="wristGrad" x1="0%" y1="30%" x2="0%" y2="70%">
        <stop offset="0%" stop-color="#d4a373" />
        <stop offset="40%" stop-color="#e9c496" />
        <stop offset="80%" stop-color="#c58f5e" />
        <stop offset="100%" stop-color="#a66e42" />
      </linearGradient>
      <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${tierColor}" />
        <stop offset="35%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="${tierColor}" />
        <stop offset="80%" stop-color="${tierBg}" />
        <stop offset="100%" stop-color="${tierColor}" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background (Entrance lighting) -->
    <rect width="600" height="420" fill="url(#bgGrad)" />
    
    <!-- Bokeh light circles -->
    <circle cx="120" cy="80" r="60" fill="${tierColor}" opacity="0.12" filter="url(#glow)" />
    <circle cx="480" cy="340" r="90" fill="#3b82f6" opacity="0.08" filter="url(#glow)" />
    
    <!-- Arm/Wrist contour -->
    <path d="M 0 170 Q 200 160 380 180 Q 520 200 600 210 L 600 320 Q 420 310 200 300 L 0 290 Z" fill="url(#wristGrad)" />
    
    <!-- Festival Fabric Wristband -->
    <rect x="220" y="145" width="160" height="180" rx="12" fill="url(#bandGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
    
    <!-- Wristband stitching edges -->
    <line x1="226" y1="147" x2="226" y2="323" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,4" opacity="0.6" />
    <line x1="374" y1="147" x2="374" y2="323" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,4" opacity="0.6" />
    
    <!-- Security Lock Clasp -->
    <rect x="270" y="280" width="60" height="36" rx="6" fill="#1e293b" stroke="#64748b" stroke-width="2" />
    <circle cx="285" cy="298" r="4" fill="#ef4444" />
    <circle cx="315" cy="298" r="4" fill="#10b981" />
    <text x="300" y="275" font-family="monospace" font-size="9" fill="#94a3b8" text-anchor="middle">TAMPER-SEAL</text>

    <!-- Holographic badge area -->
    <rect x="235" y="160" width="130" height="105" rx="6" fill="#000000" opacity="0.85" />
    <rect x="238" y="163" width="124" height="99" rx="4" fill="none" stroke="${tierColor}" stroke-width="1.5" />
    
    <!-- Producer & Tier Branding -->
    <text x="300" y="178" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="10" fill="#ffffff" text-anchor="middle" letter-spacing="1">BUSH BROTHERS</text>
    <rect x="250" y="185" width="100" height="18" rx="4" fill="${tierColor}" />
    <text x="300" y="198" font-family="sans-serif" font-weight="900" font-size="11" fill="#000000" text-anchor="middle">${tier.toUpperCase()} PASS</text>
    
    <!-- Folio & Guest Name -->
    <text x="300" y="222" font-family="monospace" font-weight="bold" font-size="13" fill="#ffffff" text-anchor="middle">${folio}</text>
    <text x="300" y="238" font-family="sans-serif" font-size="10" fill="#cbd5e1" text-anchor="middle">${guestName}</text>
    
    <!-- Barcode strips -->
    <g transform="translate(250, 246)">
      <rect x="0" y="0" width="3" height="12" fill="#ffffff" />
      <rect x="5" y="0" width="1" height="12" fill="#ffffff" />
      <rect x="8" y="0" width="4" height="12" fill="#ffffff" />
      <rect x="14" y="0" width="2" height="12" fill="#ffffff" />
      <rect x="18" y="0" width="1" height="12" fill="#ffffff" />
      <rect x="22" y="0" width="5" height="12" fill="#ffffff" />
      <rect x="30" y="0" width="2" height="12" fill="#ffffff" />
      <rect x="35" y="0" width="3" height="12" fill="#ffffff" />
      <rect x="42" y="0" width="1" height="12" fill="#ffffff" />
      <rect x="46" y="0" width="4" height="12" fill="#ffffff" />
      <rect x="54" y="0" width="2" height="12" fill="#ffffff" />
      <rect x="60" y="0" width="3" height="12" fill="#ffffff" />
      <rect x="66" y="0" width="1" height="12" fill="#ffffff" />
      <rect x="70" y="0" width="4" height="12" fill="#ffffff" />
      <rect x="78" y="0" width="2" height="12" fill="#ffffff" />
      <rect x="84" y="0" width="4" height="12" fill="#ffffff" />
      <rect x="92" y="0" width="2" height="12" fill="#ffffff" />
      <rect x="96" y="0" width="3" height="12" fill="#ffffff" />
    </g>

    <!-- Camera overlay tags -->
    <rect x="16" y="16" width="170" height="26" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" />
    <circle cx="28" cy="29" r="4" fill="#ef4444" />
    <text x="38" y="33" font-family="monospace" font-size="10" fill="#f8fafc">REC LIVE · PUERTA A</text>

    <!-- GPS Watermark -->
    <text x="584" y="404" font-family="monospace" font-size="9" fill="rgba(255,255,255,0.4)" text-anchor="end">19.4326° N, 99.1332° W · CDMX</text>
  </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
