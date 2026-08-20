# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Expo SDK 54 with expo-router, React Native Web, TypeScript. Dark-themed mobile-web app tested at 390px viewport on localhost:8081.

## Users

Recreational volleyball session hosts ("organisers") who run regular drop-in sessions with 15–20 mixed-skill players. The organiser needs to split attendees into 3 balanced teams before play starts, under time pressure and with incomplete information about who will show up.

## Product Purpose

Spark automates fair team assignment for casual volleyball sessions. It replaces manual drafting with a constraint-satisfaction solver that balances competitive skill, positional coverage, social preferences (friend pairs, newcomer support), and injury safety — then lets the host fine-tune with transparent swap mechanics. Success means teams feel fair to players and the host spends under a minute on assignment.

## Positioning

A solver-driven team tool purpose-built for recreational volleyball's specific constraints: positional composition (1 S, 2 OH, 1 MB, 1 L, 1 OP), TrueSkill-based bands rather than raw ratings, newcomer buddying, friend-pair satisfaction, and injured-player protection. Generic team randomisers cannot express these constraints.

## Operating Context

The host opens the app on their phone at the venue shortly before the session. Attendees have already signed up with a position and optional declared state (tired, injured). The host taps "Propose teams", reviews 3 solver-generated options with metrics and rationale, optionally swaps same-position players between teams, finalises one option, and begins play. Score recording happens after sets; ratings update post-session.

## Capabilities and Constraints

- Roster of 100 seeded players with TrueSkill ratings (mu/sigma → conservative rating → band 1–7), position preferences, peer-points rate, session history, friend connections, gender, and member-since date.
- 18-player session at Finsbury Leisure Centre, London; mixed 2.35 m net; round-robin format; 3 teams of 6.
- Simulated-annealing solver (10 restarts × 1000 iterations) generates 3 diverse proposals filtered by Hamming distance ≥ 4.
- Hard constraints: every team has ≥ 1 setter; injured players excluded from OP/MB; team sizes within ±1.
- Soft objectives: minimise skill gap (×10), satisfy friend pairs (×3 each), buddy newcomers with solid players (×5), equalise peer-points variance (×2).
- Swap mechanic: same-position only, between different teams, with optional reason and before/after metric preview.
- Score recording screen exists as a connected stub; scoring logic and post-session rating updates are not yet implemented.
- All data is seeded client-side; no backend, auth, or persistence.

## Brand Commitments

Name: **Spark**. No logo, wordmark, or visual identity assets exist beyond the implemented dark UI. [inferred: the name "Spark" comes from the codebase and project directory; no formal brand guidelines were provided.]

## Evidence on Hand

- Fully functional prototype running on Expo web at localhost:8081.
- Seed dataset: 100 players, 35+ friend pairs, 18 session attendees.
- Court visualisation with 3×2 position grid, swap flow with confirmation sheet, collapsible session summary, chip-based attendee display grouped by position.
- No user research, testimonials, analytics, or external assets. All player names and data are synthetic.

## Product Principles

1. **Fairness is visible.** Every proposal shows its trade-offs (skill gap, friend pairs, newcomer coverage) so the host and players can see the reasoning, not just the result.
2. **Constraints before preferences.** Hard safety rules (setter coverage, injury protection) are non-negotiable; soft social goals are optimised within that frame.
3. **Host authority preserved.** The solver proposes; the host decides. Transparent swap mechanics with metric previews keep the human in control.
4. **Speed at the venue.** The entire flow — from attendee list to finalised teams — must feel instantaneous on a phone at the gym.
5. **Position-native design.** Volleyball's six-position structure (S, OH, MB, OP, L) is a first-class concept in every view, not an afterthought.
