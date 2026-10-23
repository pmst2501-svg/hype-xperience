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
} from './types/ticket';
import {
  INITIAL_EVENTS,
  INITIAL_STAFF,
  INITIAL_TICKETS,
  INITIAL_TABLES,
  INITIAL_ORGANIZER,
} from './data/mockData';
import {
  validateAndProcessTicketScan,
  findAuthorizedCollaboratorByContact,
  getUserPurchasedTickets,
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
  subscribeToAuthChanges,
  subscribeToEvents,
  subscribeToTickets,
  subscribeToCollaborators,
} from './firebase';

const STORAGE_KEYS = {
  ROLE: 'hype_ticket_role_v3',
  THEME: 'hype_ticket_theme_v3',
  USER_PROFILE: 'hype_ticket_user_profile_v3',
  ADMIN_TAB: 'hype_ticket_admin_tab_v3',
  ACTIVE_STAFF_ID: 'hype_ticket_staff_id_v3',
  ACTIVE_EVENT_ID: 'hype_ticket_active_event_id_v3',
  EVENTS: 'hype_ticket_events_v3',
  STAFF: 'hype_ticket_staff_v3',
  TICKETS: 'hype_ticket_tickets_v3',
  TABLES: 'hype_ticket_tables_v3',
  ORGANIZER: 'hype_ticket_organizer_v3',
  SHOW_ACCESS_SCREEN: 'hype_ticket_show_access_v3',
};

const INITIAL_USER: UserProfile = {
  uid: 'usr-bush-001',
  displayName: 'Bush Brothers Producciones',
  email: 'contacto@bushbrothers.mx',
  phoneNumber: '+52 744 520 8800',
  photoURL:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'admin',
  company: 'Bush Brothers Producciones',
  bio: 'Productora y organizador oficial en Oleaje Beach Club Acapulco',
  provider: 'demo',
  isRegistered: false,
  createdAt: new Date().toISOString(),
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

  const [organizer, setOrganizer] = useState<OrganizerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZER);
      return saved ? JSON.parse(saved) : INITIAL_ORGANIZER;
    } catch {
      return INITIAL_ORGANIZER;
    }
  });

  // Mandatory registration gate on app open unless user already registered or ?autostart=1 is set
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
      ['tickets', 'qrscans', 'collaborators', 'tables', 'location', 'calendar'].includes(saved)
    ) {
      return saved;
    }
    return 'tickets';
  });

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT_ID) || INITIAL_EVENTS[0].id;
  });

  const [staff, setStaff] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF_ID) || INITIAL_STAFF[0].id;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
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
    }, 4000);
    return () => clearTimeout(timer);
  }, [dynamicIslandNotification]);

  // Subscribe to Firebase Auth & Real-Time Firestore Collections
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((fbUser) => {
      if (fbUser) {
        const matchedCollab = findAuthorizedCollaboratorByContact(
          staff,
          fbUser.email,
          fbUser.phoneNumber
        );
        if (matchedCollab) {
          setActiveStaffId(matchedCollab.id);
        }
        setCurrentUser({ ...fbUser, isRegistered: true });
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
              heroImage: ce.heroImage || existing?.heroImage || INITIAL_EVENTS[0].heroImage,
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
            map.set(cc.id, cc);
          }
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubAuth();
      unsubEvents();
      unsubTickets();
      unsubCollabs();
    };
  }, []);

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

  const handleCompleteRegistration = (profile: UserProfile, targetRole: UserRole) => {
    const matchedCollab = findAuthorizedCollaboratorByContact(
      staff,
      profile.email,
      profile.phoneNumber
    );
    if (matchedCollab) {
      setActiveStaffId(matchedCollab.id);
    }
    setCurrentUser(profile);
    saveUserProfileToCloud(profile);
    handleEnterPortal(targetRole);
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentUser));
  }, [currentUser]);

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

  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];
  const activeStaff = staff.find((s) => s.id === activeStaffId) || staff[0];

  // Get tickets owned by current user (or show active event tickets if demo user has none yet)
  const matchedUserTickets = getUserPurchasedTickets(tickets, currentUser);
  const userWalletTickets =
    matchedUserTickets.length > 0
      ? matchedUserTickets
      : tickets.filter((t) => t.status !== 'cancelled');

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : prev === 'light' ? 'bw' : 'dark'));
  };

  const handleResetData = () => {
    localStorage.clear();
    setRole('admin');
    setTheme('dark');
    setCurrentUser({ ...INITIAL_USER, isRegistered: true });
    setAdminTab('tickets');
    setOrganizer(INITIAL_ORGANIZER);
    setShowAccessScreen(false);
    setEvents(INITIAL_EVENTS);
    setActiveEventId(INITIAL_EVENTS[0].id);
    setStaff(INITIAL_STAFF);
    setActiveStaffId(INITIAL_STAFF[0].id);
    setTickets(INITIAL_TICKETS);
    setTables(INITIAL_TABLES);
  };

  const handleUpdateHeroImage = (imageUrl: string) => {
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

  const handleIssueTickets = (newTickets: Ticket[]) => {
    setTickets((prev) => [...newTickets, ...prev]);
    for (const tkt of newTickets) {
      saveTicketToCloud(activeEvent.id, tkt);
    }
    const first = newTickets[0];
    if (first) {
      setDynamicIslandNotification({
        title:
          newTickets.length > 1
            ? `${newTickets.length} QRs Individuales Emitidos`
            : 'QR Individual Emitido',
        subtitle: `${first.guestName} · ${first.folio}`,
        type: 'ticket',
      });
    }
  };

  const handleValidateTicketQr = (rawCode: string) => {
    const result = validateAndProcessTicketScan(
      rawCode,
      tickets,
      activeEvent.id,
      activeStaff
    );

    if (result.success && result.updatedTicket) {
      const updated = result.updatedTicket;
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      saveTicketToCloud(activeEvent.id, updated);

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
          saveTicketToCloud(activeEvent.id, updated);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddCollaborator = (newCollab: Collaborator) => {
    setStaff((prev) => [newCollab, ...prev]);
    setActiveStaffId(newCollab.id);
    saveCollaboratorToCloud(newCollab);
    setDynamicIslandNotification({
      title: 'Colaborador Autorizado',
      subtitle: `${newCollab.name} (${newCollab.assignedGate})`,
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
    const exists = events.some((e) => e.id === updated.id);
    if (exists) {
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      setEvents((prev) => [updated, ...prev]);
      setActiveEventId(updated.id);
    }
    saveEventToCloud(updated);
    setDynamicIslandNotification({
      title: exists ? 'Evento Actualizado en Vivo' : 'Nuevo Evento Publicado',
      subtitle: updated.title,
      type: 'info',
    });
  };

  const handleSaveOrganizer = (updatedOrganizer: OrganizerProfile) => {
    setOrganizer(updatedOrganizer);
    setEvents((prev) =>
      prev.map((evt) => ({
        ...evt,
        organizer: {
          ...evt.organizer,
          id: updatedOrganizer.id,
          name: updatedOrganizer.name,
          avatar: updatedOrganizer.avatar,
          verified: updatedOrganizer.verified,
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
          collaborators={staff}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSelectPortal={handleEnterPortal}
          onCompleteRegistration={handleCompleteRegistration}
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
          onUpdateUser={setCurrentUser}
          onSwitchRole={setRole}
          onEnterApp={handleEnterPortal}
        />
      </div>
    );
  }

  return (
    <div
      className={`theme-${theme} @container antialiased min-h-[100dvh] w-full overflow-x-hidden bg-grid flex flex-col justify-between selection:bg-white selection:text-black transition-colors duration-200`}
    >
      {/* Floating Live Toast Notification (Responsive for all smartphones) */}
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

      {/* Main Content Area — Adaptive across all smartphone & tablet/desktop viewports */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-5 md:px-6 pt-3 sm:pt-5 pb-28 sm:pb-24 flex-1 space-y-5 sm:space-y-6">
        {/* VIEW 1: ADMIN (CREADOR DEL EVENTO / BUSH BROTHERS) */}
        {role === 'admin' && (
          <div className="space-y-5 sm:space-y-6">
            <Hero916Banner
              event={activeEvent}
              organizerName={organizer.name}
              onOpenStoryVideo={() => setShowStoryModal(true)}
              onOpenEditModal={() => {
                setIsCreatingNewEvent(false);
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
              tickets={tickets}
              collaborators={staff}
              tables={tables}
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
              onSelectEvent={setActiveEventId}
              onCheckInTicket={handleCheckInTicketById}
              onCancelTicket={handleCancelTicket}
              onToggleCollaboratorStatus={handleToggleCollaboratorStatus}
              onRemoveCollaborator={handleRemoveCollaborator}
            />
          </div>
        )}

        {/* VIEW 2: COLLABORATOR (SOLO ESCANEO DE QRs VENDIDOS EN TIEMPO REAL) */}
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
              onOpenAuthSession={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* VIEW 3: ATTENDEE / USER (CARTELERA DE CREADORES & MI PERFIL QR INDIVIDUAL) */}
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
              onOpenAuthProfile={() => setShowAuthModal(true)}
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
        onResetData={handleResetData}
      />

      {/* MODALS */}
      <AuthSessionModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
        onSwitchRole={setRole}
        onEnterApp={handleEnterPortal}
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
        onAddCollaborator={handleAddCollaborator}
      />
    </div>
  );
}
