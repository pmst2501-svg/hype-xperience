import React, { useState, useEffect } from 'react';
import {
  UserRole,
  ThemeMode,
  UserProfile,
  EventItem,
  Ticket,
  Collaborator,
  VipTable,
  OrganizerProfile,
  AdminTab,
  StripeOrder,
} from './types/ticket';
import {
  INITIAL_EVENTS,
  INITIAL_STAFF,
  INITIAL_TICKETS,
  INITIAL_TABLES,
  INITIAL_ORGANIZER,
  INITIAL_USER,
  EMPTY_EVENT_TEMPLATE,
  LEGACY_DEMO_IDS,
  LEGACY_DEMO_EMAILS,
} from './data/mockData';
import {
  validateAndProcessTicketScan,
  findAuthorizedCollaboratorByContact,
  getUserPurchasedTickets,
  normalizeEmail,
} from './utils/ticketingLogic';
import { Hero916Banner } from './components/Hero916Banner';
import { AdminDashboard } from './components/AdminDashboard';
import { CollabPortal } from './components/CollabPortal';
import { AttendeePortal } from './components/AttendeePortal';
import { AccessScreen } from './components/AccessScreen';
import { OrganizerProfileModal } from './components/OrganizerProfileModal';
import { EventStoriesModal } from './components/EventStoriesModal';
import { TicketScannerModal } from './components/TicketScannerModal';
import { NewTicketModal } from './components/NewTicketModal';
import { EditEventModal } from './components/EditEventModal';
import { NewCollabModal } from './components/NewCollabModal';
import { AuthSessionModal } from './components/AuthSessionModal';
import { FloatingDock } from './components/FloatingDock';
import { LogoLoadingScreen } from './components/LogoLoadingScreen';
import { CheckCircle2, X } from 'lucide-react';
import {
  saveEventToCloud,
  saveTicketToCloud,
  saveCollaboratorToCloud,
  deleteCollaboratorFromCloud,
  saveUserProfileToCloud,
  saveOrganizerToCloud,
  saveStripeOrderToCloud,
  registerUserWithEmailInCloud,
  subscribeToAuthChanges,
  subscribeToUsers,
  subscribeToOrganizers,
  subscribeToEvents,
  subscribeToTickets,
  subscribeToCollaborators,
  subscribeToStripeOrders,
} from './firebase';

const STORAGE_KEYS = {
  ROLE: 'hype_ticket_role_v5',
  THEME: 'hype_ticket_theme_v5',
  USER_PROFILE: 'hype_ticket_user_profile_v5',
  REGISTERED_USERS: 'hype_ticket_registered_users_v5',
  ADMIN_TAB: 'hype_ticket_admin_tab_v5',
  ACTIVE_STAFF_ID: 'hype_ticket_staff_id_v5',
  ACTIVE_EVENT_ID: 'hype_ticket_active_event_id_v5',
  EVENTS: 'hype_ticket_events_v5',
  STAFF: 'hype_ticket_staff_v5',
  TICKETS: 'hype_ticket_tickets_v5',
  TABLES: 'hype_ticket_tables_v5',
  ORGANIZER: 'hype_ticket_organizer_v5',
  STRIPE_ORDERS: 'hype_ticket_stripe_orders_v5',
  SHOW_ACCESS_SCREEN: 'hype_ticket_show_access_v5',
};

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark';
  });

  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const parsed: UserProfile[] = saved ? JSON.parse(saved) : [];
      return parsed.filter(
        (u) =>
          u &&
          u.uid &&
          !LEGACY_DEMO_IDS.has(u.uid) &&
          !LEGACY_DEMO_EMAILS.has((u.email || '').trim().toLowerCase())
      );
    } catch {
      return [];
    }
  });

  const [organizer, setOrganizer] = useState<OrganizerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZER);
      return saved ? JSON.parse(saved) : INITIAL_ORGANIZER;
    } catch {
      return INITIAL_ORGANIZER;
    }
  });

  const [showAccessScreen, setShowAccessScreen] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return false;
    }
    const savedGate = localStorage.getItem(STORAGE_KEYS.SHOW_ACCESS_SCREEN);
    if (savedGate !== null) {
      return savedGate === 'true';
    }
    return true;
  });

  const [role, setRole] = useState<UserRole>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role') as UserRole | null;
    if (urlRole && ['admin', 'collab', 'user'].includes(urlRole)) {
      return urlRole;
    }
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'admin';
  });

  const [adminTab, setAdminTab] = useState<AdminTab>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_TAB) as AdminTab | null;
    if (
      saved &&
      ['tickets', 'qrscans', 'collaborators', 'stripe', 'tables', 'location', 'calendar'].includes(
        saved
      )
    ) {
      return saved;
    }
    return 'tickets';
  });

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      const parsed: EventItem[] = saved ? JSON.parse(saved) : INITIAL_EVENTS;
      return parsed.filter((e) => e && e.id && !LEGACY_DEMO_IDS.has(e.id));
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT_ID) || '';
  });

  const [staff, setStaff] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      const parsed: Collaborator[] = saved ? JSON.parse(saved) : INITIAL_STAFF;
      return parsed.filter((c) => c && c.id && !LEGACY_DEMO_IDS.has(c.id));
    } catch {
      return INITIAL_STAFF;
    }
  });

  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF_ID) || '';
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      const parsed: Ticket[] = saved ? JSON.parse(saved) : INITIAL_TICKETS;
      return parsed.filter((t) => t && t.id && !LEGACY_DEMO_IDS.has(t.id));
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [tables, setTables] = useState<VipTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [stripeOrders, setStripeOrders] = useState<StripeOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STRIPE_ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [isCreatingNewEvent, setIsCreatingNewEvent] = useState(false);
  const [showNewCollabModal, setShowNewCollabModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dynamicIslandNotification, setDynamicIslandNotification] = useState<{
    title: string;
    subtitle: string;
    icon?: string;
    type?: 'ticket' | 'music' | 'info';
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-bw', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark' || theme === 'bw') {
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('loading') === '1') {
      setIsLoadingScreen(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dynamicIslandNotification) return;
    const timer = setTimeout(() => {
      setDynamicIslandNotification(null);
    }, 4200);
    return () => clearTimeout(timer);
  }, [dynamicIslandNotification]);

  // Subscribe to Real-Time Firestore Collections (Users, Organizers, Events, Tickets, Staff, Stripe Orders)
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((fbUser) => {
      if (fbUser && !LEGACY_DEMO_IDS.has(fbUser.uid)) {
        setCurrentUser({ ...fbUser, isRegistered: true });
      }
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers.length > 0) {
        setRegisteredUsers((prev) => {
          const map = new Map(prev.map((u) => [normalizeEmail(u.email) || u.uid, u]));
          for (const cu of cloudUsers) {
            if (!LEGACY_DEMO_IDS.has(cu.uid)) {
              const key = normalizeEmail(cu.email) || cu.uid;
              const existing = map.get(key);
              map.set(key, {
                ...existing,
                ...cu,
                photoURL: cu.photoURL || existing?.photoURL || INITIAL_USER.photoURL,
              });
            }
          }
          return Array.from(map.values());
        });
      }
    });

    const unsubOrganizers = subscribeToOrganizers((cloudOrgs) => {
      if (cloudOrgs.length > 0) {
        const latestOrg = cloudOrgs[0];
        setOrganizer((prev) => ({
          ...prev,
          ...latestOrg,
          avatar: latestOrg.avatar || prev.avatar || INITIAL_ORGANIZER.avatar,
        }));
      }
    });

    const unsubEvents = subscribeToEvents((cloudEvents) => {
      if (cloudEvents.length > 0) {
        setEvents((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          for (const ce of cloudEvents) {
            const existing = map.get(ce.id);
            map.set(ce.id, {
              ...existing,
              ...ce,
              heroImage: ce.heroImage || existing?.heroImage || EMPTY_EVENT_TEMPLATE.heroImage,
              videoStoryUrl: ce.videoStoryUrl || existing?.videoStoryUrl,
            });
          }
          return Array.from(map.values());
        });
      }
    });

    const unsubTickets = subscribeToTickets((cloudTickets) => {
      if (cloudTickets.length > 0) {
        setTickets((prev) => {
          const map = new Map(prev.map((t) => [t.id, t]));
          for (const ct of cloudTickets) {
            map.set(ct.id, ct);
          }
          return Array.from(map.values());
        });
      }
    });

    const unsubCollabs = subscribeToCollaborators((cloudCollabs) => {
      if (cloudCollabs.length > 0) {
        setStaff((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          for (const cc of cloudCollabs) {
            const existing = map.get(cc.id);
            map.set(cc.id, {
              ...existing,
              ...cc,
              avatar: cc.avatar || existing?.avatar || INITIAL_USER.photoURL,
            });
          }
          return Array.from(map.values());
        });
      }
    });

    const unsubOrders = subscribeToStripeOrders((cloudOrders) => {
      if (cloudOrders.length > 0) {
        setStripeOrders((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]));
          for (const co of cloudOrders) {
            map.set(co.id, co);
          }
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubAuth();
      unsubUsers();
      unsubOrganizers();
      unsubEvents();
      unsubTickets();
      unsubCollabs();
      unsubOrders();
    };
  }, []);

  const upsertRegisteredUser = (profile: UserProfile) => {
    setRegisteredUsers((prev) => {
      const cleanEmail = normalizeEmail(profile.email);
      const filtered = prev.filter(
        (u) => u.uid !== profile.uid && normalizeEmail(u.email) !== cleanEmail
      );
      return [profile, ...filtered];
    });
  };

  const handleEnterPortal = (targetRole?: UserRole) => {
    setShowAuthModal(false);
    if (targetRole) {
      setRole(targetRole);
    }
    setCurrentUser((prev) => ({ ...prev, isRegistered: true }));
    setIsLoadingScreen(true);
    setShowAccessScreen(false);
    setTimeout(() => {
      setIsLoadingScreen(false);
    }, 450);
  };

  const handleCompleteRegistration = async (
    profile: UserProfile,
    targetRole: UserRole,
    rawPassword?: string,
    newOrganizer?: OrganizerProfile,
    newCollaborator?: Collaborator
  ) => {
    setCurrentUser(profile);
    upsertRegisteredUser(profile);

    if (newOrganizer) {
      setOrganizer(newOrganizer);
      saveOrganizerToCloud(newOrganizer);
    }

    if (newCollaborator) {
      setStaff((prev) => [newCollaborator, ...prev]);
      setActiveStaffId(newCollaborator.id);
      saveCollaboratorToCloud(newCollaborator);
    } else {
      const matchedCollab = findAuthorizedCollaboratorByContact(
        staff,
        profile.email,
        profile.phoneNumber
      );
      if (matchedCollab) {
        setActiveStaffId(matchedCollab.id);
      }
    }

    if (rawPassword) {
      registerUserWithEmailInCloud(profile, rawPassword).catch(() => {});
    } else {
      saveUserProfileToCloud(profile);
    }

    handleEnterPortal(targetRole);
    setDynamicIslandNotification({
      title:
        targetRole === 'admin'
          ? `Productora Registrada: ${profile.company}`
          : targetRole === 'collab'
          ? `Cuenta de Trabajador Activa: ${profile.displayName}`
          : `Comprador Registrado: ${profile.displayName}`,
      subtitle: `${profile.email} · Guardado en Firebase`,
      type: 'info',
    });
  };

  const handleSwitchRegisteredUser = (user: UserProfile) => {
    setCurrentUser({ ...user, isRegistered: true });
    upsertRegisteredUser({ ...user, isRegistered: true });
    const matchedCollab = findAuthorizedCollaboratorByContact(
      staff,
      user.email,
      user.phoneNumber
    );
    if (matchedCollab) {
      setActiveStaffId(matchedCollab.id);
    }
    handleEnterPortal(user.role);
    setDynamicIslandNotification({
      title: `Sesión Iniciada: ${user.displayName}`,
      subtitle: `Rol activo: ${
        user.role === 'admin'
          ? 'Productora / Creador'
          : user.role === 'collab'
          ? 'Trabajador / Staff QR'
          : 'Usuario Comprador'
      }`,
      type: 'info',
    });
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORGANIZER, JSON.stringify(organizer));
  }, [organizer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOW_ACCESS_SCREEN, String(showAccessScreen));
  }, [showAccessScreen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_TAB, adminTab);
  }, [adminTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EVENT_ID, activeEventId);
  }, [activeEventId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF_ID, activeStaffId);
  }, [activeStaffId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STRIPE_ORDERS, JSON.stringify(stripeOrders));
  }, [stripeOrders]);

  const activeEvent: EventItem =
    events.find((e) => e.id === activeEventId) ||
    events[0] || {
      ...EMPTY_EVENT_TEMPLATE,
      organizer: {
        id: organizer.id || 'org-pending',
        name: organizer.name || currentUser.company || 'Productora Oficial',
        verified: true,
        avatar: organizer.avatar || currentUser.photoURL,
      },
    };

  const activeStaff: Collaborator | undefined =
    staff.find((s) => s.id === activeStaffId) || staff[0];

  const userWalletTickets = getUserPurchasedTickets(tickets, currentUser);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : prev === 'light' ? 'bw' : 'dark'));
  };

  const handleUpdateHeroImage = (imageUrl: string) => {
    if (events.length === 0) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === activeEvent.id) {
          const updated = { ...e, heroImage: imageUrl };
          saveEventToCloud(updated);
          return updated;
        }
        return e;
      })
    );
    setDynamicIslandNotification({
      title: 'Portada Actualizada en Vivo',
      subtitle: activeEvent.title,
      type: 'info',
    });
  };

  const handleUpdateVideoUrl = (videoUrl: string) => {
    if (events.length === 0) return;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === activeEvent.id) {
          const updated = { ...e, videoStoryUrl: videoUrl };
          saveEventToCloud(updated);
          return updated;
        }
        return e;
      })
    );
    setDynamicIslandNotification({
      title: 'Video 9:16 Cargado',
      subtitle: 'Disponible en Historia del Evento',
      type: 'info',
    });
  };

  const handleIssueTickets = (newTickets: Ticket[], stripeOrder?: StripeOrder) => {
    setTickets((prev) => [...newTickets, ...prev]);
    for (const tkt of newTickets) {
      saveTicketToCloud(activeEvent.id, tkt);
    }
    if (stripeOrder) {
      setStripeOrders((prev) => [stripeOrder, ...prev]);
      saveStripeOrderToCloud(stripeOrder);
    }
    const first = newTickets[0];
    if (first) {
      setDynamicIslandNotification({
        title: stripeOrder
          ? `Pago Stripe Aprobado (${stripeOrder.paymentIntentId.slice(0, 12)}...)`
          : `${newTickets.length} QR Emitido`,
        subtitle: `${first.guestName} · Folio ${first.folio}`,
        type: 'ticket',
      });
    }
  };

  const handleValidateTicketQr = (rawCode: string) => {
    const fallbackStaff = activeStaff || {
      id: currentUser.uid || 'staff-active',
      name: currentUser.displayName || 'Trabajador QR',
      assignedGate: currentUser.assignedGate || 'Acceso Principal Costera',
    };

    const result = validateAndProcessTicketScan(
      rawCode,
      tickets,
      activeEvent.id,
      fallbackStaff
    );

    if (result.success && result.updatedTicket) {
      const updated = result.updatedTicket;
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      saveTicketToCloud(updated.eventId, updated);

      if (activeStaff) {
        setStaff((prev) =>
          prev.map((s) => {
            if (s.id === activeStaff.id) {
              const nextCollab = {
                ...s,
                checkinsCount: s.checkinsCount + 1,
                lastActive: 'Justo ahora',
              };
              saveCollaboratorToCloud(nextCollab);
              return nextCollab;
            }
            return s;
          })
        );
      }

      setDynamicIslandNotification({
        title: 'QR Validado en Puerta',
        subtitle: `${updated.guestName} · ${updated.folio}`,
        type: 'ticket',
      });
    }

    return result;
  };

  const handleCheckInTicketById = (ticketId: string) => {
    const found = tickets.find((t) => t.id === ticketId);
    if (!found) return;
    handleValidateTicketQr(found.qrPayload || found.folio);
  };

  const handleCancelTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated: Ticket = { ...t, status: 'cancelled' };
          saveTicketToCloud(updated.eventId, updated);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddCollaborator = (newCollab: Collaborator, workerProfile: UserProfile) => {
    setStaff((prev) => [newCollab, ...prev]);
    setActiveStaffId(newCollab.id);
    saveCollaboratorToCloud(newCollab);

    upsertRegisteredUser(workerProfile);
    saveUserProfileToCloud(workerProfile);

    setDynamicIslandNotification({
      title: 'Cuenta de Trabajador Registrada',
      subtitle: `${newCollab.name} (${newCollab.email}) · ${newCollab.assignedGate}`,
      type: 'info',
    });
  };

  const handleToggleCollaboratorStatus = (collabId: string) => {
    setStaff((prev) =>
      prev.map((c) => {
        if (c.id === collabId) {
          const nextStatus: 'active' | 'inactive' =
            c.status === 'active' ? 'inactive' : 'active';
          const updated = { ...c, status: nextStatus };
          saveCollaboratorToCloud(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const handleRemoveCollaborator = (collabId: string) => {
    setStaff((prev) => prev.filter((c) => c.id !== collabId));
    deleteCollaboratorFromCloud(collabId);
  };

  const handleSaveEvent = (updated: EventItem) => {
    const enrichedEvent: EventItem = {
      ...updated,
      organizer: {
        id: organizer.id || 'org-1',
        name: organizer.name || currentUser.company || 'Productora Oficial',
        verified: true,
        avatar: organizer.avatar || currentUser.photoURL,
      },
    };
    const exists = events.some((e) => e.id === enrichedEvent.id);
    if (exists) {
      setEvents((prev) => prev.map((e) => (e.id === enrichedEvent.id ? enrichedEvent : e)));
    } else {
      setEvents((prev) => [enrichedEvent, ...prev]);
      setActiveEventId(enrichedEvent.id);
    }
    saveEventToCloud(enrichedEvent);
    setDynamicIslandNotification({
      title: exists ? 'Evento Actualizado en Vivo' : 'Próximo Evento Publicado',
      subtitle: enrichedEvent.title,
      type: 'info',
    });
  };

  const handleSaveOrganizer = (updatedOrganizer: OrganizerProfile) => {
    const withId = {
      ...updatedOrganizer,
      id: updatedOrganizer.id || `org-${Date.now()}`,
    };
    setOrganizer(withId);
    saveOrganizerToCloud(withId);
    setEvents((prev) =>
      prev.map((evt) => ({
        ...evt,
        organizer: {
          ...evt.organizer,
          id: withId.id,
          name: withId.name,
          avatar: withId.avatar,
          verified: withId.verified,
        },
      }))
    );
  };

  if (isLoadingScreen) {
    return (
      <div className={`theme-${theme} min-h-[100dvh] w-full overflow-hidden`}>
        <LogoLoadingScreen />
      </div>
    );
  }

  if (showAccessScreen) {
    return (
      <div className={`theme-${theme} @container min-h-[100dvh] w-full overflow-x-hidden`}>
        <AccessScreen
          organizer={organizer}
          currentUser={currentUser}
          registeredUsers={registeredUsers}
          collaborators={staff}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSelectPortal={handleEnterPortal}
          onCompleteRegistration={handleCompleteRegistration}
          onSwitchRegisteredUser={handleSwitchRegisteredUser}
          onOpenEditProfile={() => setShowEditProfileModal(true)}
          onOpenAuthSession={() => setShowAuthModal(true)}
        />
        <OrganizerProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          organizer={organizer}
          onSaveOrganizer={handleSaveOrganizer}
        />
        <AuthSessionModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
          registeredUsers={registeredUsers}
          onUpdateUser={(u) => {
            setCurrentUser(u);
            upsertRegisteredUser(u);
          }}
          onSwitchRole={setRole}
          onEnterApp={handleEnterPortal}
          onOpenZeroRegistration={() => setShowAccessScreen(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`theme-${theme} @container antialiased min-h-[100dvh] w-full overflow-x-hidden bg-grid flex flex-col justify-between selection:bg-white selection:text-black transition-colors duration-200`}
    >
      {/* Floating Live Toast Notification */}
      {dynamicIslandNotification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md pointer-events-auto animate-in fade-in">
          <div className="liquid-blur rounded-2xl px-4 py-3 border border-emerald-400/35 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {dynamicIslandNotification.title}
                </div>
                <div className="text-[11px] text-neutral-300 truncate">
                  {dynamicIslandNotification.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDynamicIslandNotification(null)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-5 md:px-6 pt-3 sm:pt-5 pb-28 sm:pb-24 flex-1 space-y-5 sm:space-y-6">
        {/* VIEW 1: ADMIN (PRODUCTORA / CREADOR DE EVENTOS) */}
        {role === 'admin' && (
          <div className="space-y-5 sm:space-y-6">
            <Hero916Banner
              event={activeEvent}
              organizerName={organizer.name || currentUser.company || 'Productora Oficial'}
              onOpenStoryVideo={() => setShowStoryModal(true)}
              onOpenEditModal={() => {
                setIsCreatingNewEvent(events.length === 0);
                setShowEditEventModal(true);
              }}
              onOpenNewTicketModal={() => setShowNewTicketModal(true)}
              onOpenEditProfile={() => setShowEditProfileModal(true)}
              onSelectTab={(tab) => setAdminTab(tab)}
              onUpdateHeroImage={handleUpdateHeroImage}
              onUpdateVideoUrl={handleUpdateVideoUrl}
              isAdmin={true}
            />

            <AdminDashboard
              event={activeEvent}
              allEvents={events}
              organizer={organizer}
              tickets={tickets}
              collaborators={staff}
              tables={tables}
              stripeOrders={stripeOrders}
              activeTab={adminTab}
              onChangeTab={setAdminTab}
              onOpenNewTicketModal={() => setShowNewTicketModal(true)}
              onOpenNewCollabModal={() => setShowNewCollabModal(true)}
              onOpenScannerModal={() => setShowScannerModal(true)}
              onOpenEditEventModal={() => {
                setIsCreatingNewEvent(false);
                setShowEditEventModal(true);
              }}
              onOpenCreateEventModal={() => {
                setIsCreatingNewEvent(true);
                setShowEditEventModal(true);
              }}
              onOpenEditOrganizerModal={() => setShowEditProfileModal(true)}
              onSelectEvent={setActiveEventId}
              onCheckInTicket={handleCheckInTicketById}
              onCancelTicket={handleCancelTicket}
              onToggleCollaboratorStatus={handleToggleCollaboratorStatus}
              onRemoveCollaborator={handleRemoveCollaborator}
            />
          </div>
        )}

        {/* VIEW 2: COLLABORATOR / WORKER (SOLO ESCANEO DE QRs VENDIDOS EN TIEMPO REAL) */}
        {role === 'collab' && (
          <div className="space-y-5 sm:space-y-6">
            <CollabPortal
              activeStaff={activeStaff}
              allStaff={staff}
              onSelectStaff={setActiveStaffId}
              event={activeEvent}
              tickets={tickets}
              onOpenTicketScanner={() => setShowScannerModal(true)}
              onValidateTicketQr={handleValidateTicketQr}
              onOpenAuthSession={() => setShowAccessScreen(true)}
            />
          </div>
        )}

        {/* VIEW 3: ATTENDEE / BUYER (CARTELERA DE EVENTOS & COMPRA CON STRIPE) */}
        {role === 'user' && (
          <div className="space-y-5 sm:space-y-6">
            <AttendeePortal
              events={events}
              activeEvent={activeEvent}
              currentUser={currentUser}
              userTickets={userWalletTickets}
              onOpenStoryVideo={() => setShowStoryModal(true)}
              onSelectEvent={setActiveEventId}
              onBuyTicket={(evt) => {
                setActiveEventId(evt.id);
                setShowNewTicketModal(true);
              }}
              onOpenMap={(evt) => {
                setActiveEventId(evt.id);
                setRole('admin');
                setAdminTab('location');
              }}
              onOpenAuthProfile={() => setShowAccessScreen(true)}
            />
          </div>
        )}
      </main>

      {/* UNIFIED FLOATING BOTTOM BAR */}
      <FloatingDock
        currentRole={role}
        onSelectRole={setRole}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        organizer={organizer}
        collaborators={staff}
        activeStaffId={activeStaffId}
        onOpenAuthSession={() => setShowAuthModal(true)}
        onOpenScannerModal={() => setShowScannerModal(true)}
        onOpenStoryVideo={() => setShowStoryModal(true)}
        onOpenAccessScreen={() => setShowAccessScreen(true)}
      />

      {/* MODALS */}
      <AuthSessionModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        registeredUsers={registeredUsers}
        onUpdateUser={(u) => {
          setCurrentUser(u);
          upsertRegisteredUser(u);
        }}
        onSwitchRole={setRole}
        onEnterApp={handleEnterPortal}
        onOpenZeroRegistration={() => setShowAccessScreen(true)}
      />

      <OrganizerProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        organizer={organizer}
        onSaveOrganizer={handleSaveOrganizer}
      />

      <EventStoriesModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        event={activeEvent}
        onBuyTicket={() => {
          setShowStoryModal(false);
          setShowNewTicketModal(true);
        }}
      />

      <TicketScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        tickets={tickets}
        activeEventId={activeEvent.id}
        onValidateTicketQr={handleValidateTicketQr}
      />

      <NewTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        event={activeEvent}
        currentUser={currentUser}
        onIssueTickets={handleIssueTickets}
        isAdmin={role === 'admin'}
      />

      <EditEventModal
        isOpen={showEditEventModal}
        onClose={() => setShowEditEventModal(false)}
        event={activeEvent}
        onSaveEvent={handleSaveEvent}
        isCreatingNew={isCreatingNewEvent}
      />

      <NewCollabModal
        isOpen={showNewCollabModal}
        onClose={() => setShowNewCollabModal(false)}
        organizationName={organizer.name || currentUser.company || 'Productora Oficial'}
        onAddCollaborator={handleAddCollaborator}
      />
    </div>
  );
}
