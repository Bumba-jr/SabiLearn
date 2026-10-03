// Lesson-plan pricing: a booking covers a billing period (weekly/monthly/yearly)
// of recurring lessons. Price = hourly rate × hours per lesson × lessons per week
// × weeks in the period, minus a loyalty discount for longer periods.

export type PlanPeriod = 'single' | 'weekly' | 'monthly' | 'yearly';

export const PERIOD_WEEKS: Record<PlanPeriod, number> = {
    single: 1,
    weekly: 1,
    monthly: 4,
    yearly: 52,
};

export const PERIOD_DISCOUNT: Record<PlanPeriod, number> = {
    single: 0,
    weekly: 0,
    monthly: 0.05,
    yearly: 0.1,
};

export const PERIOD_LABELS: Record<PlanPeriod, string> = {
    single: 'One-off lesson',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
};

export interface LessonPlanInput {
    hourlyRate: number;
    hoursPerSession: number;
    sessionsPerWeek: number;
    period: PlanPeriod;
}

export interface LessonPlanPrice {
    perSession: number;
    perWeek: number;
    sessionsInPeriod: number;
    subtotal: number;
    discount: number;
    total: number;
}

export function calcLessonPlan({ hourlyRate, hoursPerSession, sessionsPerWeek, period }: LessonPlanInput): LessonPlanPrice {
    const rate = Math.max(0, Number(hourlyRate) || 0);
    const hours = Math.max(0.5, Number(hoursPerSession) || 1);
    const days = Math.min(7, Math.max(1, Number(sessionsPerWeek) || 1));

    const perSession = Math.round(rate * hours);
    const perWeek = perSession * days;
    const sessionsInPeriod = PERIOD_WEEKS[period] * days;
    const subtotal = perWeek * PERIOD_WEEKS[period];
    const discount = Math.round(subtotal * PERIOD_DISCOUNT[period]);
    const total = Math.max(0, subtotal - discount);

    return { perSession, perWeek, sessionsInPeriod, subtotal, discount, total };
}
