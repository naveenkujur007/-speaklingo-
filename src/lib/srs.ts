// Simplified SM-2 spaced-repetition algorithm.
// Given the learner's last review quality (0-5), updates the ease factor,
// repetition count, and the next review interval in days.

export interface SrsState {
  ease: number; // 1.3 .. 3.0
  interval: number; // days
  repetitions: number; // consecutive correct
  dueAt: Date;
  lastReviewed: Date | null;
}

export type ReviewQuality = "again" | "hard" | "good" | "easy";

// Map UI buttons to SM-2 quality scores (0-5).
const QUALITY_MAP: Record<ReviewQuality, number> = {
  again: 1, // wrong, reset
  hard: 3, // correct but struggled
  good: 4, // correct with effort
  easy: 5, // perfect, instant recall
};

export function applySrs(
  prev: Pick<SrsState, "ease" | "interval" | "repetitions">,
  quality: ReviewQuality
): Pick<SrsState, "ease" | "interval" | "repetitions" | "dueAt" | "lastReviewed"> {
  const q = QUALITY_MAP[quality];
  const now = new Date();

  let { ease, interval, repetitions } = prev;

  if (q < 3) {
    // Failed — reset repetitions, short interval (10 min re-shown same session,
    // but for daily review we set interval to 0 days = due now)
    repetitions = 0;
    interval = 0;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1; // first successful review → tomorrow
    } else if (repetitions === 1) {
      interval = 3; // second → 3 days
    } else if (repetitions === 2) {
      interval = 7; // third → 1 week
    } else if (repetitions === 3) {
      interval = 14;
    } else if (repetitions === 4) {
      interval = 30;
    } else {
      // After 5+ successful reviews, grow by the ease factor
      interval = Math.round(interval * ease);
      // Cap at 180 days to keep cards from disappearing forever
      interval = Math.min(180, interval);
    }
    repetitions += 1;
  }

  // Update ease factor (SM-2 formula, clamped to [1.3, 3.0])
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < 1.3) ease = 1.3;
  if (ease > 3.0) ease = 3.0;

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + interval);

  return {
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    dueAt,
    lastReviewed: now,
  };
}

// Returns the human-readable label for the next interval.
export function intervalLabel(quality: ReviewQuality, prev: { interval: number; repetitions: number }): string {
  const next = applySrs(prev, quality);
  if (next.interval === 0) return "Again in 10 min";
  if (next.interval === 1) return "Tomorrow";
  if (next.interval < 7) return `In ${next.interval} days`;
  if (next.interval < 30) return `In ${Math.round(next.interval / 7)} weeks`;
  if (next.interval < 60) return "In 1 month";
  return `In ${Math.round(next.interval / 30)} months`;
}
