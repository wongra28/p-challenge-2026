# p-challenge-2026
Submission for design challenge.

# Session team assignment

A prototype for splitting a recreational volleyball session into balanced teams, without the host doing it from memory while eighteen people wait.

Built in a single working session, roughly four hours end to end against a three hour target. Sole author throughout, AI-assisted. The business context is shared with a co-founder; this build is not.


---

## The problem

I co-run a recreational volleyball community in London. At every session with more than one court, someone has to split the room into teams. Today that falls to a host who does it from memory, in about fifteen minutes, in front of the people being sorted.

Three things go wrong:

- **It needs expertise that doesn't scale.** A host who knows 200 players by sight does it well. A host running their third session cannot, and there's no way to transfer that knowledge.
- **One person absorbs the whole social cost.** When teams turn out uneven, the host is visibly responsible for everyone's evening.
- **The information is scattered.** Who's coming, who can set, who's injured tonight, who booked together, who's new and shouldn't be stranded. Some of it is in the booking system, most of it is in the host's head.

## What this is not

It is not a fairness algorithm that replaces the host's judgement. Balance competes with things that matter more to a recreational community: friends playing together, newcomers having a decent first night, the same person not carrying every week. The tool's job is to make those trade-offs visible and adjustable, and to leave the decision with a human.

---

## What it does

**Host flow**

1. Pick a session from the list, with a readiness check showing whether the roster can actually form legal teams
2. Review the roster: positions, level bands, who's new, who declared an injury
3. Get a proposed set of teams, with a shuffle for alternatives
4. Swap players and see the effect on team averages live, before committing
5. Record set scores

**Player views**

- Declare position, condition and a play-with request before the session
- See your team and a plain-language reason for it
- See your level, where it came from, and how to contest it

---

## How it works

### Two tracks that never merge

**The rating** answers one question: what has this person actually done on court. It moves on match evidence and nothing else.

**The constraints** answer a different question: who should play with whom tonight. Positions, friendships, newcomers, rest.

Gender, age, attitude, friendships, newness and declared tiredness never modify a rating. They shape who plays alongside whom, never what someone is judged capable of. A single score with modifiers stacked on it can't be explained to the person it describes, and any one of those modifiers could be doing something indefensible without anyone noticing.

### Team composition is a hard constraint

Every team of six is exactly 1 setter, 1 middle blocker, 2 outside hitters, 1 opposite, 1 libero. This is enforced by the interface rather than by warnings: when you select a player to swap, only same-position players on other teams are selectable. An illegal team is unreachable, not merely discouraged.

### Team strength is not a sum

Volleyball is a chain: reception, set, attack. A team fails at its weakest link, and the opposition can choose to attack that link by serving at the worst passer. So strength combines the mean with a weakest-link term rather than adding six numbers together.

### Overrides are recorded, not prevented

The host can override any proposal. Every override is logged with a reason, enforced as a not-null constraint at the database rather than trusted to the UI. Overrides never feed back into anyone's rating, so a host cannot move someone's rating by moving them between teams.

---

## Running it locally

```bash
npm install
npx expo start
```

Press `w` for web. The seed data loads from `spark-seed.json`, so no backend is required to click through it.

**Stack:** Expo, React Native, Expo Router, TypeScript. Optional Supabase
