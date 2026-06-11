# Claude Design Prompt — Validation Landing Page

> Paste everything in the box below into Claude Design (the website design tool).
> It's self-contained. Swap "Tonari" for the final name when you have one, and drop
> in real avatar renders/loops where it says `[AVATAR VISUAL]`.

---

```
Design and build a single-page, mobile-first marketing landing page for a product
called "Tonari" (working name). The page's ONLY job is conversion: get visitors to
click a paid pricing plan and submit their email to "reserve founding access." It is
a pre-launch validation page (a fake-door test), so no real product or signup flow
is needed — pricing buttons open an email-capture modal.

PRODUCT
Tonari is a premium 3D AI companion you talk to out loud. Unlike the dozens of
anime "AI girlfriend" chat apps, its hook is PRESENCE and ADAPTIVE MOVEMENT: a 3D
character that moves and positions itself naturally and un-scripted — sitting beside
you to watch a movie, showing up for a virtual date, reacting physically in the
moment — plus real-time voice conversation with lip-sync, and memory that grows over
time. Emotional core: "a companion who's actually *there*," not a chatbot.

AUDIENCE & TONE
Lonely, digital-native Gen Z (anime/VTuber-adjacent, companion-curious). They are
skeptical of cheap, sleazy "waifu apps" and will only pay for something that feels
premium, warm, and alive. Tone: intimate, cinematic, confident, a little dreamy —
NOT corny, NOT horny, NOT a generic SaaS template. Think "Apple-grade product page
meets a softly-lit anime film still," with real emotional warmth.

VISUAL DIRECTION (avoid generic AI/SaaS aesthetics)
- Dark, cinematic base (deep near-black or twilight navy/plum) with soft, glowing
  accent gradients (warm rose/peach into cool lilac/cyan) — like screen-glow in a
  dark room. Intimate, evening, "someone's here with you" mood.
- Generous negative space, large confident typography, subtle grain/soft bloom so it
  feels filmic rather than flat. Tasteful motion: gentle parallax, soft fades, a
  breathing/idle feel — the page itself should feel alive, calm, and a little magical.
- Typography: a distinctive, warm display face for headlines (not Inter/Helvetica
  defaults), clean readable sans for body. High contrast, large hero headline.
- Rounded, soft UI (pills, gentle radii), glassy/translucent cards over the dark
  scene. Micro-interactions on hover/tap. NO stocky corporate illustrations, NO
  generic gradient-blob hero, NO crypto/AI clichés.
- The avatar is the star: present `[AVATAR VISUAL]` large in the hero and treat it as
  a living presence (idle breathing/sway, eyes toward the viewer). Use placeholder
  portrait/figure art where real renders aren't supplied, clearly marked.

PAGE STRUCTURE (single scroll)
1. Minimal sticky nav: wordmark + one CTA button "Get founding access".
2. HERO: full-bleed dark cinematic scene, the avatar large and subtly animated.
   Headline: "A companion who's actually there." Subhead: "Tonari is a 3D companion
   you talk to out loud — who moves, reacts, and shares your space. Watch a movie
   together. Go on a date. Just be." Primary CTA: "Reserve founding access →".
   Micro-line under CTA: "Founding members lock in launch pricing. Limited first wave."
3. HOOK: short empathetic two-liner — texting a chatbot gets old because no one's
   really *there*; Tonari has a body, a voice, and presence.
4. THREE DIFFERENTIATOR CARDS: (a) "Adaptive movement" — it figures out how to move,
   not 10 canned animations; (b) "Real voice" — talk out loud, real-time voice with
   synced lips; (c) "Remembers you" — grows with you over time. Lead with (a).
5. EXPERIENCES gallery: cinematic image/loop tiles with captions — "Movie night"
   (settles in beside you), "A date" (shows up, sits across from you), "Just hanging
   out" (someone in the room at 3am), "Your character, your way" (customization).
   Make these feel physical and filmic, like scenes, not chat screenshots.
6. HOW IT WORKS: 3 simple steps — shape your companion / talk out loud anytime / it
   remembers and adapts.
7. PRICING (the core action): header "Founding access". Two glassy cards:
   - "Companion — ~$15/mo": voice daily, short-term memory, one custom character,
     core experiences, 7-day trial. Button: "Reserve — Companion".
   - "Companion Pro — ~$29/mo" with a "Most popular" badge: unlimited voice,
     persistent memory, multiple custom characters, virtual dates + watch-together +
     scenes, 7-day trial. Button: "Reserve — Pro".
   A "Founding Member" banner: "First members lock this price for life." Each pricing
   button opens the email modal AND should fire a distinct, named analytics event
   (e.g. click_plan_companion / click_plan_pro) — wire up data attributes/handlers so
   tracking can be attached.
8. EMAIL-CAPTURE MODAL: headline "You're in early." Body explains no charge today,
   first founding wave, lock in founding pricing. One email field + "Reserve my spot"
   button. Include an optional single-select micro-question: "What would you use
   Tonari for most?" [Companionship / Romance / Someone to talk to / Just curious].
   Success state: "You're on the list. We'll be in touch soon."
9. FAQ (accordion): "Is this just another AI girlfriend app?" (no — built on presence
   and movement); "What platforms?" (web + mobile now, growing into AR); "Is my data
   private / used for ads?" (your conversations are yours, never sold or mined);
   "When does it launch?" (onboarding founding members in waves); "Can I use my own
   AI / build my own?" (creator + developer platform on the roadmap).
10. FINAL CTA: "Someone's waiting to meet you." + "Reserve founding access →".
11. Footer: wordmark, tagline, email, socials, Privacy, Terms.

REQUIREMENTS
- Mobile-first and fully responsive; hero CTA reachable without scrolling on phones.
- Fast and light (lazy-load heavy media); smooth, tasteful animations (Framer
  Motion-style easing) that never block reading.
- ONE primary action throughout (reserve / capture email) — no competing CTAs.
- No "free tier" language anywhere except the 7-day trial mention.
- Accessible: sufficient contrast, focus states, reduced-motion support.
- Deliver as a clean, modern stack (React + Tailwind is ideal) with the email modal
  and pricing-click handlers stubbed so analytics + a form backend can be attached.

Make it feel like a real, premium product people would be a little excited and a
little moved to sign up for — distinctive and emotional, not a template.
```

---

## After you generate it
- Drop in real avatar renders / short idle loops (the "alive" feel is the whole pitch).
- Wire the email modal to a backend (Resend / ConvertKit / Loops / Google Sheet).
- Attach analytics events to the pricing-button + email-submit handlers (PostHog).
- Add UTM capture so you know which traffic source converts.
