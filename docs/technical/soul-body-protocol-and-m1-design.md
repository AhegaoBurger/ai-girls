# Soul–Body Protocol & M1 "Wave" — Design Note

**Date:** 2026-06-14
**Status:** design agreed; ready to build (builder implements — see *How we work*).
**Frame:** this is a **learning project** right now, not a product being shipped
(see memory `current-framing-learning-first`). Optimize for understanding and
following the rich threads, with technical rigor.

---

## 1. Purpose

Capture the architecture we converged on for embodying the AI character across
multiple bodies, and define the first concrete milestone (**M1**) — a thin,
on-screen vertical slice that proves the whole thesis in one image.

**The mantra:** *identity is stable, memory accumulates, the body is swappable.*
One **soul**, many **bodies**, joined by one **soul-body-protocol**.

---

## 2. North star & the milestone ladder

North star: the character perceives her environment, decides, and acts in it
through whatever body she's wearing — eventually controlling the **physical
SO-101 arm** to do real-world tasks (the canonical demo: *pour water into a cup*).

`pour water` is deliberately the FAR end — it combines the two hardest robotics
problems (perception + contact/liquid dynamics) and likely exceeds the SO-101's
payload. We ladder up to it; we do not start there.

| Milestone | What works | Deliberately stubbed |
|---|---|---|
| **M0** | VRM on screen: gaze-follows-cursor + idle blink, driven through the protocol | everything else |
| **M1 (this doc)** | Character emits one "wave" intent → **VRM body** *and* **virtual SO-101 body** both wave, split-screen | perception, memory, real LLM, IK, physical hardware |
| M2 | + perception: "point at the named object" (pointing ≫ grasping: no contact, no payload) | grasping, dynamics |
| M3 | + light manipulation: nudge/push, then pick a tiny object | full manipulation |
| … | … | … |
| **M★** | pour water into a cup (physical arm, perception + grasp + dynamics) | — |

M0 and M1 can be merged if the builder prefers — M1 already contains M0's seams.

---

## 3. M1 — the deliverable

> **One screen, split in two. Left: the VRM character waves. Right: a virtual
> SO-101 arm waves. Both triggered by a single intent. A stranger watching
> understands instantly: one mind, two bodies.**

This is a *walking skeleton with a twist*: the thinnest end-to-end thread that
touches every architectural seam once, plus a narrative hook (the character
choosing a physical-style action). It looks like almost nothing and demonstrates
the entire architecture.

Why this is a strong first milestone:
- It's tiny to build, yet proves **one-soul-many-bodies** visibly.
- It forces the hardest abstract decision ("what *is* an intent message?") to be
  made **concretely** — as one real artifact you can hold.
- It establishes the spine every later feature plugs into (real LLM, memory,
  perception, the physical arm) instead of building them in the dark.

Bodies start **virtual**. The builder owns a physical SO-101, but M1 runs the arm
as a simulated body (load its URDF/model into the web scene, drive joint angles
directly). Later, swapping the virtual-arm driver for a real-servo driver — behind
the **same protocol** — makes it physical with no change to soul or protocol.

---

## 4. Architecture & structure

Three top-level conceptual layers, three folders. The names make the repo read as
a sentence: *the **soul** wears **bodies**, connected by the **soul-body-protocol**.*

```
ai-girls/
├── soul/                 # the BRAIN: identity, memory, composer (exists; M1 uses only a stub trigger)
├── soul-body-protocol/   # the INTERFACE: message types both sides depend on; owned by neither
└── bodies/               # the SUBSTRATES (each = its own "expression kit")
    ├── web-vrm/          # three-vrm renderer — first body
    └── robot-arm/        # virtual SO-101 (URDF) now; same code path swaps to real servos later
```

**Why the protocol gets its own home:** it's the neutral interface both brain and
bodies compile against, owned by neither. Keeping it physically separate is what
*enforces* body-agnosticism — a body can't quietly import another body's
internals, so the abstraction can't rot. A folder boundary protects an
architectural one.

**YAGNI on shared implementation:** the "shared motion/perception module that every
body embeds" is real *conceptually*, but with one real body there's nothing to
share yet. Keep per-body logic inside each body; **extract a `shared/` only when a
second body actually forces it.** Rule: *share interfaces early, share
implementations late.* For M1, the only shared artifact is the protocol.

### Data flow (the heart of M1)

```
            SOUL  emits ONE intent  ──►  { gesture: "wave" }
                                              │  broadcast (in-memory bus now; WebSocket when split)
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
              BODY: web-vrm                              BODY: robot-arm (virtual SO-101)
        interprets "wave" → arm-bone               interprets "wave" → scripted
        wave animation on the VRM                  joint-angle trajectory on the URDF
                        │                                           │
                  renders LEFT pane                          renders RIGHT pane
```

---

## 5. The core principle (and the trap)

**Principle:** one body-agnostic intent, broadcast once, **interpreted locally by
each body.** Each body owns its own "how to wave"; the soul knows only *that* it
wants a wave, never *how* any body performs one.

**The trap (what makes it a fake):** sending two *hardcoded* commands — "play VRM
wave clip" to one pane and "run arm wave trajectory" to the other. Same pixels,
opposite architecture, and it proves nothing. The soul must emit a single abstract
intent that is **not** special-cased per body at the soul level.

**Acceptance test for "built right":** adding a *third* body later (e.g. a
Ghost-style orb) makes it wave with **zero changes to `soul/` or
`soul-body-protocol/`** — only a new `bodies/<x>/` with its own wave
interpretation. If that's true, the abstraction holds.

---

## 6. Scope — built vs. stubbed in M1

**Build (thinly):**
- `soul/` — a stub trigger (button or "type hello") that emits the wave intent.
  *No LLM, no memory, no initiative yet.*
- `soul-body-protocol/` — define the **one** message type M1 needs. First real
  protocol artifact; the rest of the protocol grows by this pattern.
- `bodies/web-vrm/` — load the existing VRM; a `wave` entry in its expression kit;
  subscribe to intents; render left pane.
- `bodies/robot-arm/` — load the SO-101 URDF as a virtual arm; `wave` as a scripted
  joint sequence (no IK, no perception); subscribe to the same intents; render
  right pane.
- **transport** — broadcast one intent to both bodies. Start with a shared
  in-memory event bus; move to WebSocket when bodies become separate processes.

**Stub / defer:** perception (sense channel), memory, real LLM, genuine initiative
("wanting"), IK, contact dynamics, physical hardware.

---

## 7. Open design decisions — the builder's *Predict* step

These are intentionally left for the builder to decide before coding (not gaps —
deliberate Predict-step calls). Recommended defaults given; reasoning is the point.

1. **Intent altitude for the wave.**
   - *Recommended for M1:* `{ gesture: "wave" }` — a named gesture both bodies map.
     Concrete, minimal, perfect for a first slice.
   - *Alternative (more form-agnostic):* `{ social: "greet" }` — each body *chooses*
     to wave (or perk up, or bob). Truer to the long-term form-agnostic contract,
     but adds a decision step. Worth adopting only if the builder wants to exercise
     that abstraction now.
   - Decide with reasoning about the tradeoff.

2. **The message shape + the two interpreters.** Sketch the actual intent message
   fields, then what `web-vrm`'s wave-handler does vs. `robot-arm`'s. Confirm each
   body's "how to wave" lives **in the body**, never in the soul.

3. **Transport for M1.** In-memory bus (simplest, single process) vs. WebSocket
   (mirrors the eventual split, more plumbing). Recommended: in-memory now, since
   both bodies render in one web app; introduce WebSocket when a body becomes a
   separate process (e.g. the real arm driver).

---

## 8. Settled context (decisions that frame this)

From earlier sessions and the memories `tech-architecture-direction` /
`product-direction`:

- **Protocol altitude = high-level INTENT**, not a pose stream. Rationale: the
  "clients get more powerful" bet (offloaded-compute AR, improving hardware) lets
  bodies compute motion locally, and intent stays **form-agnostic** so the same
  message drives a humanoid, an orb, or a robot arm. (A pose stream would weld the
  protocol to one skeleton and break across form factors.)
- **The universal loop is sense → think → act.** Every embodied body needs it,
  virtual or physical. Perception is a future **body→brain** channel alongside the
  capabilities handshake; intent is the **brain→body** channel.
- **Sim-first** (the web env is the simulator); design so perception/intent
  transfer to AR and the physical SO-101 later (the robotics *sim-to-real* method).
  Caveat: three.js is a **kinematic** sim (no contact/liquid dynamics) — dynamics
  learning later needs a physics sim (MuJoCo), a separate track.
- **"Do less."** Presence comes from movement + a few expressive cues, not
  photorealism (the avatar-archetype research: EVE/Baymax/Ghost). A small
  parametric **expression kit** per body beats a maintained animation-clip library
  — and sidesteps the clip-maintenance pain that motivated this redesign.
- **Renderer:** web-native **three.js + @pixiv/three-vrm** (web → mobile → WebXR
  from one codebase). Godot is being retired.

---

## 9. How we work (mentor mode)

Per memory `mentor-mode-not-coding`: **the builder writes the code; the mentor
teaches, reviews, and checks.** Loop, per `soul/LEARNING-PATH.md`:
**Predict → Build → Review.**

- *Predict:* builder answers §7 with reasoning; mentor stress-tests (especially:
  is the soul kept ignorant of *how* each body waves?).
- *Build:* builder implements M1.
- *Review:* mentor reviews against the §5 acceptance test and §6 scope.
```

