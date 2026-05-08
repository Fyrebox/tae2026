# SERP Climber — v1 Spec

A simple web-based card/strategy game that teaches SEO by having the player race a competitor's site to page 1 of Google.

## Concept

You're given a keyword (e.g., "best running shoes for flat feet") and a starting rank (#50). Each turn you play one SEO action card. A competitor AI plays in parallel. First to crack the top 3 wins.

**Why it teaches SEO:**
- Cards force the player to learn the vocabulary by using it.
- Diminishing returns + prerequisites teach that SEO is compounding (content → links → authority), not a single trick.
- Trap events (algorithm updates, penalties) teach risk concepts viscerally.

## Goal for v1

Ship a playable single-round prototype in ~1 weekend. One keyword, one competitor, ~10 turns, win/lose screen.

## Screens (4 total)

1. **Title** — game name, "Play", "How SEO works" (30-sec primer modal).
2. **Keyword brief** — shows the keyword, its difficulty (1–5), starting rank (#50), turn budget (10), and your starting resources (Time: 10, Budget: $1000).
3. **Game board** — the main loop (see below).
4. **Results** — final rank, competitor's rank, score breakdown, "what you learned" recap (3 bullets tied to the actions you played).

## Game board layout

- **Top:** SERP visualization — a vertical list of 10 slots. Your site icon sits at its current rank, competitor's site at theirs. Animate movement each turn.
- **Middle:** turn counter, Time left, Budget left.
- **Bottom:** hand of 5 cards drawn from a 20-card deck. Click a card → confirm → resolve → competitor plays → next turn.

## Card list (v1 — 10 cards)

| Card | Cost | Effect | Teaches |
|---|---|---|---|
| Write Pillar Post | 3 Time, $200 | +8 rank pts. Required before backlinks have full value. | Content is the foundation |
| Write Supporting Post | 1 Time, $50 | +2 rank pts. Stacks up to 3×. | Topic clusters |
| Optimize Title Tag | 1 Time | +3 rank pts. One-time. | On-page SEO |
| Add Schema Markup | 1 Time | +2 rank pts + 10% rich-result chance (visual badge). | Structured data |
| Improve Page Speed | 2 Time, $100 | +3 rank pts. | Core Web Vitals |
| Earn Quality Backlink | 2 Time, $300 | +6 rank pts (×2 if Pillar Post played). | Authority via links |
| Buy Cheap Backlinks | $200 | +5 rank pts now, 30% chance of penalty next turn (−10). | Black-hat risk |
| Guest Post | 3 Time | +4 rank pts + 1 backlink credit. | White-hat outreach |
| Fix Cannibalization | 1 Time | +3 rank pts if you've played 2+ Supporting Posts. | Site architecture |
| Refresh Old Content | 1 Time | +2 rank pts per Supporting Post on board. | Content maintenance |

Deck = 2 copies of each = 20 cards. Draw 5, refill to 5 each turn.

## Event deck (drawn every 3 turns)

- **Algorithm update** — sites that played "Buy Cheap Backlinks" lose 10 pts.
- **Featured snippet opportunity** — if Schema played, +5 pts.
- **Competitor PR win** — competitor +6 pts.

## Scoring formula

```
rank_position = 50 - floor(total_pts / 5)
clamped to [1, 50]
```

- **Win:** rank ≤ 3 by turn 10.
- **Lose:** competitor reaches top 3 first, or turn 10 ends with you below #3.

## Tech stack

- **Vite + React + TypeScript** (or vanilla JS if you want zero deps).
- One file for game state (`useReducer`), one for cards data (JSON), one for the SERP animation (CSS transforms on `top`).
- Tailwind for styling, ~200 lines of CSS otherwise.
- No backend. localStorage for "best score."

## File structure

```
src/
  App.tsx              // screen router
  game/
    state.ts           // reducer, types
    cards.ts           // card definitions
    competitorAI.ts    // picks highest-value affordable card
    events.ts          // event deck
  screens/
    Title.tsx
    Brief.tsx
    Board.tsx
    Results.tsx
  components/
    SERP.tsx           // the rank visualization
    Card.tsx
    Hand.tsx
```

## Build order (2-day plan)

**Day 1:** state + reducer + card resolution logic, no UI polish. Get a full round playable in an ugly UI.

**Day 2:** SERP animation, card art (emoji is fine for v1), results recap, "How SEO works" modal, deploy.

## Cut from v1 (save for v2)

- Multiple keywords / campaign mode
- Tech SEO category (sitemaps, robots.txt, canonicals)
- Local SEO, international SEO
- Multiplayer
- Sound effects
