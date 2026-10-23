export type UserRole = 'admin' | 'collab' | 'user';

export type ThemeMode = 'dark' | 'light' | 'bw';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL: string;
  role: UserRole;
  bio?: string;
  company?: string;
  provider: 'google' | 'phone' | 'email' | 'demo';
  createdAt?: string;
}

export interface OrganizerProfile {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  avatar: string;
  coverImage: string;
  verified: boolean;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  eventsCount: number;
}

export interface EventLocation {
  lat: number;
  lng: number;
  venueName: string;
  address: string;
  city: string;
}

export interface EventItem {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  date: string;
  time: string;
  formattedDateBadge: string;
  venue: string;
  address: string;
  location: EventLocation;
  heroImage: string;
  videoStoryUrl?: string;
  totalCapacity: number;
  basePrice: number;
  currency: string;
  isFeaturedToday?: boolean;
  organizer: {
    id: string;
    name: string;
    verified: boolean;
    avatar: string;
  };
}

export type TicketStatus = 'valid' | 'used' | 'cancelled';
export type TicketTier = 'General' | 'VIP' | 'Backstage' | 'Mesa VIP';

export interface Ticket {
  id: string;
  eventId: string;
  folio: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  tier: TicketTier;
  price: number;
  status: TicketStatus;
  issuedAt: string;
  usedAt?: string;
  assignedWristbandFolio?: string;
  qrPayload: string;
  seatInfo?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  pin: string;
  status: 'active' | 'inactive';
  checkinsCount: number;
  assignedGate: string;
  avatar: string;
  lastActive: string;
}

export type WristbandStatus = 'approved' | 'suspicious' | 'duplicate_flagged';

export interface WristbandVerification {
  id: string;
  eventId: string;
  folio: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  photoUrl: string;
  photoHash: string;
  timestamp: string;
  formattedDateTime: string;
  location: {
    latitude: number;
    longitude: number;
    venueName: string;
    accuracyMeters?: number;
  };
  validatedBy: {
    collabId: string;
    collabName: string;
    roleTitle: string;
  };
  qrData: string;
  status: WristbandStatus;
  flaggedReason?: string;
  accessGate: string;
  ticketTier?: TicketTier;
}

export interface VipTable {
  id: string;
  eventId: string;
  tableNumber: string;
  zone: string;
  tier: string;
  seats: number;
  price: number;
  status: 'available' | 'reserved' | 'occupied';
  reservedBy?: string;
}
