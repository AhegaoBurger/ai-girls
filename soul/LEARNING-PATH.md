# The Soul — Learning Path & Build Plan

**What this is:** a learning-oriented plan for building the character's persistent
*soul* — the personality + memory + relationship state that defines WHO the character
is, stored independently of any avatar or environment. You build it; I teach, review,
and check. (See memory: [[mentor-mode-not-coding]].)

**Locked decisions (yours):**
- **Personality = prompt / character-card** (not fine-tuned). Editable, portable, no
  training-license issues. Re-injected every turn (history alone does NOT guarantee
  consistency).
- **Memory = your own loop**, built from scratch to learn the mechanics.
- **Retrieval: keyword/structured first, vectors later (local-only).** Start with no
  vector store to learn the loop and *feel* the paraphrase gap; add LOCAL, self-hosted
  embeddings as a deliberate Phase 3 upgrade only when keyword recall proves too weak.
  Privacy is preserved either way — see Appendix A. (Storage format and retrieval method
  are independent axes: markdown/Postgres is *where data lives*; keyword/vector is *how
  you find it*.)

**Naming:** recommend renaming this folder `memory/` → `soul/` (the umbrella), with
`memory/` becoming a module *inside* it. Decide before Phase 0 ends.

---

## The architecture in one picture

```
  SOUL (server-side, avatar-independent, per user+character)
  ├── IDENTITY  (stable)      → the character card → rendered into system prompt
  ├── MEMORY    (accumulating)
  │     ├── working    = current chat / context window
  │     ├── episodic   = timestamped events ("what we did")
  │     ├── semantic   = distilled facts ("who they are")
  │     └── procedural = learned patterns ("how to be with them")
  ├── RELATIONSHIP (state)    → milestones, emotional tone, closeness over time
  └── COMPOSER (agent loop)   → assembles each LLM request from the above
                                 ↓
                          the avatar/environment is just a CLIENT this drives
```

The mantra: **identity is stable, memory accumulates, the body is swappable.**

---

## The consequence of "no vectors" (read this first)

The classic retrieval score (Stanford Generative Agents) is
`recency + importance + relevance`. **Relevance, in the original, came from embedding
similarity** — exactly the vector search you don't want. So dropping vectors means you
must supply the *relevance* signal another way. Your options (you'll choose in Phase 3):

- **Full-text search** (e.g. Postgres `tsvector`/FTS): keyword/lexical match. Simple,
  explainable, fast. Weakness: misses paraphrase ("can't sleep" vs "insomnia").
- **Tags / entities:** tag memories with structured keys (people, topics, emotions) and
  match on overlap. More work to extract, but precise and explainable.
- **LLM-as-retriever:** hand the LLM a list and let it pick relevant ones. Flexible,
  but slow and costly per turn.
- **Structured queries only:** lean on recency + importance + explicit relationship
  links, accept weaker semantic recall.

**This is a real tradeoff you are choosing, not a free lunch.** Honest framing: vectors
buy paraphrase-robust recall cheaply; without them you trade some recall for
explainability, simplicity, and learning. That's a defensible choice — just go in
eyes-open, and design so you *could* add an embedding relevance signal later if recall
proves too weak.

---

## Concepts to internalize (primary sources — read, don't skim)

- **Generative Agents** (Park et al., UIST 2023) — memory stream, reflection, and the
  recency(decay 0.995)+importance+relevance retrieval score. arXiv 2304.03442.
- **MemGPT / Letta** (arXiv 2310.08560) — OS-style paging between context window and
  external store; the working-vs-long-term boundary.
- **"Memory for Autonomous LLM Agents"** survey — the 4-layer taxonomy + episodic→
  semantic consolidation + forgetting-as-feature. arXiv 2603.07670 (single-author, not
  peer-reviewed — read critically).
- **Character Card V2 spec** — the portable identity format. github.com/malfoyslastname/
  character-card-spec-v2.
- **Agent_Memory_Techniques** (Apache-2.0, verified) — ~30 teaching notebooks on these
  techniques. Use as a *learning* resource, NOT a production dependency.

---

## Phase 0 — Foundations & decisions (no building yet)
**Learn:** the identity-vs-memory split; the 4 memory layers; what "re-inject identity
every turn" means and why; the no-vector relevance problem above.
**Decide:**
- Folder name (`soul/` vs `memory/`).
- Storage engine. *My steer:* **Postgres** — relational (teaches data modeling), has
  JSONB + full-text search built in (your no-vector relevance signal), and can model
  evolving facts with plain tables/foreign keys. **SQLite** is an even simpler start if
  you want zero infra. (You explicitly don't want a vector DB — good, you don't need one.)
- Where the agent loop lives (your Hono backend, or a small dedicated service).
**Checkpoint → show me:** a one-page written design — your data model sketch for each
memory layer, your chosen relevance signal, and the request-composition order. I'll
poke holes before you write any code.

## Phase 1 — The Identity artifact (personality as a card)
**Learn:** Character Card V2 fields (`description, personality, scenario, first_mes,
mes_example, system_prompt, post_history_instructions`); why `system_prompt` overrides
app defaults; why identity must be re-rendered into the prompt each turn.
**Build:** your own trimmed character schema (start from CCv2, keep what you need);
author one test character; write the function that renders a card → system-prompt text.
**Checkpoint → show me:** your schema + a rendered system prompt. I'll check for gaps
(speaking style, boundaries, how the relationship is framed, refusal behavior).

## Phase 2 — The memory store (data model, no vectors)
**Learn:** relational modeling of episodic (event log) vs semantic (facts) vs procedural
(patterns); timestamps; attribution (who did/said what — user vs companion vs "we");
emotional valence; an `importance` score written at insert time.
**Build:** tables/schema for the layers; a `write_memory()` path that records an
exchange and assigns importance (heuristic or a cheap LLM rating — your call).
**Checkpoint → show me:** schema + sample rows for a few exchanges. I'll probe edge
cases (shared "we" events, contradictions, how you store an evolving fact).

## Phase 3 — The retrieval loop (the heart of it)
**Learn:** the `recency + importance + relevance` score; recency as exponential decay;
importance from write-time; **relevance via your chosen no-vector signal** (FTS / tags /
LLM); top-k selection under a token budget.
**Build:** `retrieve(query, k)` — scores candidate memories and returns the top set to
inject.
**Checkpoint → show me:** retrieval results for 5–10 probe queries against a seeded
history. We evaluate recall quality *together* — this is where your no-vector choice
gets stress-tested, and where you'll learn the most.

## Phase 4 — The composer (assemble the request)
**Learn:** prompt-assembly order (identity anchor → retrieved memories → relationship
state → recent history → user message → post-history instructions); token budgeting;
why order and re-injection matter.
**Build:** `compose_request()` that assembles the full LLM call from all parts.
**Checkpoint → show me:** a full composed prompt for a mid-relationship scenario. I'll
review for prompt leaks, ordering, and budget blowout.

## Phase 5 — Consolidation & forgetting (grows + privacy)
**Learn:** episodic→semantic consolidation (a periodic "reflection" job); decay/
forgetting as a *feature* (robustness + efficiency) AND as your **privacy/deletion**
control; scheduling background jobs.
**Build:** a reflection job that distills episodics into semantic facts; a decay/prune
policy; a hard-delete path (right-to-be-forgotten).
**Checkpoint → show me:** before/after of consolidation over a synthetic history. We
discuss what got promoted vs forgotten, and whether the policy feels human.

## Phase 6 — Portability (same soul, different body)
**Learn:** serializing a soul (identity + memory + relationship) into a portable,
per-user artifact; server-side store vs exportable file; the avatar as a mere client.
**Build:** export/import of a soul; prove one soul can drive two different front-ends.
**Checkpoint → show me:** the same soul "wearing" two clients (even two terminal
sessions is enough to prove the decoupling).

---

## Cross-cutting / ongoing
- **Privacy (open research question):** per-user data isolation, encryption at rest,
  deletion = decay. Intimate data — treat as load-bearing, not an afterthought.
- **Evaluation:** how do you *know* memory works? Define 3–5 scripted scenarios
  ("remembers my birthday weeks later," "drops a stale detail," "stays in character
  after 200 turns") and test against them each phase.
- **License register:** keep noting license + commercial-OK for every tool you touch.

## Decisions still open (we'll work through these as you hit them)
1. Storage engine: Postgres (recommended) vs SQLite (simplest start).
2. Relevance signal without vectors: FTS vs tags/entities vs LLM-retriever (or combo).
3. Importance scoring: heuristic vs cheap-LLM rating.
4. Where the agent loop lives.

## The loop I want us to run on every phase
**Predict → Build → Review.** Before each phase, tell me how *you* think it should work;
I catch flawed assumptions before they cost you hours. Then build. Then show me, and I
review. That cycle is where the learning compounds.

---

## Appendix A — Embeddings (the Phase 3 vector upgrade)

**Use only LOCAL / open-source, self-hosted embeddings** — keeps intimate data on your
box and satisfies the privacy constraint. Never a hosted embedding API for companion
memory (the *text* you embed gets sent to a third party).

**How they work (short version):** an embedding model maps text → a fixed vector of N
floats (commonly 384 / 768 / 1024 dims). The dimensions are NOT hand-labeled axes like
"topic" or "sentiment" — meaning is *distributed* across all of them; what matters is the
**geometry** (similar meanings land at nearby points). The model learns this via
**contrastive training**: shown *positive* pairs (texts that should be similar) and
*negatives* (unrelated), gradient descent pushes positives together and negatives apart.
Base = a Transformer encoder (BERT lineage) pretrained with masked-language-modeling, then
fine-tuned for similarity.

**Starter model (for learning):** `all-MiniLM-L6-v2` — 384-dim, tiny, CPU-fast,
Apache-2.0. Run via `sentence-transformers`. Good enough to *feel* how retrieval changes.

**Quality options when you upgrade (verify license at adoption):**
| Model | Dims | Context | License | Notes |
|---|---|---|---|---|
| all-MiniLM-L6-v2 | 384 | ~256 | Apache-2.0 | tiny/fast starter, CPU |
| bge-small/base-en-v1.5 | 384/768 | 512 | MIT | strong, popular |
| bge-large-en-v1.5 | 1024 | 512 | MIT | higher quality |
| nomic-embed-text-v1.5 | 768 | 8192 | Apache-2.0 | long context (good for chat), open training data |
| e5-large-v2 / multilingual-e5 | 1024 | 512 | MIT | needs `query:` / `passage:` prefixes |
| bge-m3 | 1024 | 8192 | MIT | multilingual + long context |

**Run it locally:** `sentence-transformers` (Python) for prototyping; **Ollama** can serve
`nomic-embed-text` as a simple local server; ONNX/GGUF for lighter deploy. Store vectors in
**pgvector** (a column in your own Postgres) or a local **FAISS** index — both fully
self-hosted.

**Dimension note:** your "~700" ≈ 768, the most common size. More dims ≠ always better —
choose by quality benchmark (**MTEB** leaderboard) + speed, not by dimension count. Some
models support **Matryoshka** truncation (train-time trick that lets you shorten the vector
and keep most of the quality).
