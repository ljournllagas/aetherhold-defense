/**
 * Deterministic generator for one gameplay run.
 *
 * Mulberry32: 32-bit state, one integer op chain per call, identical output on every
 * engine. It is deliberately not cryptographic — a seed only has to make a run
 * reproducible, and the seed itself comes from `createRunSeed`.
 */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32 bits of platform randomness, used only to choose a run's seed. */
export function createRunSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}
