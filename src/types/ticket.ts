export type UserRole = 'admin' | 'collab' | 'user';

export type ThemeMode = 'dark' | 'light' | 'bw';

export type AdminTab =
  | 'tickets'
  | 'qrscans'
  | 'collaborators'
  | 'stripe'
  | 'tables'
  | 'location'
  | 'calendar';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  passwordHash?: string;
  phoneNumber?: string;
  photoURL: string;
  role: UserRole;
  bio?: string;
  company?: string;
  organizationId?: string;
  taxId?: string;
  city?: string;
  instagram?: string;
  website?: string;
  stripeAccountEmail?: string;
  assignedGate?: string;
  staffRoleTitle?: string;
  pin?: string;
  documentId?: string;
  provider: 'google' | 'phone' | 'email';
  isRegistered?: boolean;
  createdAt?: string;
}

export interface OrganizerProfile {
  id: string;
  ownerUid?: string;
  name: string;
  tagline: string;
  bio: string;
  avatar: string;
  coverImage: string;
  verified: boolean;
  email: string;
  phone: string;
  taxId?: string;
  stripeAccountEmail?: string;
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
  guestDocumentId?: string;
  buyerUid?: string;
  tier: TicketTier;
  price: number;
  status: TicketStatus;
  issuedAt: string;
  usedAt?: string;
  checkedInByCollabId?: string;
  checkedInByName?: string;
  checkedInGate?: string;
  qrPayload: string;
  seatInfo?: string;
  stripePaymentIntentId?: string;
  stripeOrderId?: string;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'complimentary' | 'refunded';
}

export interface Collaborator {
  id: string;
  uid?: string;
  name: string;
  roleTitle: string;
  email: string;
  phone: string;
  passwordHash?: string;
  pin: string;
  organizationName?: string;
  status: 'active' | 'inactive';
  checkinsCount: number;
  assignedGate: string;
  avatar: string;
  lastActive: string;
  eventId?: string;
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

export interface StripeOrder {
  id: string;
  paymentIntentId: string;
  chargeId: string;
  receiptNumber: string;
  eventId: string;
  eventTitle: string;
  eventCode: string;
  buyerUid: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  tier: TicketTier;
  quantity: number;
  unitPrice: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  paymentMethodType: 'card' | 'apple_pay' | 'spei';
  paymentMethodLabel: string;
  cardBrand?: string;
  cardLast4?: string;
  status: 'succeeded' | 'pending' | 'failed';
  ticketFolios: string[];
  createdAt: string;
}
