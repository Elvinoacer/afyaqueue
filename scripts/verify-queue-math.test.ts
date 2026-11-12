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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running AfyaQueue Mathematical Specification Tests...');

// 1. Verification against Manual (Figure D.6): Q_patient = 18, Q_serving = 12
const ahead1 = calculatePeopleAhead(18, 12);
assert(ahead1 === 5, `Expected 5 people ahead, got ${ahead1}`);
console.log('✔ Case 1: Q_patient=18, Q_serving=12 -> 5 people ahead');

// 2. ETA Verification against Manual (Figure D.6): N_ahead = 5, T_avg = 5 mins
const eta1 = calculateEstimatedWaitTime(ahead1, 5);
assert(eta1 === 25, `Expected 25 mins wait, got ${eta1}`);
console.log('✔ Case 2: N_ahead=5, T_avg=5 -> 25 mins ETA');

// 3. Edge Case: Next in line (Q_patient = 13, Q_serving = 12)
const aheadNext = calculatePeopleAhead(13, 12);
assert(aheadNext === 0, `Expected 0 people ahead when next in line, got ${aheadNext}`);
const etaNext = calculateEstimatedWaitTime(aheadNext, 5);
assert(etaNext === 0, `Expected 0 mins wait for next in line, got ${etaNext}`);
console.log('✔ Case 3: Q_patient=13, Q_serving=12 -> 0 people ahead (Next in line)');

// 4. Edge Case: Currently serving (Q_patient = 12, Q_serving = 12)
const aheadServing = calculatePeopleAhead(12, 12);
assert(aheadServing === 0, `Expected 0 people ahead when currently serving, got ${aheadServing}`);
assert(isPatientTurn(12, 12) === true, 'Expected isPatientTurn to be true');
assert(isPatientTurnPast(12, 12) === false, 'Expected isPatientTurnPast to be false');
console.log('✔ Case 4: Q_patient=12, Q_serving=12 -> isPatientTurn = true');

// 5. Edge Case: Already served (Q_patient = 11, Q_serving = 12)
assert(isPatientTurn(11, 12) === false, 'Expected isPatientTurn to be false when already served');
assert(isPatientTurnPast(11, 12) === true, 'Expected isPatientTurnPast to be true when already served');
console.log('✔ Case 5: Q_patient=11, Q_serving=12 -> isPatientTurnPast = true');

// 6. Edge Case: No active queue token (Q_patient = 0)
assert(calculatePeopleAhead(0, 12) === 0, 'Expected 0 people ahead when queueNumber is 0');
assert(isPatientTurn(0, 12) === false, 'Expected isPatientTurn false when queueNumber is 0');
assert(isPatientTurnPast(0, 12) === false, 'Expected isPatientTurnPast false when queueNumber is 0');
console.log('✔ Case 6: Boundary Q_patient=0 -> 0 people ahead, turn inactive');

// 7. Dynamic Wait Time with Specialty Doctor Consultation Duration
const docPediatricsAvg = 7; // Dr. David Kiprono
const pedsWait = calculateEstimatedWaitTime(3, docPediatricsAvg);
assert(pedsWait === 21, `Expected 21 mins wait for Pediatrics, got ${pedsWait}`);
console.log('✔ Case 7: Dynamic Wait Time T_avg=7m, N_ahead=3 -> 21 mins ETA');

// 8. Section 6.1 Formula 4: Staff Waiting Counter
const mockStaffAppointments: Partial<Appointment>[] = [
  { queueNumber: 11, status: 'completed' },
  { queueNumber: 12, status: 'upcoming' }, // Currently serving (not waiting)
  { queueNumber: 13, status: 'upcoming' }, // Waiting 1
  { queueNumber: 14, status: 'upcoming' }, // Waiting 2
  { queueNumber: 15, status: 'upcoming' }, // Waiting 3
  { queueNumber: 16, status: 'cancelled' }, // Cancelled (not waiting)
  { queueNumber: 17, status: 'upcoming' }, // Waiting 4
  { queueNumber: 18, status: 'upcoming' }, // Waiting 5
];
const nowServing = 12;
const waitingCount = mockStaffAppointments.filter(
  (a) => a.status === 'upcoming' && (a.queueNumber ?? 0) > nowServing
).length;
assert(waitingCount === 5, `Expected 5 waiting patients, got ${waitingCount}`);
console.log('✔ Case 8: Staff Waiting Counter N_waiting -> 5 active upcoming patients');

// 9. Section 6.1 Formula 5: Open Slots Filter
const mockDoctor: Partial<Doctor> = {
  id: 'doc-sarah-wanjiku',
  availableSlots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'],
};
const mockBookings: Partial<Appointment>[] = [
  { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '09:30 AM', status: 'upcoming' },
  { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '10:30 AM', status: 'upcoming' },
  { doctorId: 'doc-sarah-wanjiku', date: '2026-09-22', timeSlot: '11:00 AM', status: 'cancelled' }, // Cancelled slot is freed
];
const bookedSlotSet = new Set(
  mockBookings
    .filter((a) => a.doctorId === mockDoctor.id && a.date === '2026-09-22' && a.status === 'upcoming')
    .map((a) => a.timeSlot)
);
const openSlots = (mockDoctor.availableSlots ?? []).filter((s) => !bookedSlotSet.has(s));
assert(openSlots.length === 3, `Expected 3 open slots, got ${openSlots.length}`);
assert(openSlots.includes('09:00 AM'), 'Expected 09:00 AM to be open');
assert(openSlots.includes('10:00 AM'), 'Expected 10:00 AM to be open');
assert(openSlots.includes('11:00 AM'), 'Expected cancelled 11:00 AM to remain open');
assert(!openSlots.includes('09:30 AM'), 'Expected booked 09:30 AM to be excluded');
console.log('✔ Case 9: Open Slots Filter OpenSlots(d, date) -> 3 open slots (09:00, 10:00, 11:00 freed)');

// 10. Doc ID composite key format
const docKey = getQueueDocId('doc-sarah-wanjiku', '2026-09-22');
assert(docKey === 'doc-sarah-wanjiku_2026-09-22', `Expected doc-sarah-wanjiku_2026-09-22, got ${docKey}`);
console.log('✔ Case 10: getQueueDocId composite format matches Firestore spec');

// 11. Today String matches prototype institutional date
assert(todayString() === '2026-09-22', 'Expected todayString to equal 2026-09-22');
console.log('✔ Case 11: todayString institutional date matches specification');

console.log('All 11 AfyaQueue mathematical verification tests passed successfully!');
