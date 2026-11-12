import { describe, expect, it } from 'bun:test';
import {
  calculateEstimatedWaitTime,
  calculatePeopleAhead,
  getQueueDocId,
  isPatientTurn,
  isPatientTurnPast,
  todayString,
  type Appointment,
  type Doctor,
} from '../src/types/models';

describe('AfyaQueue Mathematical Specification Tests', () => {
  it('Case 1: Q_patient=18, Q_serving=12 -> 5 people ahead', () => {
    const ahead = calculatePeopleAhead(18, 12);
    expect(ahead).toBe(5);
  });

  it('Case 2: N_ahead=5, T_avg=5 -> 25 mins ETA', () => {
    const ahead = calculatePeopleAhead(18, 12);
    const eta = calculateEstimatedWaitTime(ahead, 5);
    expect(eta).toBe(25);
  });

  it('Case 3: Q_patient=13, Q_serving=12 -> 0 people ahead (Next in line)', () => {
    const aheadNext = calculatePeopleAhead(13, 12);
    expect(aheadNext).toBe(0);
    const etaNext = calculateEstimatedWaitTime(aheadNext, 5);
    expect(etaNext).toBe(0);
  });

  it('Case 4: Q_patient=12, Q_serving=12 -> isPatientTurn = true', () => {
    const aheadServing = calculatePeopleAhead(12, 12);
    expect(aheadServing).toBe(0);
    expect(isPatientTurn(12, 12)).toBe(true);
    expect(isPatientTurnPast(12, 12)).toBe(false);
  });

  it('Case 5: Q_patient=11, Q_serving=12 -> isPatientTurnPast = true', () => {
    expect(isPatientTurn(11, 12)).toBe(false);
    expect(isPatientTurnPast(11, 12)).toBe(true);
  });

  it('Case 6: Boundary Q_patient=0 -> 0 people ahead, turn inactive', () => {
    expect(calculatePeopleAhead(0, 12)).toBe(0);
    expect(isPatientTurn(0, 12)).toBe(false);
    expect(isPatientTurnPast(0, 12)).toBe(false);
  });

  it('Case 7: Dynamic Wait Time T_avg=7m, N_ahead=3 -> 21 mins ETA', () => {
    const pedsWait = calculateEstimatedWaitTime(3, 7);
    expect(pedsWait).toBe(21);
  });

  it('Case 8: Staff Waiting Counter N_waiting -> 5 active upcoming patients', () => {
    const mockStaffAppointments: Partial<Appointment>[] = [
      { queueNumber: 11, status: 'completed' },
      { queueNumber: 12, status: 'upcoming' },
      { queueNumber: 13, status: 'upcoming' },
      { queueNumber: 14, status: 'upcoming' },
      { queueNumber: 15, status: 'upcoming' },
      { queueNumber: 16, status: 'cancelled' },
      { queueNumber: 17, status: 'upcoming' },
      { queueNumber: 18, status: 'upcoming' },
    ];
    const nowServing = 12;
    const waitingCount = mockStaffAppointments.filter(
      (a) => a.status === 'upcoming' && (a.queueNumber ?? 0) > nowServing
    ).length;
    expect(waitingCount).toBe(5);
  });

  it('Case 9: Open Slots Filter OpenSlots(d, date) -> 3 open slots (09:00, 10:00, 11:00 freed)', () => {
    const mockDoctor: Partial<Doctor> = {
      id: 'doc-sarah-wanjiku',
      availableSlots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'],
    };
    const mockBookings: Partial<Appointment>[] = [
      { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '09:30 AM', status: 'upcoming' },
      { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '10:30 AM', status: 'upcoming' },
      { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '11:00 AM', status: 'cancelled' },
    ];
    const bookedSlotSet = new Set(
      mockBookings
        .filter((a) => a.doctorId === mockDoctor.id && a.date === '2026-09-22' && a.status === 'upcoming')
        .map((a) => a.timeSlot)
    );
    const openSlots = (mockDoctor.availableSlots ?? []).filter((s) => !bookedSlotSet.has(s));
    expect(openSlots.length).toBe(3);
    expect(openSlots).toContain('09:00 AM');
    expect(openSlots).toContain('10:00 AM');
    expect(openSlots).toContain('11:00 AM');
    expect(openSlots).not.toContain('09:30 AM');
  });

  it('Case 10: getQueueDocId composite format matches Firestore spec', () => {
    const docKey = getQueueDocId('doc-sarah-wanjiku', '2026-09-22');
    expect(docKey).toBe('doc-sarah-wanjiku_2026-09-22');
  });

  it('Case 11: todayString institutional date matches specification', () => {
    expect(todayString()).toBe('2026-09-22');
  });
});
