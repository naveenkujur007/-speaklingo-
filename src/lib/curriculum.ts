// Static curriculum data: a structured learning path from A1 (absolute
// beginner) to C2 (mastery). Each language has its own curriculum tree.
//
// For now we ship a full English curriculum (24 lessons across 6 CEFR
// levels). The architecture supports adding more languages later by
// adding more entries to CURRICULA.

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CurriculumNode {
  id: string; // unique within language, e.g. "en-a1-01"
  language: string;
  level: CEFRLevel;
  order: number; // order within the level
  title: string;
  goal: string; // what the learner will be able to do
  topic: string; // maps to TOPICS code for lesson generation
  focus: string; // grammar / vocab focus (short)
  estimatedMinutes: number;
}

export interface CurriculumLevel {
  level: CEFRLevel;
  title: string;
  description: string;
  nodes: CurriculumNode[];
}

export interface Curriculum {
  language: string;
  name: string;
  flag: string;
  levels: CurriculumLevel[];
}

// ---- ENGLISH CURRICULUM ----
// 6 levels x 4 lessons each = 24 lessons total.
// Each lesson maps to a topic the LLM lesson generator already knows,
// plus a grammar focus hint that gets injected into the lesson prompt.
const englishNodes: CurriculumLevel[] = [
  {
    level: "A1",
    title: "A1 · Absolute Beginner",
    description: "Greetings, numbers, basic verbs, simple present. Start here if you're new.",
    nodes: [
      {
        id: "en-a1-01",
        language: "english",
        level: "A1",
        order: 1,
        title: "Hello! Greetings & Introductions",
        goal: "Greet people, introduce yourself, ask someone's name",
        topic: "small-talk",
        focus: "verb 'to be', personal pronouns (I, you, he, she)",
        estimatedMinutes: 15,
      },
      {
        id: "en-a1-02",
        language: "english",
        level: "A1",
        order: 2,
        title: "My Family & Daily Routine",
        goal: "Talk about your family and what you do every day",
        topic: "daily-life",
        focus: "simple present tense, family vocabulary",
        estimatedMinutes: 18,
      },
      {
        id: "en-a1-03",
        language: "english",
        level: "A1",
        order: 3,
        title: "Numbers, Time & Money",
        goal: "Say numbers, tell time, ask prices",
        topic: "shopping",
        focus: "numbers 1-100, asking 'how much', 'what time'",
        estimatedMinutes: 15,
      },
      {
        id: "en-a1-04",
        language: "english",
        level: "A1",
        order: 4,
        title: "Ordering Food & Drinks",
        goal: "Order food in a restaurant, ask for the bill",
        topic: "restaurant",
        focus: "'I would like', 'can I have', polite requests",
        estimatedMinutes: 16,
      },
    ],
  },
  {
    level: "A2",
    title: "A2 · Elementary",
    description: "Past tense, future plans, asking directions, short stories.",
    nodes: [
      {
        id: "en-a2-01",
        language: "english",
        level: "A2",
        order: 1,
        title: "Yesterday I... (Past Simple)",
        goal: "Talk about what you did yesterday / last week",
        topic: "daily-life",
        focus: "past simple (regular & common irregular verbs)",
        estimatedMinutes: 18,
      },
      {
        id: "en-a2-02",
        language: "english",
        level: "A2",
        order: 2,
        title: "Asking for Directions",
        goal: "Ask for and give directions in a new city",
        topic: "travel",
        focus: "prepositions of place, imperatives",
        estimatedMinutes: 16,
      },
      {
        id: "en-a2-03",
        language: "english",
        level: "A2",
        order: 3,
        title: "Tomorrow I Will... (Future)",
        goal: "Talk about weekend plans and future intentions",
        topic: "small-talk",
        focus: "'going to' and 'will' for future",
        estimatedMinutes: 16,
      },
      {
        id: "en-a2-04",
        language: "english",
        level: "A2",
        order: 4,
        title: "Shopping & Comparing",
        goal: "Compare products, ask for sizes and colors",
        topic: "shopping",
        focus: "comparatives & superlatives (-er, -est, more, most)",
        estimatedMinutes: 17,
      },
    ],
  },
  {
    level: "B1",
    title: "B1 · Intermediate",
    description: "Present perfect, conditionals, storytelling, opinions.",
    nodes: [
      {
        id: "en-b1-01",
        language: "english",
        level: "B1",
        order: 1,
        title: "I Have Done... (Present Perfect)",
        goal: "Talk about life experiences and recent actions",
        topic: "daily-life",
        focus: "present perfect (have/has + past participle), ever/never",
        estimatedMinutes: 20,
      },
      {
        id: "en-b1-02",
        language: "english",
        level: "B1",
        order: 2,
        title: "If I Were You... (Conditionals)",
        goal: "Give advice, talk about hypothetical situations",
        topic: "free-talk",
        focus: "first & second conditional (if + would)",
        estimatedMinutes: 20,
      },
      {
        id: "en-b1-03",
        language: "english",
        level: "B1",
        order: 3,
        title: "At the Airport & Hotel",
        goal: "Handle check-in, security, and hotel conversations",
        topic: "travel",
        focus: "modal verbs (can, could, may, must), polite requests",
        estimatedMinutes: 18,
      },
      {
        id: "en-b1-04",
        language: "english",
        level: "B1",
        order: 4,
        title: "Job Interview Basics",
        goal: "Answer common interview questions confidently",
        topic: "interview",
        focus: "talking about strengths, weaknesses, experience",
        estimatedMinutes: 22,
      },
    ],
  },
  {
    level: "B2",
    title: "B2 · Upper-Intermediate",
    description: "Passive voice, reported speech, phrasal verbs, debates.",
    nodes: [
      {
        id: "en-b2-01",
        language: "english",
        level: "B2",
        order: 1,
        title: "It Was Built In... (Passive Voice)",
        goal: "Describe processes and historical events",
        topic: "free-talk",
        focus: "passive voice (be + past participle)",
        estimatedMinutes: 22,
      },
      {
        id: "en-b2-02",
        language: "english",
        level: "B2",
        order: 2,
        title: "He Said That... (Reported Speech)",
        goal: "Report what someone else said",
        topic: "work",
        focus: "reported speech, backshift of tenses",
        estimatedMinutes: 20,
      },
      {
        id: "en-b2-03",
        language: "english",
        level: "B2",
        order: 3,
        title: "Phrasal Verbs at Work",
        goal: "Use common phrasal verbs in office conversations",
        topic: "work",
        focus: "phrasal verbs (take off, look into, set up, etc.)",
        estimatedMinutes: 20,
      },
      {
        id: "en-b2-04",
        language: "english",
        level: "B2",
        order: 4,
        title: "Expressing Opinions & Debating",
        goal: "Agree, disagree, and argue a point politely",
        topic: "free-talk",
        focus: "linking words (however, although, on the other hand)",
        estimatedMinutes: 22,
      },
    ],
  },
  {
    level: "C1",
    title: "C1 · Advanced",
    description: "Subjunctive, inversion, idioms, formal register, nuance.",
    nodes: [
      {
        id: "en-c1-01",
        language: "english",
        level: "C1",
        order: 1,
        title: "If I Were to Go... (Advanced Conditionals)",
        goal: "Use mixed and inverted conditionals naturally",
        topic: "free-talk",
        focus: "mixed conditionals, inversion (Had I known...)",
        estimatedMinutes: 24,
      },
      {
        id: "en-c1-02",
        language: "english",
        level: "C1",
        order: 2,
        title: "Idioms & Metaphors",
        goal: "Understand and use common English idioms",
        topic: "free-talk",
        focus: "idioms (piece of cake, break the ice, hit the books)",
        estimatedMinutes: 22,
      },
      {
        id: "en-c1-03",
        language: "english",
        level: "C1",
        order: 3,
        title: "Business Negotiations",
        goal: "Negotiate, persuade, and reach agreements",
        topic: "work",
        focus: "hedging (tends to, arguably), diplomatic language",
        estimatedMinutes: 25,
      },
      {
        id: "en-c1-04",
        language: "english",
        level: "C1",
        order: 4,
        title: "Telling Stories Like a Native",
        goal: "Narrate personal stories with natural flow",
        topic: "free-talk",
        focus: "narrative tenses, discourse markers, dramatic pauses",
        estimatedMinutes: 24,
      },
    ],
  },
  {
    level: "C2",
    title: "C2 · Mastery",
    description: "Native-like fluency, humor, sarcasm, literary language.",
    nodes: [
      {
        id: "en-c2-01",
        language: "english",
        level: "C2",
        order: 1,
        title: "Humor, Sarcasm & Wit",
        goal: "Understand and use humor, irony, and sarcasm",
        topic: "free-talk",
        focus: "sarcasm cues, double meanings, wordplay",
        estimatedMinutes: 26,
      },
      {
        id: "en-c2-02",
        language: "english",
        level: "C2",
        order: 2,
        title: "Academic & Formal Writing",
        goal: "Express complex ideas in formal academic register",
        topic: "work",
        focus: "nominalization, cleft sentences, formal vocabulary",
        estimatedMinutes: 28,
      },
      {
        id: "en-c2-03",
        language: "english",
        level: "C2",
        order: 3,
        title: "Cultural References & Slang",
        goal: "Understand cultural references and contemporary slang",
        topic: "free-talk",
        focus: "pop culture references, generational slang",
        estimatedMinutes: 25,
      },
      {
        id: "en-c2-04",
        language: "english",
        level: "C2",
        order: 4,
        title: "The Final Stretch · Free Mastery Talk",
        goal: "Hold a 10-minute unscripted conversation on any topic",
        topic: "free-talk",
        focus: "everything — fluency, accuracy, idiomatic range",
        estimatedMinutes: 30,
      },
    ],
  },
];

// ---- Language metadata for universal curriculum generation ----
interface LangMeta {
  code: string;
  name: string;
  flag: string;
  idPrefix: string;
  scriptNote: string;
}

const LANGUAGES_META: LangMeta[] = [
  { code: "english", name: "English", flag: "🇬🇧", idPrefix: "en", scriptNote: "Latin script." },
  { code: "hindi", name: "Hindi", flag: "🇮🇳", idPrefix: "hi", scriptNote: "Devanagari script. Include romanization for beginners." },
  { code: "spanish", name: "Spanish", flag: "🇪🇸", idPrefix: "es", scriptNote: "Latin script. Note tú/usted distinction." },
  { code: "french", name: "French", flag: "🇫🇷", idPrefix: "fr", scriptNote: "Latin script. Include accents. Note tu/vous distinction." },
  { code: "german", name: "German", flag: "🇩🇪", idPrefix: "de", scriptNote: "Latin script. Include umlauts (ä, ö, ü) and eszett (ß). Note du/Sie distinction." },
  { code: "japanese", name: "Japanese", flag: "🇯🇵", idPrefix: "ja", scriptNote: "Hiragana, katakana, kanji. Include romaji for beginners." },
  { code: "chinese", name: "Chinese", flag: "🇨🇳", idPrefix: "zh", scriptNote: "Simplified Chinese characters. Include pinyin with tone marks." },
  { code: "arabic", name: "Arabic", flag: "🇸🇦", idPrefix: "ar", scriptNote: "Arabic script (RTL). Include transliteration for beginners." },
];

// Universal lesson template — same 24-lesson structure for all languages.
interface LessonTemplate {
  order: number;
  title: string;
  goal: string;
  topic: string;
  focus: string;
  estimatedMinutes: number;
}

const LEVEL_TEMPLATES: { level: CEFRLevel; title: string; description: string; lessons: LessonTemplate[] }[] = [
  {
    level: "A1",
    title: "A1 · Absolute Beginner",
    description: "Greetings, numbers, basic verbs, simple present. Start here if you're new.",
    lessons: [
      { order: 1, title: "Hello! Greetings & Introductions", goal: "Greet people, introduce yourself, ask someone's name", topic: "small-talk", focus: "verb 'to be', personal pronouns", estimatedMinutes: 15 },
      { order: 2, title: "My Family & Daily Routine", goal: "Talk about your family and what you do every day", topic: "daily-life", focus: "simple present tense, family vocabulary", estimatedMinutes: 18 },
      { order: 3, title: "Numbers, Time & Money", goal: "Say numbers, tell time, ask prices", topic: "shopping", focus: "numbers 1-100, asking 'how much', 'what time'", estimatedMinutes: 15 },
      { order: 4, title: "Ordering Food & Drinks", goal: "Order food in a restaurant, ask for the bill", topic: "restaurant", focus: "'I would like', 'can I have', polite requests", estimatedMinutes: 16 },
    ],
  },
  {
    level: "A2",
    title: "A2 · Elementary",
    description: "Past tense, future plans, asking directions, short stories.",
    lessons: [
      { order: 1, title: "Yesterday I... (Past Tense)", goal: "Talk about what you did yesterday / last week", topic: "daily-life", focus: "past tense (regular & common irregular verbs)", estimatedMinutes: 18 },
      { order: 2, title: "Asking for Directions", goal: "Ask for and give directions in a new city", topic: "travel", focus: "prepositions of place, imperatives", estimatedMinutes: 16 },
      { order: 3, title: "Tomorrow I Will... (Future)", goal: "Talk about weekend plans and future intentions", topic: "small-talk", focus: "future tense ('going to' or language-specific future forms)", estimatedMinutes: 16 },
      { order: 4, title: "Shopping & Comparing", goal: "Compare products, ask for sizes and colors", topic: "shopping", focus: "comparatives & superlatives", estimatedMinutes: 17 },
    ],
  },
  {
    level: "B1",
    title: "B1 · Intermediate",
    description: "Perfect tenses, conditionals, storytelling, opinions.",
    lessons: [
      { order: 1, title: "I Have Done... (Perfect Tenses)", goal: "Talk about life experiences and recent actions", topic: "daily-life", focus: "perfect tenses (present perfect or language-specific equivalent)", estimatedMinutes: 20 },
      { order: 2, title: "If I Were You... (Conditionals)", goal: "Give advice, talk about hypothetical situations", topic: "free-talk", focus: "conditionals (if-clauses, hypothetical)", estimatedMinutes: 20 },
      { order: 3, title: "At the Airport & Hotel", goal: "Handle check-in, security, and hotel conversations", topic: "travel", focus: "modal verbs (can, could, may, must), polite requests", estimatedMinutes: 18 },
      { order: 4, title: "Job Interview Basics", goal: "Answer common interview questions confidently", topic: "interview", focus: "talking about strengths, weaknesses, experience", estimatedMinutes: 22 },
    ],
  },
  {
    level: "B2",
    title: "B2 · Upper-Intermediate",
    description: "Passive voice, reported speech, idioms, debates.",
    lessons: [
      { order: 1, title: "It Was Built In... (Passive Voice)", goal: "Describe processes and historical events", topic: "free-talk", focus: "passive voice or language-specific equivalent", estimatedMinutes: 22 },
      { order: 2, title: "He Said That... (Reported Speech)", goal: "Report what someone else said", topic: "work", focus: "reported speech, backshift of tenses", estimatedMinutes: 20 },
      { order: 3, title: "Idioms & Expressions at Work", goal: "Use common idioms in office conversations", topic: "work", focus: "idioms and fixed expressions", estimatedMinutes: 20 },
      { order: 4, title: "Expressing Opinions & Debating", goal: "Agree, disagree, and argue a point politely", topic: "free-talk", focus: "linking words (however, although, on the other hand)", estimatedMinutes: 22 },
    ],
  },
  {
    level: "C1",
    title: "C1 · Advanced",
    description: "Subjunctive, inversion, advanced idioms, formal register, nuance.",
    lessons: [
      { order: 1, title: "Advanced Conditionals & Subjunctive", goal: "Use mixed and hypothetical conditionals naturally", topic: "free-talk", focus: "subjunctive mood, mixed conditionals, advanced hypotheticals", estimatedMinutes: 24 },
      { order: 2, title: "Idioms, Metaphors & Wordplay", goal: "Understand and use advanced idioms and metaphors", topic: "free-talk", focus: "idioms, metaphors, figurative language", estimatedMinutes: 22 },
      { order: 3, title: "Business Negotiations", goal: "Negotiate, persuade, and reach agreements", topic: "work", focus: "hedging, diplomatic language, persuasion", estimatedMinutes: 25 },
      { order: 4, title: "Telling Stories Like a Native", goal: "Narrate personal stories with natural flow", topic: "free-talk", focus: "narrative tenses, discourse markers, dramatic pacing", estimatedMinutes: 24 },
    ],
  },
  {
    level: "C2",
    title: "C2 · Mastery",
    description: "Native-like fluency, humor, sarcasm, literary language.",
    lessons: [
      { order: 1, title: "Humor, Sarcasm & Wit", goal: "Understand and use humor, irony, and sarcasm", topic: "free-talk", focus: "sarcasm cues, double meanings, wordplay", estimatedMinutes: 26 },
      { order: 2, title: "Academic & Formal Writing", goal: "Express complex ideas in formal academic register", topic: "work", focus: "nominalization, cleft sentences, formal vocabulary", estimatedMinutes: 28 },
      { order: 3, title: "Cultural References & Slang", goal: "Understand cultural references and contemporary slang", topic: "free-talk", focus: "pop culture references, generational slang", estimatedMinutes: 25 },
      { order: 4, title: "The Final Stretch · Free Mastery Talk", goal: "Hold a 10-minute unscripted conversation on any topic", topic: "free-talk", focus: "everything — fluency, accuracy, idiomatic range", estimatedMinutes: 30 },
    ],
  },
];

// Generate a curriculum for a language from the universal template.
function buildCurriculum(meta: LangMeta): Curriculum {
  const levels: CurriculumLevel[] = LEVEL_TEMPLATES.map((lvl) => ({
    level: lvl.level,
    title: lvl.title,
    description: lvl.description,
    nodes: lvl.lessons.map((lesson) => ({
      id: `${meta.idPrefix}-${lvl.level.toLowerCase()}-${String(lesson.order).padStart(2, "0")}`,
      language: meta.code,
      level: lvl.level,
      order: lesson.order,
      title: lesson.title,
      goal: lesson.goal,
      topic: lesson.topic,
      focus: lesson.focus,
      estimatedMinutes: lesson.estimatedMinutes,
    })),
  }));
  return {
    language: meta.code,
    name: meta.name,
    flag: meta.flag,
    levels,
  };
}

export const CURRICULA: Curriculum[] = LANGUAGES_META.map(buildCurriculum);

// Map of language code -> script note (used by lesson generator).
export const SCRIPT_NOTES: Record<string, string> = Object.fromEntries(
  LANGUAGES_META.map((m) => [m.code, m.scriptNote])
);

export function getCurriculum(language: string): Curriculum | undefined {
  return CURRICULA.find((c) => c.language === language);
}

export function getAllCurriculumNodes(language: string): CurriculumNode[] {
  const c = getCurriculum(language);
  if (!c) return [];
  return c.levels.flatMap((lvl) => lvl.nodes);
}

export function findNode(
  language: string,
  nodeId: string
): CurriculumNode | undefined {
  return getAllCurriculumNodes(language).find((n) => n.id === nodeId);
}

// Map CEFR level to our Difficulty enum (used by lesson generator).
export function cefrToDifficulty(level: CEFRLevel): "beginner" | "intermediate" | "advanced" {
  if (level === "A1" || level === "A2") return "beginner";
  if (level === "B1" || level === "B2") return "intermediate";
  return "advanced";
}

// ---- Achievement definitions ----
export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  icon: string; // emoji
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first-lesson", title: "First Steps", description: "Complete your first lesson", icon: "🎯" },
  { code: "five-lessons", title: "Getting Serious", description: "Complete 5 lessons", icon: "📚" },
  { code: "ten-lessons", title: "Dedicated Learner", description: "Complete 10 lessons", icon: "🏆" },
  { code: "first-quiz-perfect", title: "Quiz Master", description: "Score 100% on a quiz", icon: "🧠" },
  { code: "ten-words", title: "Word Collector", description: "Save 10 words to your bank", icon: "📝" },
  { code: "fifty-words", title: "Walking Dictionary", description: "Save 50 words to your bank", icon: "📖" },
  { code: "3-day-streak", title: "On a Roll", description: "3-day practice streak", icon: "🔥" },
  { code: "7-day-streak", title: "Week Warrior", description: "7-day practice streak", icon: "⚡" },
  { code: "30-day-streak", title: "Unstoppable", description: "30-day practice streak", icon: "🚀" },
  { code: "first-pronunciation", title: "Open Up", description: "Try pronunciation practice", icon: "🗣️" },
  { code: "pronunciation-90", title: "Smooth Talker", description: "Score 90+ on pronunciation", icon: "🎤" },
  { code: "first-conversation", title: "Hello World", description: "Have your first chat conversation", icon: "💬" },
];
