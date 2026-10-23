import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  normalizeEmail,
  findAuthorizedCollaboratorByContact,
  generateTicketQrPayload,
  parseTicketQrPayload,
  validateAndProcessTicketScan,
  calculateTicketingMetrics,
  getUserPurchasedTickets,
  buildRegistrationFromZero,
  authenticateRegisteredUser,
  calculateStripeCheckoutTotals,
  validateStripeCardDetails,
  buildStripeOrderAndTickets,
} from './ticketingLogic.ts';
import type { Ticket, Collaborator, VipTable } from '../types/ticket.ts';

describe('ticketingLogic — Oleaje Beach Club Acapulco & Zero-to-One Onboarding + Stripe', () => {
  const sampleStaff: Collaborator[] = [
    {
      id: 'col-1',
      name: 'Rodrigo Mendoza',
      roleTitle: 'Acceso Principal Costera · Escaneo QR',
      email: 'rodrigo.mendoza@hypeticket.com',
      phone: '+52 744 491 3012',
      pin: '1234',
      status: 'active',
      checkinsCount: 12,
      assignedGate: 'Acceso Principal Costera',
      avatar: 'https://example.com/a.jpg',
      lastActive: 'Ahora',
    },
    {
      id: 'col-2',
      name: 'Sofía Albarrán',
      roleTitle: 'Inactiva',
      email: 'sofia@hypeticket.com',
      phone: '+52 744 832 1190',
      pin: '5678',
      status: 'inactive',
      checkinsCount: 0,
      assignedGate: 'Recepción Sunbeds VIP',
      avatar: 'https://example.com/b.jpg',
      lastActive: 'Ayer',
    },
  ];

  test('normalizePhone and normalizeEmail handle formatting variations cleanly', () => {
    assert.equal(normalizePhone('+52 (744) 491-3012'), '7444913012');
    assert.equal(normalizePhone('7444913012'), '7444913012');
    assert.equal(normalizeEmail('  Rodrigo.Mendoza@HypeTicket.com '), 'rodrigo.mendoza@hypeticket.com');
  });

  test('buildRegistrationFromZero validates and constructs Producer, Staff, and Buyer profiles from scratch', () => {
    // 1. Producer without organizationName fails
    const missingOrg = buildRegistrationFromZero({
      role: 'admin',
      displayName: 'Pedro Productor',
      email: 'pedro@oleaje.mx',
      password: 'password123',
      organizationName: '',
    });
    assert.equal(missingOrg.valid, false);

    // 2. Producer with organizationName succeeds and creates OrganizerProfile
    const producerReg = buildRegistrationFromZero({
      role: 'admin',
      displayName: 'Pedro Productor',
      email: 'pedro@oleaje.mx',
      password: 'password123',
      phoneNumber: '+52 744 500 1122',
      organizationName: 'Oleaje Live Productions',
      taxId: 'OLP260101ACA',
      photoURL: 'https://example.com/logo.png',
    });
    assert.equal(producerReg.valid, true);
    assert.equal(producerReg.userProfile?.role, 'admin');
    assert.equal(producerReg.userProfile?.company, 'Oleaje Live Productions');
    assert.equal(producerReg.organizerProfile?.name, 'Oleaje Live Productions');

    // 3. Staff registration creates both UserProfile and Collaborator
    const staffReg = buildRegistrationFromZero({
      role: 'collab',
      displayName: 'Luis Puerta',
      email: 'luis.staff@oleaje.mx',
      password: 'staffpassword',
      phoneNumber: '+52 744 900 8877',
      organizationName: 'Oleaje Live Productions',
      assignedGate: 'Acceso Playa Diamante',
      staffRoleTitle: 'Verificador QR Puerta',
      pin: '7788',
    });
    assert.equal(staffReg.valid, true);
    assert.equal(staffReg.userProfile?.role, 'collab');
    assert.equal(staffReg.collaboratorProfile?.assignedGate, 'Acceso Playa Diamante');
    assert.equal(staffReg.collaboratorProfile?.pin, '7788');

    // 4. Buyer registration creates UserProfile with documentId
    const buyerReg = buildRegistrationFromZero({
      role: 'user',
      displayName: 'Ana Compradora',
      email: 'ana@comprador.mx',
      password: 'buyerpassword',
      phoneNumber: '+52 55 1234 5678',
      documentId: 'INE-998877',
    });
    assert.equal(buyerReg.valid, true);
    assert.equal(buyerReg.userProfile?.role, 'user');
    assert.equal(buyerReg.userProfile?.documentId, 'INE-998877');

    // 5. Authenticate registered users with email and password
    const registeredUsers = [
      producerReg.userProfile!,
      staffReg.userProfile!,
      buyerReg.userProfile!,
    ];
    const collabs = [staffReg.collaboratorProfile!];

    const loginOk = authenticateRegisteredUser(
      registeredUsers,
      collabs,
      'pedro@oleaje.mx',
      'password123'
    );
    assert.equal(loginOk.success, true);
    assert.equal(loginOk.user?.company, 'Oleaje Live Productions');

    const loginWrongPass = authenticateRegisteredUser(
      registeredUsers,
      collabs,
      'pedro@oleaje.mx',
      'wrongpass'
    );
    assert.equal(loginWrongPass.success, false);
  });

  test('Stripe checkout calculations, card validation, and order+QR ticket generation work accurately', () => {
    const totals = calculateStripeCheckoutTotals(1500, 2, true);
    assert.equal(totals.subtotal, 3000);
    assert.ok(totals.serviceFee > 0);
    assert.equal(totals.totalAmount, totals.subtotal + totals.serviceFee);

    const cardCheck = validateStripeCardDetails({
      cardNumber: '4242 4242 4242 4242',
      cardExpiry: '12/28',
      cardCvc: '424',
      cardholderName: 'Ana Compradora',
    });
    assert.equal(cardCheck.valid, true);
    assert.equal(cardCheck.brand, 'Visa');
    assert.equal(cardCheck.last4, '4242');

    const { order, tickets } = buildStripeOrderAndTickets({
      eventId: 'evt-acapulco-1',
      eventTitle: 'Sunset Session Oleaje',
      eventCode: 'OLEAJE-01',
      buyerUid: 'usr-buyer-1',
      guestName: 'Ana Compradora',
      guestEmail: 'ana@comprador.mx',
      guestPhone: '+52 55 1234 5678',
      tier: 'VIP',
      unitPrice: 2500,
      quantity: 2,
      paymentMethodType: 'card',
      cardBrand: 'Visa',
      cardLast4: '4242',
    });

    assert.equal(order.status, 'succeeded');
    assert.equal(order.quantity, 2);
    assert.equal(tickets.length, 2);
    assert.notEqual(tickets[0].folio, tickets[1].folio);
    assert.equal(tickets[0].stripePaymentIntentId, order.paymentIntentId);
    assert.equal(tickets[0].paymentStatus, 'paid');
  });

  test('findAuthorizedCollaboratorByContact matches active collaborators by email or phone and ignores inactive ones', () => {
    const byEmail = findAuthorizedCollaboratorByContact(
      sampleStaff,
      'RODRIGO.MENDOZA@hypeticket.com',
      ''
    );
    assert.ok(byEmail);
    assert.equal(byEmail.id, 'col-1');

    const byPhone = findAuthorizedCollaboratorByContact(sampleStaff, '', '744 491 3012');
    assert.ok(byPhone);
    assert.equal(byPhone.id, 'col-1');

    const inactiveMatch = findAuthorizedCollaboratorByContact(
      sampleStaff,
      'sofia@hypeticket.com',
      '+52 744 832 1190'
    );
    assert.equal(inactiveMatch, undefined);
  });

  test('generateTicketQrPayload and parseTicketQrPayload round-trip individual ticket data', () => {
    const payload = generateTicketQrPayload({
      ticketId: 'tkt-aca-101',
      eventId: 'evt-oleaje-2026',
      eventCode: 'OLEAJE-ACA-26',
      folio: 'OLJ-9901-VIP',
      guestName: 'Valeria Cárdenas',
      guestEmail: 'valeria@gmail.com',
      tier: 'VIP',
      issuedAt: '2026-10-20 18:00',
    });

    const parsed = parseTicketQrPayload(payload);
    assert.equal(parsed.isStructuredJson, true);
    assert.equal(parsed.ticketId, 'tkt-aca-101');
    assert.equal(parsed.eventId, 'evt-oleaje-2026');
    assert.equal(parsed.folio, 'OLJ-9901-VIP');
  });

  test('validateAndProcessTicketScan approves valid ticket once and blocks replay/already-used or cancelled tickets', () => {
    const validQr = generateTicketQrPayload({
      ticketId: 'tkt-1',
      eventId: 'evt-oleaje-2026',
      eventCode: 'OLEAJE-ACA-26',
      folio: 'OLJ-1001-GEN',
      guestName: 'Camila Navarro',
      tier: 'General',
      issuedAt: '2026-10-20',
    });

    const tickets: Ticket[] = [
      {
        id: 'tkt-1',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-1001-GEN',
        guestName: 'Camila Navarro',
        guestEmail: 'camila@gmail.com',
        tier: 'General',
        price: 1450,
        status: 'valid',
        issuedAt: '2026-10-20',
        qrPayload: validQr,
      },
      {
        id: 'tkt-2',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-1002-VIP',
        guestName: 'Santiago Morales',
        guestEmail: 'santi@gmail.com',
        tier: 'VIP',
        price: 2800,
        status: 'used',
        issuedAt: '2026-10-20',
        usedAt: '21:15:00',
        checkedInByName: 'Rodrigo Mendoza',
        qrPayload: 'OLJ-1002-VIP|SANTIAGO|OLEAJE-ACA-26|USED',
      },
      {
        id: 'tkt-3',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-1003-GEN',
        guestName: 'Diego Del Valle',
        guestEmail: 'diego@gmail.com',
        tier: 'General',
        price: 1450,
        status: 'cancelled',
        issuedAt: '2026-10-20',
        qrPayload: 'OLJ-1003-GEN|DIEGO|OLEAJE-ACA-26|CANCELLED',
      },
    ];

    const firstScan = validateAndProcessTicketScan(
      validQr,
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0],
      '22:05:10'
    );
    assert.equal(firstScan.success, true);
    assert.equal(firstScan.status, 'valid_checked_in');
    assert.equal(firstScan.updatedTicket?.status, 'used');

    const replayScan = validateAndProcessTicketScan(
      'OLJ-1002-VIP',
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0]
    );
    assert.equal(replayScan.success, false);
    assert.equal(replayScan.status, 'already_used');

    const cancelledScan = validateAndProcessTicketScan(
      'OLJ-1003-GEN',
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0]
    );
    assert.equal(cancelledScan.success, false);
    assert.equal(cancelledScan.status, 'cancelled');
  });

  test('calculateTicketingMetrics and getUserPurchasedTickets compute accurate totals', () => {
    const tickets: Ticket[] = [
      {
        id: 't1',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-1',
        guestName: 'Usuario Uno',
        guestEmail: 'uno@test.com',
        buyerUid: 'uid-1',
        tier: 'General',
        price: 1500,
        status: 'used',
        issuedAt: '2026-10-20',
        qrPayload: 'OLJ-1',
      },
      {
        id: 't2',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-2',
        guestName: 'Usuario Uno',
        guestEmail: 'uno@test.com',
        buyerUid: 'uid-1',
        tier: 'VIP',
        price: 3000,
        status: 'valid',
        issuedAt: '2026-10-20',
        qrPayload: 'OLJ-2',
      },
    ];

    const tables: VipTable[] = [
      {
        id: 'tb1',
        eventId: 'evt-oleaje-2026',
        tableNumber: 'Sunbed 01',
        zone: 'Playa',
        tier: 'Diamante',
        seats: 8,
        price: 20000,
        status: 'reserved',
      },
    ];

    const metrics = calculateTicketingMetrics(tickets, tables, 100, 'evt-oleaje-2026');
    assert.equal(metrics.ticketsSold, 2);
    assert.equal(metrics.ticketsCheckedIn, 1);
    assert.equal(metrics.totalRevenue, 24500);

    const userTickets = getUserPurchasedTickets(tickets, {
      uid: 'uid-1',
      email: 'uno@test.com',
    });
    assert.equal(userTickets.length, 2);
  });
});
