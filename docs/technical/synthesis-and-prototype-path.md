# Technical Synthesis & Prototype Path

**Working codename:** Tonari (NAME: TBD)
**Date:** 2026-06-12
**Purpose:** Synthesize the research paths into one architecture + a concrete ladder
to a working, interactive prototype. Sources: two deep-research reports + the
robotics-intersection analysis (see `docs/go-to-market/validation-strategy.md` and
the memory files `product-direction`, `tech-architecture-direction`).

---

## 1. What's already SETTLED (stop re-deciding these)

- **Renderer:** web-native **three.js + @pixiv/three-vrm**. Runs web → mobile → WebXR
  from one codebase; the future-proof / AR bet. (Move off Godot.)
- **Avatar format:** **VRM** (built on glTF) for the *visual + facial* layer. Reuse
  your existing VRoid models; VRoid Studio (free) makes more.
- **Architecture shape:** **engine-agnostic "brain" ↔ thin renderer**, talking a
  **structured motion-INTENT protocol** over WebSocket (not clip-names). You already
  have this bone structure in `VRoidWebSocketController` — keep it, enrich the protocol.
- **Voice stack (open, commercial-safe):** **faster-whisper** (MIT) STT + **Kokoro**
  (Apache-2.0, incl. weights) TTS. Lip-sync from audio locally.
- **Licensing rule:** AVOID the SMPL / AMASS / HumanML3D ecosystem entirely (non-
  commercial, even for training). Permissive CODE ≠ permissive WEIGHTS/DATA — vet
  every asset. Keep a license register.

The ONLY real open architectural decision left is **how ambitious the MOTION layer
is** — and that's a progression, not a fork.

---

## 2. The three motion paths (a ladder, not either/or)

These are the same 3-tier motion stack from the research, framed by effort:

| Path | What the body does | Tech (all commercial-safe) | Effort | Buys you |
|---|---|---|---|---|
| **A. Procedural** | Idle/breathing, gaze, blink, a small blendable gesture set the LLM triggers | three-vrm built-ins; simple in-browser IK (two-bone/CCD) | Days | "Feels alive," validates the *feel* + the plumbing |
| **B. IK-driven (the credible MVP of the moat)** | Positions itself: sit on *this*, reach *that*, lean, orient — solved, not canned | **pink** (Apache, on Pinocchio/BSD) or **mink/mjinx** (MuJoCo) server-side; retarget to VRM | Weeks | Genuine *adaptive positioning* with NO ML training |
| **C. Physics-RL (the true moat)** | Learns physically-plausible, scene-adaptive whole-body motion | **ProtoMotions3** (Apache) / **DeepMimic-AMP** (MIT) trained in **MuJoCo** (Apache) on **clean** data (100STYLE CC-BY + your own capture) | Months + ML infra | The defensible differentiator |

**Strategy:** build A's plumbing now, grow into B as the visible "wow," invest in C as
the moat once there's traction/data. Most of the felt "adaptability" (sit for a date,
reposition for a movie) is achievable at **B** without any model training.

**Explicitly deferred:**
- **OpenUSD** — doable without Omniverse (newton urdf-usd-converter, google/usd_from_gltf,
  both open) but premature for a small team. Keep glTF/VRM as the spine; adopt USD only
  when you need simulation interchange for training.
- **Browser physics (MuJoCo WASM)** — official DeepMind bindings exist but are WIP.
  Compute motion **server-side** and stream poses; revisit WASM later.

---

## 3. Recommended target architecture

```
  ┌────────────────────────── BRAIN (server / Hono) ──────────────────────────┐
  │  mic audio ─► faster-whisper (STT) ─► LLM (tool-calling) ─► Kokoro (TTS)    │
  │                                   │                                        │
  │                         structured INTENT {say, emotion, gaze, gesture,    │
  │                          goal: "sit@couch", reach@target}                  │
  │                                   │                                        │
  │           MOTION ENGINE: Path A procedural  ──►  Path B IK (pink/mink)     │
  │                          ──►  Path C physics-RL policy (later)             │
  │                                   │  solved pose (joint angles)            │
  └───────────────────────────────────┼────────────────────────────────────────┘
                                       │ WebSocket: pose stream + audio
  ┌────────────────────────── RENDERER (browser, three-vrm) ──────────────────┐
  │  load VRM ► apply pose ► retarget ► idle/breathing/blink ► lip-sync from   │
  │  streamed audio amplitude/visemes ► render (web→mobile→XR)                 │
  └────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. THE SIMPLE PROTOTYPE PATH (what you asked for)

A ladder from "something on screen today" to "proves the moat." Each step is
independently playable.

### v0 — Talking 3D avatar in the browser  (~1–2 days) ← start HERE
**Goal:** a VRM character in the browser you can voice-chat with. Validates the feel.

1. **Avatar:** reuse a `.vrm` from `godot/vroid_models/`, or make one in **VRoid
   Studio** (free). Export `.vrm`.
2. **Fastest route — fork an existing open app:**
   - **[semperai/amica](https://github.com/semperai/amica)** (web, VRM, three-vrm,
     chat + voice; permissive) — `git clone`, `npm install`, drop in your avatar,
     `npm run dev`. Talking avatar in the browser the same day.
   - or **[Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber)**
     (more modular, Python backend, swappable STT/LLM/TTS).
3. **Swap in the open stack:** TTS → **Kokoro**, STT → **faster-whisper**. For the
   LLM, just use an **API** for now (e.g. Gemini you already wired, or any) — inference
   has no training-license issue; the self-host decision is a production concern, not a
   prototype one.
4. **Result:** something to look at, talk to, and demo. Also teaches you the three-vrm
   + voice plumbing before you build your own.

### v1 — Make it YOURS + prove the moat seed  (~1–2 weeks)
**Goal:** your own minimal app where the LLM *directs motion via intent*, with one
genuinely adaptive (non-canned) behavior.

1. **New app:** Vite + React + TS + **@pixiv/three-vrm**; load your VRM.
2. **Idle life (Path A):** breathing/sway + auto-blink + procedural **gaze** (VRM
   LookAt follows camera/cursor). This alone sells "alive."
3. **Intent protocol:** reuse your **Hono** backend; LLM returns structured JSON
   `{say, emotion, gaze, gesture}` via tool-calling; push over **WebSocket** to the
   client (mirror your `VRoidWebSocketController` pattern).
4. **Voice loop:** mic → faster-whisper (or Web Speech API to start) → LLM → Kokoro →
   play audio + drive the mouth blendshape from **audio amplitude** (cheap viseme approx).
5. **One adaptive behavior (the differentiator):** let the LLM set a **gaze/reach
   target in 3D space**, solved with simple in-browser IK (e.g. `three-ik`, two-bone/
   CCD), or a "sit" via pose blend. Proves "it positions itself on command" — the thing
   the anime-chat competitors don't do.

### v2 — Real IK engine (Path B)  (later)
- Stand up a **pink/mink** IK service (Python) behind the brain; solve sit/reach/lean
  with joint limits + collision avoidance; **retarget** onto the VRM rig
  ([upf-gti/retargeting-threejs](https://github.com/upf-gti/retargeting-threejs)).
  Stream solved poses to the client.

### v3 — Physics-RL moat (Path C)  (months)
- Train **ProtoMotions3 / DeepMimic-AMP** in **MuJoCo** on **clean** data (100STYLE +
  your own capture). Distill the policy to a small ONNX/tfjs net; run server-side, later
  maybe WASM.

---

## 5. Actionable next steps (do these in order)

1. [ ] Pick the v0 base: **amica** (web-first, recommended) vs Open-LLM-VTuber.
2. [ ] Get a VRM avatar ready (reuse VRoid model or make one).
3. [ ] Run v0 locally; swap in Kokoro + faster-whisper; pick a prototype LLM (API).
4. [ ] Define the **intent JSON schema** (`say, emotion, gaze, gesture, goal`) — this
       is the contract everything else hangs on.
5. [ ] Build v1 as your own three-vrm app around that schema.
6. [ ] Add the one adaptive IK behavior to prove the moat.
7. [ ] Start a **license register** (asset → license → commercial OK?).
8. [ ] (Parallel, non-blocking) source clean motion data beyond 100STYLE; design a
       capture plan (own data = moat).

## 6. Biggest risks (carried from research)
- **Clean motion data at scale** is risk #1 (100STYLE alone is thin). Plan own capture.
- **Physics-RL is real ML infra** (months) — don't start there; IK gets you most of the way.
- **License hygiene** is ongoing: permissive code ≠ permissive weights/data.
- **Browser physics maturity** — default to server-side motion compute.
