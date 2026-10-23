import { EventItem, Ticket, Collaborator, VipTable, OrganizerProfile, UserProfile } from '../types/ticket';

/**
 * IDs from legacy demo seed data that must be purged so the platform starts 100% clean from zero.
 */
export const LEGACY_DEMO_IDS = new Set([
  'usr-bush-001',
  'org-bush-brothers',
  'evt-oleaje-2026',
  'evt-oleaje-nye-2026',
  'col-1',
  'col-2',
  'col-3',
  'tkt-001',
  'tkt-002',
  'tkt-003',
  'tkt-004',
  'tkt-005',
  'tkt-006',
  'tbl-01',
  'tbl-02',
  'tbl-03',
  'tbl-04',
]);

export const LEGACY_DEMO_EMAILS = new Set([
  'contacto@bushbrothers.mx',
  'alejandro.bush@bushbrothers.mx',
  'rodrigo.mendoza@hypeticket.com',
  'sofia.albarran@hypeticket.com',
  'mateo.carvajal@hypeticket.com',
  'valeria.c@gmail.com',
  'santi.morales@outlook.com',
  'mariana.f@gmail.com',
  'diego.dv@gmail.com',
  'invitado@hypeticket.com',
]);

/**
 * Clean starting state (Zero demo accounts, zero fake events, zero fake staff, zero fake tickets).
 * Everything registered from now on is persisted in Firebase Firestore and local storage.
 */
export const INITIAL_USER: UserProfile = {
  uid: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'admin',
  company: '',
  bio: '',
  provider: 'email',
  isRegistered: false,
  createdAt: '',
};

export const INITIAL_ORGANIZER: OrganizerProfile = {
  id: '',
  name: '',
  tagline: 'Productora Oficial de Eventos · Oleaje Beach Club Acapulco',
  bio: '',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  verified: true,
  email: '',
  phone: '',
  taxId: '',
  stripeAccountEmail: '',
  website: '',
  instagram: '',
  eventsCount: 0,
};

export const EMPTY_EVENT_TEMPLATE: EventItem = {
  id: 'evt-template',
  title: 'Sin Eventos Publicados Aún',
  code: 'OLEAJE-ACA',
  category: 'Beach Club & Sunset Party',
  description:
    'Aún no se ha cargado ningún evento en la cartelera. Si eres el Creador de Eventos / Productora, haz clic en "+ Publicar Nuevo Evento" para inaugurar la boletera en Oleaje Beach Club Acapulco.',
  date: '2026-11-28',
  time: '17:00',
  formattedDateBadge: 'Próximamente · Oleaje Acapulco',
  venue: 'Oleaje Beach Club · Acapulco Diamante',
  address: 'Blvd. Barra Vieja Km 5.5, Playa Diamante, Acapulco de Juárez, Gro.',
  location: {
    lat: 16.7944,
    lng: -99.8115,
    venueName: 'Oleaje Beach Club · Acapulco',
    address: 'Blvd. Barra Vieja Km 5.5, Zona Diamante, Acapulco, Gro.',
    city: 'Acapulco, Guerrero',
  },
  heroImage:
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
  videoStoryUrl:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  totalCapacity: 600,
  basePrice: 1500,
  currency: 'MXN',
  isFeaturedToday: true,
  organizer: {
    id: 'org-pending',
    name: 'Productora Oficial',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
};

export const INITIAL_EVENTS: EventItem[] = [];
export const INITIAL_STAFF: Collaborator[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_TABLES: VipTable[] = [];
