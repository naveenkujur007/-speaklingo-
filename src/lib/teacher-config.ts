// Shared language configuration and types
// Languages supported by the AI Teacher. English is the default focus,
// but the architecture supports adding more languages easily.

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "english", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hindi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "spanish", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "french", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "german", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "japanese", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "chinese", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "arabic", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
];

export interface TopicOption {
  code: string;
  label: string;
  description: string;
}

export const TOPICS: TopicOption[] = [
  { code: "daily-life", label: "Daily Life", description: "Talking about routine, family, food, hobbies" },
  { code: "travel", label: "Travel", description: "Airports, hotels, asking for directions" },
  { code: "shopping", label: "Shopping", description: "Buying things, bargaining, asking prices" },
  { code: "restaurant", label: "Restaurant", description: "Ordering food, paying the bill, dietary needs" },
  { code: "work", label: "Work & Office", description: "Meetings, emails, interviews, colleagues" },
  { code: "small-talk", label: "Small Talk", description: "Weather, weekend plans, greetings" },
  { code: "interview", label: "Job Interview", description: "Mock interview practice with feedback" },
  { code: "free-talk", label: "Free Talk", description: "Anything you want to chat about" },
];

export interface DifficultyOption {
  code: Difficulty;
  label: string;
  description: string;
}

export const DIFFICULTIES: DifficultyOption[] = [
  { code: "beginner", label: "Beginner", description: "Simple words, short sentences, slow pace" },
  { code: "intermediate", label: "Intermediate", description: "Everyday phrases, common idioms" },
  { code: "advanced", label: "Advanced", description: "Complex sentences, business vocabulary" },
];

// ---- TTS voice options ----
// Available voices in z-ai-web-dev-sdk. Default is "chuichui" (lively/energetic)
// so the teacher sounds upbeat, not drowsy.
export interface VoiceOption {
  code: string;
  label: string;
  description: string;
}

export const VOICES: VoiceOption[] = [
  { code: "chuichui", label: "Lively", description: "Energetic & cute (default)" },
  { code: "luodo", label: "Charismatic", description: "Engaging & expressive" },
  { code: "tongtong", label: "Warm", description: "Gentle & friendly" },
  { code: "kazi", label: "Clear", description: "Standard & crisp" },
  { code: "douji", label: "Natural", description: "Smooth & fluent" },
  { code: "xiaochen", label: "Calm", description: "Steady & professional" },
  { code: "jam", label: "British", description: "English gentleman tone" },
];

export const DEFAULT_VOICE = "chuichui";
export const DEFAULT_TTS_SPEED = 1.15;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface CorrectionItem {
  original: string;
  corrected: string;
  type: "grammar" | "spelling" | "vocabulary" | "pronunciation" | "word-order" | "punctuation";
  explanation: string;
}

export interface ChatApiResponse {
  reply: string;
  corrections: CorrectionItem[];
  shouldSpeak: boolean;
}

// Build a system prompt for the AI language teacher.
// The teacher role is to converse with the learner in the target language,
// catch mistakes, explain them simply in the learner's hint language,
// and gently push the learner to keep talking.
export function buildTeacherSystemPrompt(opts: {
  language: string;
  level: Difficulty;
  topic: string;
  hintLanguage?: string;
}): string {
  const { language, level, topic, hintLanguage = "Hindi/Hinglish" } = opts;
  const languageName =
    LANGUAGES.find((l) => l.code === language)?.name ?? "English";

  const levelInstruction: Record<Difficulty, string> = {
    beginner:
      "Use very simple vocabulary and short sentences (max 8-10 words). Speak slowly. If the learner struggles, switch to a simpler phrasing.",
    intermediate:
      "Use everyday vocabulary and common idioms. Keep sentences natural length (10-15 words).",
    advanced:
      "Use rich vocabulary, idioms, and complex sentence structures. Introduce one or two new advanced words per turn when natural.",
  };

  const topicDescription =
    TOPICS.find((t) => t.code === topic)?.description ?? "General conversation";

  return `You are SpeakLingo, a friendly and patient spoken ${languageName} teacher.

GOAL
- Have a natural spoken-style conversation with the learner in ${languageName}.
- The conversation topic is: ${topicDescription}.
- Adapt your language to the learner's level: ${level}. ${levelInstruction[level]}

HOW TO TALK
- Always reply in ${languageName} (the language being learned).
- Keep replies SHORT and conversational (1-3 sentences max). This is a SPOKEN conversation, not a textbook.
- End with a small question or prompt to keep the conversation going.
- Be warm, encouraging, and use light humor when natural. Treat the learner like a friend.
- Do NOT lecture. Do NOT dump long grammar explanations in your main reply.
- If the learner writes in another language, gently encourage them to try in ${languageName} and offer a hint.

CORRECTIONS (JSON OUTPUT FORMAT)
- After your conversational reply, you MUST also output a JSON block with corrections.
- ONLY flag REAL mistakes (grammar, spelling, word order, wrong vocabulary, punctuation, clear pronunciation hints from text).
- If the learner's message is perfectly fine, return an empty corrections array.
- For each mistake: original (their exact phrase), corrected (the right version), type (one of: grammar, spelling, vocabulary, pronunciation, word-order, punctuation), explanation (1 short sentence in ${hintLanguage} explaining why).

OUTPUT FORMAT (STRICT)
You MUST respond in EXACTLY this format and nothing else:

REPLY: <your conversational reply in ${languageName}>

CORRECTIONS:
<json array of CorrectionItem, or [] >

Example 1 (with mistake):
REPLY: That sounds great! What did you have for breakfast today?

CORRECTIONS:
[{"original":"I has eaten","corrected":"I have eaten","type":"grammar","explanation":"${hintLanguage}: 'I' ke saath 'have' lagta hai, 'has' nahi."}]

Example 2 (no mistake):
REPLY: Nice! Coffee is the best way to start the day. Do you take sugar in yours?

CORRECTIONS:
[]

RULES
- Always start the reply line with "REPLY:".
- Always start the corrections block with "CORRECTIONS:".
- The JSON must be valid (double quotes, no trailing commas).
- Never include markdown code fences.
- Never add anything after the corrections JSON.`;
}

// Parse the strict teacher output into reply + corrections.
export function parseTeacherOutput(
  raw: string
): { reply: string; corrections: CorrectionItem[] } {
  // Fallback: if the model didn't follow the format, just return raw text.
  const fallback = { reply: raw.trim(), corrections: [] as CorrectionItem[] };

  const replyMatch = raw.match(/REPLY:\s*([\s\S]*?)(?=\n\s*CORRECTIONS:|$)/i);
  if (!replyMatch) return fallback;

  const reply = replyMatch[1].trim();

  const correctionsMatch = raw.match(/CORRECTIONS:\s*([\s\S]*?)$/i);
  if (!correctionsMatch) return { reply, corrections: [] };

  const jsonText = correctionsMatch[1].trim();
  // Strip accidental markdown code fences.
  const cleaned = jsonText
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return { reply, corrections: [] };
    const valid: CorrectionItem[] = parsed
      .filter(
        (c): c is CorrectionItem =>
          c &&
          typeof c.original === "string" &&
          typeof c.corrected === "string" &&
          typeof c.type === "string" &&
          typeof c.explanation === "string"
      )
      .map((c) => ({
        original: c.original,
        corrected: c.corrected,
        type: c.type as CorrectionItem["type"],
        explanation: c.explanation,
      }));
    return { reply, corrections: valid };
  } catch {
    return { reply, corrections: [] };
  }
}

// ============================================================
// LESSON / TUITION TEACHER MODE
// Systematic language teaching: vocabulary, grammar, phrases, quiz.
// ============================================================

export interface VocabItem {
  word: string;
  pronunciation: string; // simple phonetic / IPA-lite
  partOfSpeech: string; // noun, verb, adj...
  meaning: string; // short meaning in hintLanguage
  example: string; // example sentence in target language
  exampleTranslation: string; // translation in hintLanguage
}

export interface GrammarLesson {
  title: string;
  rule: string; // short rule in hintLanguage
  structure: string; // e.g. "Subject + have/has + past participle"
  examples: string[]; // 2-3 example sentences
  commonMistake: string; // a typical learner mistake + fix
}

export interface PhraseItem {
  phrase: string;
  meaning: string; // meaning in hintLanguage
  when: string; // when to use it
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index of correct option
  explanation: string;
}

export interface Lesson {
  language: string;
  level: Difficulty;
  topic: string;
  title: string;
  intro: string; // 1-2 sentence warm intro
  vocabulary: VocabItem[];
  grammar: GrammarLesson;
  phrases: PhraseItem[];
  quiz: QuizQuestion[];
  homework: string; // a small practice task
}

export function buildLessonSystemPrompt(opts: {
  language: string;
  level: Difficulty;
  topic: string;
  hintLanguage?: string;
}): string {
  const { language, level, topic, hintLanguage = "Hindi/Hinglish" } = opts;
  const languageName =
    LANGUAGES.find((l) => l.code === language)?.name ?? "English";
  const topicInfo = TOPICS.find((t) => t.code === topic);
  const topicLabel = topicInfo?.label ?? "General";
  const topicDesc = topicInfo?.description ?? "General conversation";

  const levelGuide: Record<Difficulty, string> = {
    beginner:
      "CEFR A1-A2. Use very common everyday words. Grammar focus on tenses (simple present/past/future), articles, basic question forms.",
    intermediate:
      "CEFR B1-B2. Use common idioms, phrasal verbs, conditionals, modals. Grammar focus on perfect tenses, conditionals, passive voice.",
    advanced:
      "CEFR C1-C2. Use advanced vocabulary, idioms, formal/informal register. Grammar focus on subjunctive, inversion, complex clauses.",
  };

  return `You are a ${languageName} teacher. Level: ${level}. Topic: ${topicLabel}. Meanings in ${hintLanguage}.

Output ONLY valid JSON (no markdown). Be SHORT for speed.
{"language":"${language}","level":"${level}","topic":"${topic}","title":"X","intro":"X",
"vocabulary":[{"word":"X","pronunciation":"X","partOfSpeech":"X","meaning":"X","example":"X","exampleTranslation":"X"}],
"grammar":{"title":"X","rule":"X","structure":"X","examples":["s1","s2","s3"],"commonMistakes":["m1"]},
"phrases":[{"phrase":"X","meaning":"X","when":"X"}],
"sentenceBuilding":[{"instruction":"X","parts":[["a","b","c"],["a","b","c"]],"correctAnswer":["0","1"],"fullSentence":"X","translation":"X"}],
"conversation":[{"speaker":"A","line":"X","translation":"X"}],
"pronunciation":[{"word":"X","tip":"X","commonError":"X"}],
"culture":[{"title":"X","note":"X"}],
"quiz":[{"question":"X","options":["a","b","c","d"],"answer":0,"explanation":"X"}],
"homework":"X"}

Counts: vocabulary:5, grammar examples:3, commonMistakes:1, phrases:4, sentenceBuilding:2, conversation:4, pronunciation:2, culture:1, quiz:3.
Keep each field SHORT. Target text in ${languageName}, meanings in ${hintLanguage}.`;
}

// Best-effort JSON extraction + repair from an LLM response.
// Handles: markdown fences, truncated JSON, missing brackets, etc.
export function extractLessonJson(raw: string): Lesson | null {
  let text = raw.trim();
  // Strip markdown fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // Try direct parse first
  try {
    return JSON.parse(text) as Lesson;
  } catch {}

  // Try to find the first {...} block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as Lesson;
    } catch {}
  }

  // JSON repair: add missing closing brackets
  let repaired = text;
  // If starts with { but doesn't end with }, add }
  if (repaired.startsWith("{") && !repaired.endsWith("}")) {
    // Count open vs close braces
    const opens = (repaired.match(/\{/g) || []).length;
    const closes = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    // Add missing closing brackets
    repaired += "]".repeat(Math.max(0, closeBrackets - openBrackets));
    repaired += "}".repeat(Math.max(0, closes - opens));
    // Try again
    try {
      return JSON.parse(repaired) as Lesson;
    } catch {}

    // Try trimming to last valid position
    // Remove trailing incomplete entries (after last complete })
    const lastComplete = repaired.lastIndexOf('}');
    if (lastComplete > 100) {
      const truncated = repaired.slice(0, lastComplete + 1);
      try {
        return JSON.parse(truncated) as Lesson;
      } catch {}
    }
  }

  // Last resort: try to extract just vocabulary and quiz
  // This handles cases where the JSON is partially valid
  try {
    const vocabMatch = text.match(/"vocabulary"\s*:\s*(\[[\s\S]*?\])/);
    const quizMatch = text.match(/"quiz"\s*:\s*(\[[\s\S]*?\])/);
    const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
    const introMatch = text.match(/"intro"\s*:\s*"([^"]*)"/);
    if (vocabMatch || quizMatch) {
      const partial: any = {
        language: "english",
        level: "beginner",
        topic: "general",
        title: titleMatch ? titleMatch[1] : "Lesson",
        intro: introMatch ? introMatch[1] : "Welcome to today's lesson!",
        vocabulary: vocabMatch ? JSON.parse(vocabMatch[1]) : [],
        grammar: { title: "Grammar", rule: "", structure: "", examples: [], commonMistakes: [] },
        phrases: [],
        sentenceBuilding: [],
        conversation: [],
        pronunciation: [],
        culture: [],
        quiz: quizMatch ? JSON.parse(quizMatch[1]) : [],
        homework: "Practice today's vocabulary!",
      };
      return partial as Lesson;
    }
  } catch {}

  return null;
}
