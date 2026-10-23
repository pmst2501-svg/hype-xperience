export type UserRole = 'admin' | 'collab' | 'user';

export type ThemeMode = 'dark' | 'light' | 'bw';

export type AdminTab =
  | 'tickets'
  | 'qrscans'
  | 'collaborators'
  | 'tables'
  | 'location'
  | 'calendar';

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
  isRegistered?: boolean;
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
