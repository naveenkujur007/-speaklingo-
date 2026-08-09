// Lightweight text-comparison utilities used to score pronunciation.
// We compare what the user actually said (ASR transcript) against the
// target text and produce a 0-100 score plus per-word feedback.

export interface PronunciationResult {
  score: number; // 0-100
  transcript: string;
  matchedWords: string[];
  missedWords: string[];
  extraWords: string[];
  perWord: { word: string; status: "correct" | "missed" | "extra" | "approx" }[];
  feedback: string;
}

// Normalize text: lowercase, strip punctuation, collapse whitespace.
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Levenshtein edit distance between two strings (used for "approx" matches).
function lev(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// A word is "approx" if it's within 1-2 edits of the target word
// (catches ASR errors like "the" vs "da", "want" vs "won't").
function isApproximate(a: string, b: string): boolean {
  if (a === b) return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 2) return false;
  const dist = lev(a, b);
  const threshold = Math.max(1, Math.floor(maxLen / 4));
  return dist <= threshold;
}

export function scorePronunciation(
  targetText: string,
  transcribed: string
): PronunciationResult {
  const targetWords = normalize(targetText);
  const spokenWords = normalize(transcribed);

  const perWord: PronunciationResult["perWord"] = [];
  const matchedWords: string[] = [];
  const missedWords: string[] = [];
  const extraWords: string[] = [];

  // Greedy match each target word against the spoken sequence.
  // We use a simple pointer into spokenWords.
  let spokenIdx = 0;

  for (const tWord of targetWords) {
    // Find the next occurrence of tWord (or an approx match) in spokenWords
    let foundExact = -1;
    let foundApprox = -1;
    for (let i = spokenIdx; i < spokenWords.length; i++) {
      if (spokenWords[i] === tWord) {
        foundExact = i;
        break;
      }
      if (foundApprox === -1 && isApproximate(tWord, spokenWords[i])) {
        foundApprox = i;
      }
    }

    if (foundExact !== -1) {
      matchedWords.push(tWord);
      perWord.push({ word: tWord, status: "correct" });
      // Any spoken words we skipped over are "extra"
      for (let i = spokenIdx; i < foundExact; i++) {
        extraWords.push(spokenWords[i]);
        perWord.push({ word: spokenWords[i], status: "extra" });
      }
      spokenIdx = foundExact + 1;
    } else if (foundApprox !== -1) {
      matchedWords.push(tWord);
      perWord.push({ word: tWord, status: "approx" });
      for (let i = spokenIdx; i < foundApprox; i++) {
        extraWords.push(spokenWords[i]);
        perWord.push({ word: spokenWords[i], status: "extra" });
      }
      spokenIdx = foundApprox + 1;
    } else {
      missedWords.push(tWord);
      perWord.push({ word: tWord, status: "missed" });
    }
  }

  // Remaining spoken words after the last matched target word.
  for (let i = spokenIdx; i < spokenWords.length; i++) {
    extraWords.push(spokenWords[i]);
    perWord.push({ word: spokenWords[i], status: "extra" });
  }

  // Score: weighted by correct (1.0), approx (0.6), missed (0), extra (-0.2)
  const totalTarget = targetWords.length || 1;
  let raw = 0;
  for (const tWord of targetWords) {
    const entry = perWord.find((p) => p.word === tWord);
    if (!entry) continue;
    if (entry.status === "correct") raw += 1.0;
    else if (entry.status === "approx") raw += 0.6;
  }
  // Penalty for extra words (cap so we don't go negative easily)
  const extraPenalty = Math.min(0.3, extraWords.length * 0.05);
  let score = Math.round(((raw / totalTarget) * (1 - extraPenalty)) * 100);
  score = Math.max(0, Math.min(100, score));

  let feedback: string;
  if (score >= 90) feedback = "Excellent! Your pronunciation is very clear. 🎉";
  else if (score >= 75) feedback = "Good job! A few words could be clearer.";
  else if (score >= 50) feedback = "Decent attempt. Try speaking a bit slower and emphasize each word.";
  else feedback = "Keep practicing. Listen to the target, then try again slowly.";

  return {
    score,
    transcript: transcribed,
    matchedWords,
    missedWords,
    extraWords,
    perWord,
    feedback,
  };
}
