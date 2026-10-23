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
} from './ticketingLogic.ts';
import type { Ticket, Collaborator, VipTable } from '../types/ticket.ts';

describe('ticketingLogic — Oleaje Beach Club Acapulco', () => {
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

    // 1. Valid QR scan succeeds and attributes collaborator
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
    assert.equal(firstScan.updatedTicket?.checkedInByCollabId, 'col-1');
    assert.equal(firstScan.updatedTicket?.checkedInByName, 'Rodrigo Mendoza');
    assert.equal(firstScan.updatedTicket?.usedAt, '22:05:10');

    // 2. Replay attack (scanning already used ticket) is rejected
    const replayScan = validateAndProcessTicketScan(
      'OLJ-1002-VIP',
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0]
    );
    assert.equal(replayScan.success, false);
    assert.equal(replayScan.status, 'already_used');

    // 3. Cancelled ticket is rejected
    const cancelledScan = validateAndProcessTicketScan(
      'OLJ-1003-GEN',
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0]
    );
    assert.equal(cancelledScan.success, false);
    assert.equal(cancelledScan.status, 'cancelled');

    // 4. Unknown folio is rejected
    const unknownScan = validateAndProcessTicketScan(
      'OLJ-9999-FAKE',
      tickets,
      'evt-oleaje-2026',
      sampleStaff[0]
    );
    assert.equal(unknownScan.success, false);
    assert.equal(unknownScan.status, 'not_found');
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
      {
        id: 't3',
        eventId: 'evt-oleaje-2026',
        folio: 'OLJ-3',
        guestName: 'Cancelado',
        guestEmail: 'cancel@test.com',
        tier: 'General',
        price: 1500,
        status: 'cancelled',
        issuedAt: '2026-10-20',
        qrPayload: 'OLJ-3',
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
    assert.equal(metrics.ticketsPending, 1);
    assert.equal(metrics.checkinPct, 50);
    assert.equal(metrics.ticketRevenue, 4500);
    assert.equal(metrics.tablesRevenue, 20000);
    assert.equal(metrics.totalRevenue, 24500);

    const userTickets = getUserPurchasedTickets(tickets, {
      uid: 'uid-1',
      email: 'uno@test.com',
    });
    assert.equal(userTickets.length, 2);
  });
});
