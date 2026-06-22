# Research Notes — LLM Memory & Identity Systems

Source material behind [LEARNING-PATH.md](./LEARNING-PATH.md). From a deep-research run
(2026-06-12, ~105 agents, 22 claims confirmed / 3 killed by adversarial verification).
**License caveat:** the licenses of the three frameworks you'd most likely adopt
(Mem0, Letta, Zep/Graphiti) were NOT independently verified — VERIFY EACH DIRECTLY
before depending on it. "Open source" headlines often hide an open-core split.

---

## A. Verified concepts (high confidence — primary sources)

- **Retrieval = recency + importance + relevance** (each normalized 0–1), recency as
  exponential decay (factor 0.995 since last recall), plus periodic reflection. The
  foundational, directly-applicable pattern. — *Generative Agents*, Park et al., UIST
  2023, [arXiv 2304.03442](https://arxiv.org/pdf/2304.03442).
- **Working vs long-term memory / OS-style paging** between context window (fast) and
  external store (slow). — *MemGPT*, [arXiv 2310.08560](https://arxiv.org/abs/2310.08560).
- **Four memory layers:** working / episodic / semantic / procedural. Consensus taxonomy
  (cognitive science → CoALA → modern frameworks). — survey [arXiv 2603.07670](https://arxiv.org/html/2603.07670v1)
  (single-author, non-peer-reviewed — read critically); CoALA [arXiv 2309.02427](https://arxiv.org/abs/2309.02427).
- **Consolidation: episodic → semantic** over repeated interactions is what makes a
  companion "grow with you." — same survey.
- **Forgetting/decay is a FEATURE** — robustness, efficiency, and (for us) the privacy/
  deletion control for intimate data. — same survey.

## B. Memory frameworks / products (survey + link + license status)

| Tool | What it is | Storage | License (VERIFY) |
|---|---|---|---|
| **Mem0** | Managed/embeddable memory layer | vector-centric | ⚠ reported permissive — not verified in research |
| **Zep / Graphiti** | Temporal **knowledge graph** memory (evolving facts over time) | KG | ⚠ **open-core** — Graphiti is the open kernel; full Zep product partly managed/closed. [github/getzep/graphiti](https://github.com/getzep/graphiti) |
| **Letta (MemGPT)** | OS-style self-editing memory, inner monologue, memory pressure | tiered | ⚠ verify. Paper: [arXiv 2310.08560](https://arxiv.org/abs/2310.08560) |
| **LangMem** (LangChain) | Memory utilities within LangChain | mixed | ⚠ verify |
| **Cognee** | Memory + knowledge framework | hybrid | ⚠ verify |
| Others mentioned | MemoryOS, Memary, Redis agent memory, Motorhead | varies | ⚠ verify |
| **Agent_Memory_Techniques** (NirDiamant) | ~30 teaching notebooks on the techniques + the 4 frameworks above | — | ✅ **Apache-2.0 (verified)** — use as a *learning* resource, NOT a production dep. [github](https://github.com/NirDiamant/Agent_Memory_Techniques) |

Landscape comparisons (secondary/blog, for orientation only):
[mcp.directory](https://mcp.directory/blog/mem0-vs-letta-vs-zep-vs-cognee-2026) ·
[particula.tech](https://particula.tech/blog/agent-memory-frameworks-tested-mem0-zep-letta-cognee-2026) ·
[vectorize.io](https://vectorize.io/articles/best-ai-agent-memory-systems) ·
[atlan](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/).

## C. Personality / portable identity

- **Character Card V2 spec** — JSON identity artifact (`description, personality,
  scenario, first_mes, mes_example, system_prompt, post_history_instructions` +
  embedded `character_book` lorebook). `system_prompt` overrides the host app's prompt,
  so identity lives in the portable card, not the application. The proven open pattern
  for decoupling identity from environment/avatar.
  [spec](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md)
- **SillyTavern** as a reference implementation of prompt assembly + scoping:
  [World Info/lorebooks](https://docs.sillytavern.app/usage/core-concepts/worldinfo/) ·
  [Personas](https://docs.sillytavern.app/usage/core-concepts/personas/) ·
  [Prompt assembly order](https://docs.sillytavern.app/usage/prompts/).
  ⚠ Note: a SillyTavern "persona" = the **USER's** identity, not the AI character's.
- **soul.py** — minimal markdown-native soul pattern (`SOUL.md` identity + `MEMORY.md`
  log, no DB, provider-agnostic). Good to STUDY. [github](https://github.com/menonpg/soul.py)
  ⚠ license claimed MIT but that was **REFUTED** — do not ship it.

## D. Killed / refuted claims (kept for honesty + skepticism training)

- ❌ **"soul.py is MIT-licensed"** — refuted (1-2). License unknown; study, don't depend.
- ❌ **"Distribute identity across many anchor files"** (SOUL.md + MEMORY.md + RELATIONS.md
  + SALIENCE.md + …) — refuted **0-3 unanimous**. **Centralize** the store; don't
  over-engineer into a dozen files. (Source: [arXiv 2604.09588](https://arxiv.org/html/2604.09588).)
- ❌ A specific description of SillyTavern lorebook keyword-triggering — refuted (1-2)
  on mechanism details; treat the exact trigger mechanics as "verify in the docs."
- ⚠ **medium confidence:** persona consistency leans on conversation *history*, which is
  implicit, not guaranteed → re-inject the identity anchor every turn.

## E. Open questions (unresolved — design decisions ahead)

1. Exact licenses + open-core splits of Mem0, Letta, Graphiti. **Biggest unresolved input.**
2. Encryption-at-rest / key-management / per-user isolation for intimate memory.
3. Concrete serialization/sync for "same soul, different avatar" portability.
4. Head-to-head latency/cost/accuracy/explainability: vector vs knowledge-graph vs hybrid,
   and at what conversation volume each breaks down.
