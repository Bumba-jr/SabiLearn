# SabiLearn — TODO / Roadmap

Last updated: 2026-09-25
Working build: production mode on http://localhost:3000 (`pnpm build` + `pnpm start`; dev is `pnpm dev`).

---

## 1. Dashboards (in progress — TOP PRIORITY)

### 1.1 Tutor dashboard (`app/dashboard/tutor/page.tsx`)
- [ ] Redesign with a professional layout: stats cards (earnings, upcoming sessions, rating, profile views), clean sidebar/tabs
- [ ] Incoming booking requests list with Accept / Decline actions (sessions table already has `status: pending`)
- [ ] Upcoming sessions view with student name, subject, date/time, mode (online/home + address)
- [ ] Earnings summary (from `sessions.amount` where payment_status = paid)
- [ ] Profile completeness meter (photo, bio, subjects, availability…)
- [ ] Link to edit profile / re-run onboarding for corrections
- [ ] Empty states + loading skeletons (currently plain/unstyled)

### 1.2 Student dashboard (`app/dashboard/student/page.tsx`)
- [ ] Same professional redesign pass
- [ ] My bookings: upcoming / pending / past tabs, cancel or reschedule request
- [ ] "Pay now" button for confirmed bookings (Paystack initialize already exists in `app/api/payments/`)
- [ ] Favorite tutors grid (favorites API exists) with quick "Book again"
- [ ] My reviews section (write/rate a tutor after a completed session — reviews API exists)

### 1.3 Parent dashboard — DOES NOT EXIST YET
- [ ] Create `app/dashboard/parent/page.tsx` + API support (profiles.role already allows 'parent')
- [ ] Parent view = student dashboard + child management (multiple children, each with own bookings)
- [ ] Needs DB decision: children linked to parent profile (e.g. `students.parent_id`)

---

## 2. Messaging / Chat (Send Message button)

- [ ] DB schema: `conversations` (participant pair) + `messages` (sender, body, read_at, created_at)
- [ ] API: list conversations, get messages, send message, mark read (cookie-auth routes like profile)
- [ ] Chat popup UI on tutor profile (replaces the current "coming soon" toast on Send Message)
- [ ] Chat page/panel in dashboards with unread badge (both tutor & student/parent sides)
- [ ] Realtime updates (Supabase Realtime channel on messages table)
- [ ] Guard: rate limiting / abuse reporting link (safety page exists)

---

## 3. Onboarding completion

### 3.1 Tutor onboarding (nearly done)
- [x] Auto-save progress to Supabase (`/api/onboarding/progress`, debounced)
- [x] Clickable validation links (yellow checklist + red submit summary)
- [ ] **USER: run `supabase/migrations/007_onboarding_progress_auth_user.sql` in Supabase SQL editor** (server-side save is parked until this runs)
- [ ] Intro video upload polish (draft system exists; verify restore works end-to-end)

### 3.2 Student onboarding (`app/onboarding/student/page.tsx`)
- [ ] Apply the same improvements as tutor: auto-save to Supabase, clickable validation links, progress indicator
- [ ] Student-specific steps review: subjects/levels/goals, parent contact if minor

### 3.3 Parent onboarding — DOES NOT EXIST YET
- [ ] Create `app/onboarding/parent/page.tsx` + `app/api/onboarding/parent/route.ts`
- [ ] Parent creates account → adds child(ren) → links child to tutors/bookings
- [ ] Add 'parent' to role-selection flow targets (role-selection page exists)

---

## 4. Tutor availability (so parents know who's bookable)

- [ ] DB: availability table/columns on tutors (e.g. weekly schedule JSONB: day → time ranges) + "free hours"
- [ ] Tutor UI: set availability in dashboard (weekly grid editor)
- [ ] Public UI: show availability on tutor profile ("Available: Mon–Fri 4pm–7pm") and on card
- [ ] Booking modal: only offer slots inside availability; warn on conflict with existing bookings
- [ ] Show "Next available slot" on find-tutors cards

---

## 5. Known bugs / debt from this codebase

- [ ] `middleware.ts` → rename to `proxy.ts` (Next 16 deprecation warning in every build)
- [ ] Tests: `vitest` is not installed — `*.test.ts` files can't run (excluded from build typecheck). Either add vitest as devDependency and wire `pnpm test`, or delete stale tests
- [ ] `convex/` folder is dead code from the Clerk era — delete it
- [ ] Corrupted bios in DB (duplicated paragraphs from old draft bug): display is cleaned by `lib/utils/text-dedupe.ts`, but run a one-time cleanup script to fix the data itself
- [ ] Tutors with no `avatar_url` / no `hourly_rate` (bookings default amount to 0 — decide: require rate at onboarding, or show "price on request")
- [ ] "Female Tutors Only" filter does nothing (`app/find-tutors/page.tsx:160`) — needs a gender field on tutors
- [ ] Subject/level filters only use the FIRST selected item — support multiple
- [ ] Ratings all 0.0 — no tutor has reviews yet; seed or prompt first reviews after first completed sessions
- [ ] Error pages: custom 404/error page, and booking/payment failures should show inside the modal (not only floating toast)
- [ ] Security audit: several API routes use the service-role key — verify each checks the caller's identity before reading/writing (profile route pattern is the model)
- [ ] Mobile pass: verify all pages on small screens (onboarding tested on desktop)
- [ ] Add `.env.example` with the required vars (no real values)

---

## 6. Nice-to-haves (after the above)

- [ ] Search: tutor name search is client-side only — move to DB (ilike) for scale
- [ ] Notifications: email/in-app when booking requested/confirmed/paid
- [ ] Rescheduling flow with tutor confirmation
- [ ] Tutor payout tracking (Paystack transfer / manual log)
- [ ] Admin panel (`app/admin`) polish: verify tutors, refund bookings, view users
- [ ] Analytics: simple page-visit + conversion tracking
- [ ] SEO: per-tutor public profile meta tags, sitemap
