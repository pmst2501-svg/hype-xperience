import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWristbandFolio,
  createImageFingerprint,
  checkWristbandFraud,
  buildWristbandQRPayload,
  calculateEventMetrics,
  filterTickets,
} from './wristbandLogic.ts';
import type { WristbandVerification, Ticket, VipTable } from '../types/ticket.ts';

test('generateWristbandFolio formats correctly', () => {
  const folio = generateWristbandFolio('BRZ', 'CDMX');
  assert.match(folio, /^BRZ-\d{4}-[A-Z0-9]+$/);
});

test('createImageFingerprint produces consistent fingerprints', () => {
  const img1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
  const fp1 = createImageFingerprint(img1);
  const fp2 = createImageFingerprint(img1);
  assert.equal(fp1, fp2);
  assert.ok(fp1.startsWith('FP-'));
});

test('checkWristbandFraud detects duplicate folio', () => {
  const existing: WristbandVerification[] = [
    {
      id: 'wb-1',
      eventId: 'evt-1',
      folio: 'BRZ-1001-XYZ',
      photoUrl: 'data:img1',
      photoHash: 'hash-abc',
      timestamp: '2026-10-16T20:00:00Z',
      formattedDateTime: '16 Oct 2026 20:00',
      location: { latitude: 19.4326, longitude: -99.1332, venueName: 'Venue A' },
      validatedBy: { collabId: 'c1', collabName: 'Carlos', roleTitle: 'Puerta' },
      qrData: 'qr-sample',
      status: 'approved',
      accessGate: 'Puerta 1',
    },
  ];

  const resultDuplicateFolio = checkWristbandFraud(
    { folio: 'BRZ-1001-XYZ', photoHash: 'hash-different' },
    existing
  );
  assert.equal(resultDuplicateFolio.isFraud, true);
  assert.equal(resultDuplicateFolio.status, 'duplicate_flagged');

  const resultDuplicatePhoto = checkWristbandFraud(
    { folio: 'BRZ-9999-NEW', photoHash: 'hash-abc' },
    existing
  );
  assert.equal(resultDuplicatePhoto.isFraud, true);
  assert.equal(resultDuplicatePhoto.status, 'duplicate_flagged');

  const resultValid = checkWristbandFraud(
    { folio: 'BRZ-8888-OK', photoHash: 'hash-unique' },
    existing
  );
  assert.equal(resultValid.isFraud, false);
  assert.equal(resultValid.status, 'approved');
});

test('buildWristbandQRPayload embeds required validation metadata', () => {
  const payload = buildWristbandQRPayload({
    folio: 'BRZ-5555-TEST',
    timestamp: '2026-10-16T21:00:00Z',
    lat: 19.4326,
    lng: -99.1332,
    venueName: 'Hotel Grand Luxe',
    staffName: 'Rodrigo M.',
    photoHash: 'FP-sample',
  });

  const parsed = JSON.parse(payload);
  assert.equal(parsed.folio, 'BRZ-5555-TEST');
  assert.equal(parsed.loc.venue, 'Hotel Grand Luxe');
  assert.equal(parsed.staff, 'Rodrigo M.');
  assert.equal(parsed.sig, 'VERIFIED_DOOR_ENTRY');
});

test('calculateEventMetrics computes revenues, check-ins and capacity properly', () => {
  const tickets: Ticket[] = [
    {
      id: 't1',
      eventId: 'e1',
      folio: 'F1',
      guestName: 'Ana Gomez',
      guestEmail: 'ana@example.com',
      tier: 'General',
      price: 1500,
      status: 'used',
      issuedAt: '2026-10-16',
      qrPayload: 'qr1',
    },
    {
      id: 't2',
      eventId: 'e1',
      folio: 'F2',
      guestName: 'Luis Perez',
      guestEmail: 'luis@example.com',
      tier: 'VIP',
      price: 3500,
      status: 'valid',
      issuedAt: '2026-10-16',
      qrPayload: 'qr2',
    },
    {
      id: 't3',
      eventId: 'e1',
      folio: 'F3',
      guestName: 'Cancelado',
      guestEmail: 'c@example.com',
      tier: 'General',
      price: 1500,
      status: 'cancelled',
      issuedAt: '2026-10-16',
      qrPayload: 'qr3',
    },
  ];

  const wristbands: WristbandVerification[] = [];
  const tables: VipTable[] = [
    {
      id: 'tb1',
      eventId: 'e1',
      tableNumber: 'M-01',
      zone: 'Zona VIP',
      tier: 'Gold',
      seats: 6,
      price: 15000,
      status: 'reserved',
    },
  ];

  const metrics = calculateEventMetrics(tickets, wristbands, tables, 100);
  assert.equal(metrics.ticketsSold, 2);
  assert.equal(metrics.totalRevenue, 1500 + 3500 + 15000); // 20000
  assert.equal(metrics.capacityPct, 2);
});

test('filterTickets matches query and status', () => {
  const tickets: Ticket[] = [
    {
      id: 't1',
      eventId: 'e1',
      folio: 'HT-100',
      guestName: 'Camila Reyes',
      guestEmail: 'camila@email.com',
      tier: 'VIP',
      price: 2500,
      status: 'valid',
      issuedAt: '2026-10-16',
      qrPayload: 'qr1',
    },
    {
      id: 't2',
      eventId: 'e1',
      folio: 'HT-200',
      guestName: 'Mateo Sanchez',
      guestEmail: 'mateo@email.com',
      tier: 'General',
      price: 1200,
      status: 'used',
      issuedAt: '2026-10-16',
      qrPayload: 'qr2',
    },
  ];

  assert.equal(filterTickets(tickets, 'camila', 'all').length, 1);
  assert.equal(filterTickets(tickets, '', 'used').length, 1);
  assert.equal(filterTickets(tickets, 'desconocido', 'all').length, 0);
});
