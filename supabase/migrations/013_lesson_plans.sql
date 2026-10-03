-- 013: Lesson plans — bookings can cover a billing period (weekly/monthly/yearly)
-- of recurring lessons. Price is calculated from the tutor's hourly rate ×
-- hours per lesson × lessons per week × weeks in the period, minus a
-- loyalty discount (monthly 5%, yearly 10%).
alter table sessions add column if not exists plan_period text
    check (plan_period in ('single', 'weekly', 'monthly', 'yearly'));
alter table sessions add column if not exists sessions_per_week int;
alter table sessions add column if not exists hours_per_session numeric(4, 1);
alter table sessions add column if not exists plan_total numeric(12, 2);

-- Refresh PostgREST schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
