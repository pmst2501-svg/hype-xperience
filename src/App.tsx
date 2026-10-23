import React, { useState, useEffect } from 'react';
import {
  UserRole,
  ThemeMode,
  UserProfile,
  EventItem,
  Ticket,
  Collaborator,
  WristbandVerification,
  VipTable,
  OrganizerProfile,
} from './types/ticket';
import {
  INITIAL_EVENTS,
  INITIAL_STAFF,
  INITIAL_TICKETS,
  INITIAL_WRISTBANDS,
  INITIAL_TABLES,
  INITIAL_ORGANIZER,
} from './data/mockData';
import { Header } from './components/Header';
import { Hero916Banner } from './components/Hero916Banner';
import { AdminDashboard } from './components/AdminDashboard';
import { CollabPortal } from './components/CollabPortal';
import { AttendeePortal } from './components/AttendeePortal';
import { AccessScreen } from './components/AccessScreen';
import { OrganizerProfileModal } from './components/OrganizerProfileModal';
import { EventStoriesModal } from './components/EventStoriesModal';
import { WristbandCaptureModal } from './components/WristbandCaptureModal';
import { TicketScannerModal } from './components/TicketScannerModal';
import { NewTicketModal } from './components/NewTicketModal';
import { EditEventModal } from './components/EditEventModal';
import { NewCollabModal } from './components/NewCollabModal';
import { AuthSessionModal } from './components/AuthSessionModal';
import { FloatingDock } from './components/FloatingDock';
import { IPhoneShell } from './components/IPhoneShell';
import { LogoLoadingScreen } from './components/LogoLoadingScreen';
import {
  saveWristbandToCloud,
  saveTicketToCloud,
  saveUserProfileToCloud,
  subscribeToAuthChanges,
} from './firebase';

const STORAGE_KEYS = {
  ROLE: 'hype_ticket_role_v2',
  THEME: 'hype_ticket_theme_v2',
  USER_PROFILE: 'hype_ticket_user_profile_v2',
  ADMIN_TAB: 'hype_ticket_admin_tab_v2',
  ACTIVE_STAFF_ID: 'hype_ticket_staff_id_v2',
  ACTIVE_EVENT_ID: 'hype_ticket_active_event_id_v2',
  EVENTS: 'hype_ticket_events_v2',
  STAFF: 'hype_ticket_staff_v2',
  TICKETS: 'hype_ticket_tickets_v2',
  WRISTBANDS: 'hype_ticket_wristbands_v2',
  TABLES: 'hype_ticket_tables_v2',
  ORGANIZER: 'hype_ticket_organizer_v2',
  SHOW_ACCESS_SCREEN: 'hype_ticket_show_access_v2',
};

const INITIAL_USER: UserProfile = {
  uid: 'usr-bush-001',
  displayName: 'Bush Brothers Producciones',
  email: 'contacto@bushbrothers.mx',
  phoneNumber: '+52 55 4912 3048',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  role: 'admin',
  company: 'Bush Brothers Producciones',
  bio: 'Productora y organizador oficial de festivales y eventos masivos',
  provider: 'demo',
  createdAt: new Date().toISOString(),
};

export default function App() {
  // Theme state: dark, light, bw
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark';
  });

  // Minimal logo-only loading screen state
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(true);

  // User session state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // Organizer Profile state (Bush Brothers Producciones)
  const [organizer, setOrganizer] = useState<OrganizerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZER);
      return saved ? JSON.parse(saved) : INITIAL_ORGANIZER;
    } catch {
      return INITIAL_ORGANIZER;
    }
  });

  // Access landing screen toggle (default false so authenticated users enter directly)
  const [showAccessScreen, setShowAccessScreen] = useState<boolean>(false);

  // Role state
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'admin';
  });

  const [adminTab, setAdminTab] = useState<
    'tickets' | 'wristbands' | 'location' | 'calendar' | 'collaborators' | 'tables'
  >(() => {
    return (
      (localStorage.getItem(STORAGE_KEYS.ADMIN_TAB) as any) || 'tickets'
    );
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

  const [wristbands, setWristbands] = useState<WristbandVerification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WRISTBANDS);
      return saved ? JSON.parse(saved) : INITIAL_WRISTBANDS;
    } catch {
      return INITIAL_WRISTBANDS;
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
  const [showWristbandCaptureModal, setShowWristbandCaptureModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showNewCollabModal, setShowNewCollabModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dynamicIslandNotification, setDynamicIslandNotification] = useState<{
    title: string;
    subtitle: string;
    icon?: string;
    type?: 'wristband' | 'ticket' | 'music' | 'info';
  } | null>(null);

  // Apply theme to document element
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-bw', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark' || theme === 'bw') {
      root.classList.add('dark');
    }
  }, [theme]);

  // Initial logo-only loading screen on startup
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  // Enter portal with brief logo-only loading screen
  const handleEnterPortal = (targetRole?: UserRole) => {
    setShowAuthModal(false);
    if (targetRole) {
      setRole(targetRole);
    }
    setIsLoadingScreen(true);
    setShowAccessScreen(false);
    setTimeout(() => {
      setIsLoadingScreen(false);
    }, 650);
  };

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentUser));
  }, [currentUser]);

  // Subscribe to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        if (fbUser.role) {
          setRole(fbUser.role);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
    localStorage.setItem(STORAGE_KEYS.WRISTBANDS, JSON.stringify(wristbands));
  }, [wristbands]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];
  const activeStaff = staff.find((s) => s.id === activeStaffId) || staff[0];

  // Actions
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : prev === 'light' ? 'bw' : 'dark'));
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas restablecer todos los datos a la versión inicial de Bush Brothers Producciones?')) {
      localStorage.clear();
      setRole('admin');
      setTheme('dark');
      setCurrentUser(INITIAL_USER);
      setAdminTab('tickets');
      setOrganizer(INITIAL_ORGANIZER);
      setShowAccessScreen(false);
      setEvents(INITIAL_EVENTS);
      setActiveEventId(INITIAL_EVENTS[0].id);
      setStaff(INITIAL_STAFF);
      setActiveStaffId(INITIAL_STAFF[0].id);
      setTickets(INITIAL_TICKETS);
      setWristbands(INITIAL_WRISTBANDS);
      setTables(INITIAL_TABLES);
    }
  };

  const handleUpdateHeroImage = (imageUrl: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === activeEvent.id ? { ...e, heroImage: imageUrl } : e))
    );
  };

  const handleUpdateVideoUrl = (videoUrl: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === activeEvent.id ? { ...e, videoStoryUrl: videoUrl } : e))
    );
  };

  const handleSaveWristband = (verification: WristbandVerification) => {
    setWristbands((prev) => [verification, ...prev]);
    saveWristbandToCloud(activeEvent.id, verification);
    setDynamicIslandNotification({
      title: 'Brazalete Verificado',
      subtitle: `${verification.guestName || 'Invitado'} · ${verification.folio}`,
      type: 'wristband',
    });
    setStaff((prev) =>
      prev.map((s) =>
        s.id === verification.validatedBy.collabId
          ? { ...s, checkinsCount: s.checkinsCount + 1, lastActive: 'Justo ahora' }
          : s
      )
    );
  };

  // Register client and issued ticket from wristband capture test
  const handleRegisterClientAndTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    saveTicketToCloud(activeEvent.id, newTicket);
    setDynamicIslandNotification({
      title: 'Nuevo Cliente Registrado',
      subtitle: `${newTicket.guestName} · Folio ${newTicket.folio}`,
      type: 'wristband',
    });
  };

  const handleIssueTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    saveTicketToCloud(activeEvent.id, newTicket);
    setDynamicIslandNotification({
      title: 'Boleto Emitido',
      subtitle: `${newTicket.guestName} · ${newTicket.tier.toUpperCase()}`,
      type: 'ticket',
    });
  };

  const handleCheckInTicket = (ticketId: string) => {
    const nowStr = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'used', usedAt: nowStr } : t))
    );
    setDynamicIslandNotification({
      title: 'Acceso Validado',
      subtitle: `Ticket #${ticketId.slice(0, 8)}`,
      type: 'ticket',
    });
  };

  const handleCancelTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'cancelled' } : t))
    );
  };

  const handleAddCollaborator = (newCollab: Collaborator) => {
    setStaff((prev) => [newCollab, ...prev]);
    setActiveStaffId(newCollab.id);
  };

  const handleSaveEvent = (updated: EventItem) => {
    const exists = events.some((e) => e.id === updated.id);
    if (exists) {
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } else {
      setEvents((prev) => [updated, ...prev]);
      setActiveEventId(updated.id);
    }
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

  const handleValidateTicketManual = (code: string) => {
    const clean = code.trim().toUpperCase();
    const found = tickets.find((t) => t.folio.toUpperCase() === clean);
    if (!found) {
      return { success: false, message: `El código "${clean}" no fue encontrado.` };
    }
    if (found.status === 'used') {
      return { success: false, message: `Boleto ya utilizado previamente.`, ticket: found };
    }
    if (found.status === 'cancelled') {
      return { success: false, message: `Boleto cancelado en sistema.`, ticket: found };
    }
    handleCheckInTicket(found.id);
    return {
      success: true,
      message: `¡Acceso Válido! Boleto registrado correctamente.`,
      ticket: found,
    };
  };

  // Render minimal logo-only loading screen
  if (isLoadingScreen) {
    return (
      <div className={`theme-${theme} min-h-screen`}>
        <IPhoneShell
          activeEventTitle={activeEvent.title}
          dynamicIslandNotification={dynamicIslandNotification}
          onClearNotification={() => setDynamicIslandNotification(null)}
          onOpenStoryVideo={() => setShowStoryModal(true)}
          onOpenWristbandTest={() => setShowWristbandCaptureModal(true)}
        >
          <LogoLoadingScreen />
        </IPhoneShell>
      </div>
    );
  }

  // Render full-page Access Landing Screen if open
  if (showAccessScreen) {
    return (
      <div className={`theme-${theme} min-h-screen`}>
        <IPhoneShell
          activeEventTitle={activeEvent.title}
          dynamicIslandNotification={dynamicIslandNotification}
          onClearNotification={() => setDynamicIslandNotification(null)}
          onOpenStoryVideo={() => setShowStoryModal(true)}
          onOpenWristbandTest={() => setShowWristbandCaptureModal(true)}
        >
          <AccessScreen
            organizer={organizer}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onSelectPortal={handleEnterPortal}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
            onOpenAuthSession={() => setShowAuthModal(true)}
          />
        </IPhoneShell>
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
    <div className={`theme-${theme} antialiased min-h-screen flex flex-col selection:bg-white selection:text-black transition-colors duration-200`}>
      <IPhoneShell
        activeEventTitle={activeEvent.title}
        dynamicIslandNotification={dynamicIslandNotification}
        onClearNotification={() => setDynamicIslandNotification(null)}
        onOpenStoryVideo={() => setShowStoryModal(true)}
        onOpenWristbandTest={() => setShowWristbandCaptureModal(true)}
      >
        {/* Top App Header */}
        <Header
          currentRole={role}
          onSelectRole={setRole}
          collaborators={staff}
          activeStaffId={activeStaffId}
          onSelectStaff={setActiveStaffId}
          onResetData={handleResetData}
          organizer={organizer}
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAccessScreen={() => setShowAccessScreen(true)}
          onOpenEditProfile={() => setShowEditProfileModal(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-3 md:px-6 pt-4 pb-28 md:pb-24 flex-1 space-y-6">
        {/* VIEW 1: ADMIN (CREADOR DEL EVENTO / BUSH BROTHERS) */}
        {role === 'admin' && (
          <div className="space-y-6">
            {/* Hero 9:16 responsive banner */}
            <Hero916Banner
              event={activeEvent}
              organizerName={organizer.name}
              onOpenStoryVideo={() => setShowStoryModal(true)}
              onOpenEditModal={() => setShowEditEventModal(true)}
              onOpenNewTicketModal={() => setShowNewTicketModal(true)}
              onOpenEditProfile={() => setShowEditProfileModal(true)}
              onSelectTab={(tab) => setAdminTab(tab)}
              onUpdateHeroImage={handleUpdateHeroImage}
              onUpdateVideoUrl={handleUpdateVideoUrl}
              isAdmin={true}
            />

            {/* Admin Dashboard */}
            <AdminDashboard
              event={activeEvent}
              allEvents={events}
              tickets={tickets}
              collaborators={staff}
              wristbands={wristbands}
              tables={tables}
              activeTab={adminTab}
              onChangeTab={setAdminTab}
              onOpenNewTicketModal={() => setShowNewTicketModal(true)}
              onOpenNewCollabModal={() => setShowNewCollabModal(true)}
              onOpenCaptureModal={() => setShowWristbandCaptureModal(true)}
              onSelectEvent={setActiveEventId}
              onCheckInTicket={handleCheckInTicket}
              onCancelTicket={handleCancelTicket}
            />
          </div>
        )}

        {/* VIEW 2: COLLABORATOR (STAFF ENTRADA / PORTERO) */}
        {role === 'collab' && (
          <div className="space-y-6">
            <Hero916Banner
              event={activeEvent}
              organizerName={organizer.name}
              onOpenStoryVideo={() => setShowStoryModal(true)}
              onOpenEditModal={() => setShowEditEventModal(true)}
              onOpenNewTicketModal={() => setShowNewTicketModal(true)}
              onOpenEditProfile={() => setShowEditProfileModal(true)}
              onSelectTab={(tab) => {
                setRole('admin');
                setAdminTab(tab);
              }}
              onUpdateHeroImage={handleUpdateHeroImage}
              onUpdateVideoUrl={handleUpdateVideoUrl}
              isAdmin={false}
            />

            <CollabPortal
              activeStaff={activeStaff}
              event={activeEvent}
              wristbands={wristbands}
              tickets={tickets}
              onOpenWristbandCapture={() => setShowWristbandCaptureModal(true)}
              onOpenTicketScanner={() => setShowScannerModal(true)}
              onValidateTicketManual={handleValidateTicketManual}
              onOpenAuthSession={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* VIEW 3: ATTENDEE / USER (EXPLORADOR & PERFIL) */}
        {role === 'user' && (
          <div className="space-y-6">
            <AttendeePortal
              events={events}
              activeEvent={activeEvent}
              userTickets={tickets}
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
            />
          </div>
        )}
      </main>

      {/* FLOATING LIQUID GLASS ACTION DOCK */}
      <FloatingDock
        currentRole={role}
        onSelectRole={setRole}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onOpenAuthSession={() => setShowAuthModal(true)}
        onOpenWristbandTest={() => setShowWristbandCaptureModal(true)}
        onOpenStoryVideo={() => setShowStoryModal(true)}
      />
      </IPhoneShell>

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

      <WristbandCaptureModal
        isOpen={showWristbandCaptureModal}
        onClose={() => setShowWristbandCaptureModal(false)}
        activeStaff={activeStaff}
        event={activeEvent}
        existingWristbands={wristbands}
        onSaveWristband={handleSaveWristband}
        onRegisterClientTicket={handleRegisterClientAndTicket}
        onOpenAuthSession={() => setShowAuthModal(true)}
      />

      <TicketScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        tickets={tickets}
        wristbands={wristbands}
        onCheckInTicket={handleCheckInTicket}
      />

      <NewTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        event={activeEvent}
        onIssueTicket={handleIssueTicket}
        isAdmin={role === 'admin'}
      />

      <EditEventModal
        isOpen={showEditEventModal}
        onClose={() => setShowEditEventModal(false)}
        event={activeEvent}
        onSaveEvent={handleSaveEvent}
      />

      <NewCollabModal
        isOpen={showNewCollabModal}
        onClose={() => setShowNewCollabModal(false)}
        onAddCollaborator={handleAddCollaborator}
      />
    </div>
  );
}
