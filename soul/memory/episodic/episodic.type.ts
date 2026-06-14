//
type EpisodicMemory = {
  timestamp: number;
  content: string;
  role: string; // Maybe should be user/companion/we
  valence: string; // positive/negative/intensity
  important: number; // Maybe rename to salience as a score from 0-1
  lastAccessed: number; // timestamp
};
