export type SemanticMemory = {
  subject: string; // user
  predicate: string; // dislikes
  object: string; // smalltalk
  confidence: number;
  provenance: number; // ID of the episodic memory/log this was distilled form
  validFrom: number; // useful for e.g. user lives in Berlin
  validUntil: number; // useful for e.g. user moved to Munich
};
