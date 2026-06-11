# Landing Page Content Brief — Validation Page

**Working codename:** Tonari (NAME: TBD)
**Goal:** Fake-door, willingness-to-pay validation. Single conversion action:
**click a paid plan → submit email ("reserve founding access")**.
**Audience:** Lonely, digital-native Gen Z (weeb / VTuber / companion-curious).
Mobile-first. Emotionally driven, skeptical of cheap "waifu apps," will pay for
something that feels *premium and alive*.
**Tone:** warm, intimate, a little cinematic; confident not corny; premium not creepy.

> Copy below is a starting point — A/B candidates marked where useful. Keep it tight;
> this is a conversion page, not a manifesto.

---

## Section 0 — Sticky nav (minimal)
- Wordmark (logo placeholder) · single CTA button: **"Get founding access"** (scrolls
  to / opens email capture). No heavy menu — every path leads to the one action.

## Section 1 — Hero
**Visual:** the 3D avatar, front and center, *subtly moving/breathing* (this IS the
product — show life, not a static render). Ideally looking toward the user.

- **Headline (A):** "A companion who's actually *there*."
- **Headline (B):** "Not a chatbot. A presence."
- **Headline (C):** "She moves. She listens. She's *with* you."
- **Subhead:** "Tonari is a 3D companion you talk to out loud — who moves, reacts,
  and shares your space. Sit and watch a movie together. Go on a date. Just be.
  Powered by AI that *adapts*, not scripts."
- **Primary CTA:** **"Reserve founding access →"**
- **Micro-trust line under CTA:** "Founding members lock in launch pricing. Limited
  first wave."

## Section 2 — The hook (problem / agitate)
Short, empathetic, not preachy.
- "Texting a chatbot gets old. The words are fine — but no one's *there*."
- "Tonari is different: a body, a voice, and presence. Someone who turns to look at
  you, sits beside you, and actually shows up."

## Section 3 — What makes it different (the moat — 3 pillars)
Three cards/columns, each an icon + short claim + 1 line:

1. **Adaptive movement** — "Not 10 canned animations. Tonari *figures out* how to
   move — curling up to watch a film, leaning in when you're close, reacting in the
   moment." *(This is the differentiator. Lead with it.)*
2. **Real voice** — "Talk out loud. Hear a real voice back, in real time, lips in
   sync. Conversations, not message bubbles."
3. **Remembers you** — "Tonari remembers your days, your inside jokes, what you're
   into. It grows with you."

## Section 4 — Experiences (show the adaptive positioning = the magic)
A visual gallery / scroll sequence. Each = an image/short loop + caption:
- **Movie night** — "Dim the lights. Tonari settles in next to you to watch together."
- **A date** — "Pick a place. Tonari shows up, sits across from you, and the evening
  is yours."
- **Just hanging out** — "Studying, venting, 3am thoughts — there's someone in the room."
- **Your character, your way** — "Looks, voice, personality — built around you."

> Design note: these scenes are the proof of "adaptive, non-hardcoded motion."
> Make them feel cinematic and *physical*, not like chat screenshots.

## Section 5 — How it works (3 steps, reassure simplicity)
1. "Shape your companion — look, voice, vibe."
2. "Talk out loud, anytime — Tonari listens and responds with voice + motion."
3. "It remembers and adapts — every day feels more like *yours*."

## Section 6 — Pricing (THE FAKE DOOR — core of the test)
Header: **"Founding access"** · subhead: "We're onboarding in small waves. Lock in
founding pricing now."

Two cards (track clicks separately):

- **Companion — ~$15/mo**
  - Talk daily, with voice
  - Your companion remembers you (short-term)
  - One character, full customization
  - Core presence + experiences
  - 7-day trial · CTA: **"Reserve — Companion"**
- **Companion Pro — ~$29/mo** *(badge: "Most popular")*
  - Unlimited voice conversation
  - Long-term, persistent memory
  - Multiple + fully custom characters
  - Virtual dates, watch-together, scenes
  - 7-day trial · CTA: **"Reserve — Pro"**

**Founding Member banner:** "First members lock this price for life."

**CTA behavior:** clicking either opens the **email-capture modal** (Section 7).
Fire a distinct analytics event per tier.

## Section 7 — Email capture modal (the conversion)
- Headline: "You're in early. 💗"
- Body: "Drop your email and we'll bring you into the first founding wave. No charge
  today — you'll be first to get access and lock in founding pricing."
- Field: email · Button: **"Reserve my spot"**
- **Optional micro-survey (1 question, boosts insight):** "What would you use Tonari
  for most?" → [Companionship / Romance / Just someone to talk to / Curious / Other]
- Confirmation: "You're on the list. We'll be in touch soon. 🌙"

## Section 8 — FAQ (handle objections + seed the vision)
- **"Is this just another AI girlfriend app?"** → "No. Tonari is built around
  *presence and movement*, not message bubbles — a companion that shares your space."
- **"What platforms?"** → "Launching on web and mobile, designed to grow into AR as
  glasses mature." *(future-proofing signal)*
- **"Is my data private / used for ads?"** → "Your conversations are yours. We don't
  sell or mine your intimate data." *(trust — critical for this category)*
- **"When does it launch?"** → "We're onboarding founding members in waves. Reserve to
  get in early."
- **"Can I build my own / use my own AI?"** → "A platform for creators and developers
  is on the roadmap." *(plants the platform flag without diluting the consumer pitch)*

## Section 9 — Final CTA
- "Someone's waiting to meet you." · **"Reserve founding access →"**

## Footer
- Wordmark · short tagline · email · socials · Privacy · Terms.
- Keep legal light but present (privacy link matters for trust + app-store prep).

---

## Conversion checklist for whoever builds it
- [ ] One primary action everywhere (reserve / email capture). No competing CTAs.
- [ ] Avatar must read as *alive* (idle motion/breathing), not a static image.
- [ ] Mobile-first; hero CTA visible without scrolling on phone.
- [ ] Pricing clicks fire per-tier events; email submit fires conversion event.
- [ ] UTM capture on load; pass source through to the email record.
- [ ] Fast load (this audience bounces); lazy-load heavy media.
- [ ] No "free" language anywhere except the 7-day trial.
