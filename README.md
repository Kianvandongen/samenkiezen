# SamenKiezen (web-app + Supabase)

Gratis te gebruiken als web-app op elke telefoon (Zet op beginscherm). Geen App Store nodig.

## Online zetten (gratis)
1. Supabase → Authentication → Sign In / Providers → Email → zet **Confirm email** uit.
2. Ga naar https://app.netlify.com/drop, maak een gratis account en sleep de map `samenkiezen-web` erin.
3. Open de link op je telefoon → Safari: Deel → Zet op beginscherm (Android: Installeer app).

## Opnieuw bouwen na wijzigingen
```
npm install
./build-web.sh      # maakt ./web-build
```

## Backend
- Supabase-project `samenkiezen` (eu-central-1). Tabellen: profiles, groups, group_members, rounds, votes, vote_progress, matches, final_votes, messages.
- Matches worden server-side berekend (trigger op votes). Stemmen van anderen zijn nooit leesbaar (RLS).
- Edge function `delete-account` verwijdert een account volledig.

## Films en series
Alleen titels uit het abonnement van Netflix of Prime Video (NL, bron: FilmVandaag, oktober 2026). Aanbod kan wijzigen.
