# Validation & Go-To-Market Strategy

**Working codename:** Tonari *(隣, "the one beside you" — placeholder, NAME: TBD)*
**Date:** 2026-06-11
**Status:** Validation phase (pre-build)

---

## 1. The hypothesis we're testing

> People will pay a monthly subscription for an embodied 3D AI companion they can
> talk to (voice) and that **adaptively moves and positions itself** with them —
> enough of them, at a high enough price, to justify building it.

- **Wedge:** a consumer companion app.
- **Long-term play:** an **embodiment platform** — "give any AI agent a body." The
  consumer experience proves the tech, throws off revenue, and generates the
  motion/interaction data that becomes the moat; the same engine is later exposed
  as a B2B/developer platform.

## 2. The differentiator (and the moat)

The market is **saturated with anime AI chat companions** (see §7). Almost all of
them are text + 2D images, or at most a canned-animation 3D avatar. The defensible
wedge is the thing none of them do well, surfaced in the deep-research report
(`docs/...` / see research notes):

> **Open-ended adaptive motion** — the avatar moves into arbitrary, non-hardcoded
> physical positions and behaviors: sitting down for a virtual date, repositioning
> to watch a movie *with* you, novel gestures — driven by the LLM, not a fixed
> clip library.

Plus **real-time voice** and **persistent memory**. The name and all copy should
lean on *alive / present / by-your-side*, NOT generic "waifu" vibes — that both
differentiates and de-risks app-store/payment acceptance.

## 3. Validation mechanism — fake-door, willingness-to-pay

- A polished landing page presenting the product **as if it's about to launch**.
- Real **pricing tiers** are shown. Clicking a paid plan opens an **email capture**
  ("We're onboarding founding members in waves — reserve your spot"). No charge yet.
- This measures **purchase intent**, not idle curiosity — the strongest signal we
  can get pre-build, and the one a pitch deck respects.
- **No free tier.** A hard paywall is the purest willingness-to-pay test, protects
  margins (no subsidizing free LLM+voice+3D compute), and "people kept paying" beats
  "people signed up free." A short **7-day trial** is the only free mechanic, and
  only matters post-build.

### Instrumentation (tell the page builder / set up alongside)
- **Analytics:** Plausible or PostHog (PostHog preferred — funnels + event capture).
- **Track these events:** `view_pricing`, `click_plan_companion`, `click_plan_pro`,
  `submit_email`, plus UTM/traffic source on every event.
- **Email capture backend:** a form posting to Resend / ConvertKit / Loops, or even a
  Google Sheet via a serverless function for v1.
- **Optional stronger signal:** add a 1-question micro-survey after email
  ("What would you use Tonari for?") to feed the platform-direction exploration.

## 4. Success criteria (set the bar BEFORE driving traffic)

- **Primary metric:** unique visitor → clicks a paid plan → submits email.
  - **Healthy:** ~2–5% visitor → paid-intent for a paid consumer product.
  - **Weak:** <1% → messaging or core demand is off; iterate copy/positioning.
- **Secondary:** which tier is clicked (price elasticity), traffic-source quality,
  qualitative survey answers.
- **Sample size:** ≥ a few hundred *targeted* visitors before drawing conclusions.
- **Traffic sources:** niche communities where the audience already congregates —
  relevant subreddits, Discords, X/Twitter, TikTok, weeb/VTuber/companion spaces.
  (Note: many ad platforms restrict companion-app advertising — organic/community
  seeding first.)

## 5. Business model (shown on the page)

Paid-only, two tiers — kept simple to test price elasticity. **Numbers are test
hypotheses, not commitments.**

| | **Companion** | **Companion Pro** |
|---|---|---|
| Price (test) | ~**$15/mo** | ~**$29/mo** |
| Voice conversation | Daily limit | Unlimited |
| Memory | Short-term | Long-term / persistent |
| Characters | 1 | Multiple + custom |
| Experiences | Core chat + presence | Virtual dates, watch-together, scenes |
| Trial | 7-day | 7-day |

Plus a **Founding Member** angle (locked-in lower price / lifetime discount) for
urgency and to reward early signups.

## 6. Future monetization (pitch deck only — NOT the launch model)

Scale-stage, **opt-in, native** contextual monetization: in-world recommendations,
sponsored experiences/cosmetics, brand integrations — closer to product placement
than surveillance display ads. This is the "ad" upside framed for the TAM-expansion
slide. **Never** conversation-mining display ads on intimate data (trust bomb +
GDPR special-category-data risk). Requires explicit consent + scale to be viable.

## 7. Competitive landscape (from naming/availability research, 2026-06)

The anime AI companion space is **hot and crowded** — strong demand validation, but
means differentiation is everything:

- **AIKO: AI Girlfriend 3D Game** (Olympus Studio) — closest existing analog:
  real-time AI conversation + fully animated 3D anime character + voice + persistent
  memory + relationship progression. On Google Play + Steam, thousands of reviews.
- **Yume AI** (yume-ai.org, yumeaichat.com) — anime girlfriend, customization, memory,
  voice (premium), image/video gen.
- **Dokichat** — "Romantic AI Chats," character roleplay.
- **Nakama AI** — "personalized anime companion," launching.
- **Replika / Character.AI / Candy AI** — category incumbents (mostly text/2D/voice).
- **Oshi AI** (oshi.ai) — AI companions / brand ambassadors, Gen Z focus (took the
  "Oshi" name we wanted).

**Takeaway:** chat + a canned-animation 3D avatar is table stakes now. Win on
**adaptive embodiment + the platform vision**, not on being one more anime chat app.

## 8. Naming status

`NAME: TBD`. The pretty-Japanese-word space is exhausted (every good loanword is a
live companion app). A winning name will be **coined/invented** (ownable,
trademarkable) or signal the **alive / by-your-side / embodied** differentiator.
Vet domains + trademarks before committing. Working codename: **Tonari**.
