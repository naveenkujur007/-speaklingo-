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

  return `You are LinguaBot, a friendly and patient spoken ${languageName} teacher.

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
