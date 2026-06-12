import type { TavernCardV2, CharacterBook } from "./identity.type";

const CharacterBook: CharacterBook = {
  name: "Testy",
  description: "We are testing",
  scan_depth: 1,
  token_budget: 20000,
  recursive_scanning: true,
  extensions: { "": "" },
  entries: [
    {
      keys: [""],
      content: "",
      extensions: [{ "": "" }],
      enabled: true,
      insertion_order: 1,
      case_sensitive: true,
      // FIELDS WITH NO CURRENT EQUIVALENT IN SILLY
      name: "Name",
      priority: 1,
      // FIELDS WITH NO CURRENT EQUIVALENT IN AGNAI
      id: 1,
      comment: "Comment",
      selective: true,
      secondary_keys: [""],
      position: "before_char",
    },
  ],
};

const CharacterIdentity: TavernCardV2 = {
  spec: "chara_card_v2",
  spec_version: "2.0",
  data: {
    name: "Testy",
    description: "We are testing",
    personality: "Testing persona",
    scenario: "We are in a testing scenario",
    first_mes: "",
    mes_example: "",
    // New fields
    creator_notes: "",
    system_prompt: "MASTER PROMPT",
    post_history_instructions: "",
    alternate_greetings: ["YO", "HI"],
    character_book: CharacterBook,
    // May 8th additions
    tags: ["Tags"],
    creator: "AhegaoBurger",
    character_version: "0.1",
    extensions: [{ "": "" }],
  },
};
