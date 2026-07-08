# boothfinder — Project Overview

## What Is This?

boothfinder is a Progressive Web App that gives trade fair and exhibition attendees
in Tanzania an interactive, turn-by-turn navigation experience for finding booths
on large exhibition grounds. Businesses manage their own listings; venue admins
manage the full event and floor-plan configuration; and ClickPesa mobile payments
gate access to the wayfinding feature.

## Problem Being Solved

Trade fairs in Tanzania — such as Saba Saba, the Dar es Salaam International Trade
Fair, and regional expos — are held on grounds spanning several acres. No digital
wayfinding exists. Attendees navigate entirely by asking other people, which means
smaller or less prominently located booths get overlooked, businesses lose leads,
and attendees miss exhibitors they would have been interested in. boothfinder
replaces word-of-mouth navigation with a map-first, mobile-native experience.

## Target Users

- **Attendees** — trade fair visitors who want to find specific booths or browse
  what is available, navigate to them efficiently, and do so without internet
  connectivity (offline maps). They sign in with Google and pay a small fee to
  unlock wayfinding.
- **Booth businesses** — exhibitors who want to manage their listing, brand their
  map pin, download leads, connect their Instagram page, and run promotions or
  contest draws.
- **Venue / event admins** — organisers who configure the venue floor plan,
  create events with date ranges, assign Mappedin maps to events, and control
  the wayfinding fee (on/off and amount).

## Core Features (MVP)

- **Google-authenticated onboarding** — users sign in with Google; login is
  triggered the first time they search for a booth, or automatically after
  3 minutes of unauthenticated browsing. Booth businesses log in to the same
  app and are routed to their management panel via Clerk org membership.
- **Wayfinding fee onboarding** — after sign-up or login, attendees complete a
  one-time onboarding step that includes paying a configurable fee (default
  3,000 TZS) via ClickPesa mobile money. Incomplete onboarding always
  redirects back to the onboarding flow on next login.
- **Venue map browsing** — discover all booths at an event; search and filter
  by category, business name, or product type
- **Blue-dot wayfinding** — turn-by-turn indoor navigation from the attendee's
  current location to any selected booth, powered by Mappedin
- **User visit profiling** — every navigation session records distance walked,
  booth category visited, and timestamps — building a per-user preference
  profile (tech, apparel, hardware, etc.) used for future targeting and a
  total-distance leaderboard
- **Venue admin panel** — admins create venues, upload Mappedin floor plans,
  create events with start/end dates, manage booth assignments, and configure
  the wayfinding fee (on/off and amount)
- **Booth management panel** — businesses manage their org profile (via Clerk),
  view leads, download CSV, connect their Instagram page via OAuth, run
  milestone visitor promotions (optionally QR-gated), and run Instagram
  contest draws
- **Automatic leads capture** — every wayfinding session creates a lead record
  from the attendee's already-confirmed onboarding profile (name, phone) —
  no extra form, no re-entry — plus origin and destination booth. This is the
  booth's CRM data.
- **Dynamic event display** — upcoming events listed by default; active event
  map loads on event day; concurrent events prompt user to choose
- **Booth analytics + user profiling** — visitor count (InsForge), search
  popularity (PostHog), and per-user preference profiles (paid feature for
  booth businesses)
- **Instagram contests** — booths set a campaign hashtag and required tag;
  attendees post on Instagram and submit their URL; the Instagram Graph API
  verifies the post; verified entries enter a weighted random draw using a
  cryptographic seed, with a full audit log

## Success Criteria for v1

A trade fair attendee opens the PWA, signs in with Google, pays the wayfinding
fee via mobile money, searches for a booth, and receives step-by-turn indoor
directions — all within under 3 minutes, including while offline on the venue
grounds.

## Out of Scope for v1

- Native iOS / Android apps (PWA covers mobile)
- Multi-language support (English only for v1)
- Ticket purchasing or full event management beyond map assignment
- Contest draws on platforms other than Instagram
