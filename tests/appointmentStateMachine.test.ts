import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionTo, canReschedule, getAllowedTransitions } from '../lib/appointmentStateMachine.ts';

const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();

test('pending → completed solo si la cita ya empezó', () => {
  assert.deepEqual(canTransitionTo('pending', 'completed', past), { allowed: true, reason: null });
  assert.deepEqual(canTransitionTo('pending', 'completed', future), { allowed: false, reason: 'futureAppointment' });
});

test('pending → cancelled siempre', () => {
  assert.equal(canTransitionTo('pending', 'cancelled', future).allowed, true);
});

test('completed y cancelled solo vuelven a pending', () => {
  assert.equal(canTransitionTo('completed', 'pending', past).allowed, true);
  assert.equal(canTransitionTo('cancelled', 'pending', past).allowed, true);
  assert.deepEqual(canTransitionTo('completed', 'cancelled', past), { allowed: false, reason: 'invalidTransition' });
  assert.deepEqual(canTransitionTo('cancelled', 'completed', past), { allowed: false, reason: 'invalidTransition' });
});

test('mismo estado no es un cambio', () => {
  assert.equal(canTransitionTo('completed', 'completed', future).allowed, true);
});

test('getAllowedTransitions', () => {
  assert.deepEqual(getAllowedTransitions('pending', past), ['completed', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('pending', future), ['cancelled']);
  assert.deepEqual(getAllowedTransitions('cancelled', past), ['pending']);
});

test('solo las citas pendientes se pueden reprogramar', () => {
  assert.equal(canReschedule('pending'), true);
  assert.equal(canReschedule('completed'), false);
  assert.equal(canReschedule('cancelled'), false);
});
