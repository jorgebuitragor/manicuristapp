export type AppointmentStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Valid transitions between appointment states.
 * completed → pending: undo (e.g. income was registered by mistake)
 * cancelled → pending: reactivate a cancelled appointment
 * completed ↔ cancelled and cancelled → completed are forbidden
 */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['completed', 'cancelled'],
  completed: ['pending'],
  cancelled: ['pending'],
};

export type TransitionBlockReason = 'invalidTransition' | 'futureAppointment' | null;

export interface TransitionResult {
  allowed: boolean;
  reason: TransitionBlockReason;
}

export function canTransitionTo(
  from: AppointmentStatus,
  to: AppointmentStatus,
  startTime: string,
): TransitionResult {
  if (from === to) return { allowed: true, reason: null };

  if (!TRANSITIONS[from].includes(to)) {
    return { allowed: false, reason: 'invalidTransition' };
  }

  if (to === 'completed' && new Date(startTime) > new Date()) {
    return { allowed: false, reason: 'futureAppointment' };
  }

  return { allowed: true, reason: null };
}

export function canReschedule(status: AppointmentStatus): boolean {
  return status === 'pending';
}

export function getAllowedTransitions(
  from: AppointmentStatus,
  startTime: string,
): AppointmentStatus[] {
  return TRANSITIONS[from].filter(
    (to) => canTransitionTo(from, to, startTime).allowed,
  );
}
