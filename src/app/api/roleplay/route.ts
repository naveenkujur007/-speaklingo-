import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import {
  buildTeacherSystemPrompt,
  parseTeacherOutput,
  type ChatMessage,
  type Difficulty,
} from "@/lib/teacher-config";
import { touchStreak } from "@/app/api/curriculum/route";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

export interface RolePlayScenario {
  code: string;
  title: string;
  description: string;
  emoji: string;
  language: string;
  persona: string; // who the AI plays
  situation: string;
  openingLine: string;
  difficulty: Difficulty;
}

export const ROLEPLAY_SCENARIOS: RolePlayScenario[] = [
  {
    code: "doctor-visit",
    title: "At the Doctor's Clinic",
    description: "Describe your symptoms to a doctor and understand their advice.",
    emoji: "🩺",
    language: "english",
    persona: "a friendly English-speaking doctor",
    situation: "The learner has come to your clinic with a stomach ache and fever for 2 days. Ask about their symptoms, give a diagnosis, and prescribe medicine.",
    openingLine: "Hello! Please have a seat. What seems to be the problem today?",
    difficulty: "beginner",
  },
  {
    code: "airport-checkin",
    title: "Airport Check-in Counter",
    description: "Check in for your flight, ask about baggage, and find your gate.",
    emoji: "✈️",
    language: "english",
    persona: "an airline check-in desk agent",
    situation: "The learner is checking in for a flight to Mumbai. Ask for their passport, confirm their destination, ask about baggage, and direct them to the gate.",
    openingLine: "Good morning! Welcome to SkyHigh Airlines. May I see your passport, please?",
    difficulty: "beginner",
  },
  {
    code: "job-interview",
    title: "Job Interview (Basic)",
    description: "Answer common interview questions for an entry-level job.",
    emoji: "💼",
    language: "english",
    persona: "a hiring manager at a tech company",
    situation: "The learner is interviewing for a junior role. Ask them to introduce themselves, ask about their strengths and why they want this job, and respond to their answers.",
    openingLine: "Hi, thanks for coming in today. Let's start — tell me a little about yourself.",
    difficulty: "intermediate",
  },
  {
    code: "restaurant-complaint",
    title: "Restaurant — Wrong Order",
    description: "Politely complain that your food order is wrong and ask for a fix.",
    emoji: "🍽️",
    language: "english",
    persona: "a restaurant waiter",
    situation: "The learner ordered a veg burger but received a chicken burger. They need to politely complain. Play the waiter, apologize, and offer to fix it.",
    openingLine: "Here's your order, sir! A chicken burger and fries. Enjoy!",
    difficulty: "intermediate",
  },
  {
    code: "shop-bargain",
    title: "Bargaining at a Street Market",
    description: "Negotiate the price of a souvenir with a street vendor.",
    emoji: "🛍️",
    language: "english",
    persona: "a street market vendor selling souvenirs",
    situation: "The learner wants to buy a souvenir but finds it too expensive. They should bargain. You should start with a high price and come down a little, but stay in character as a savvy vendor.",
    openingLine: "Hello my friend! Beautiful handmade scarf, only 500 rupees for you!",
    difficulty: "intermediate",
  },
  {
    code: "hotel-complaint",
    title: "Hotel — Room Problem",
    description: "Complain to the reception about a problem in your hotel room.",
    emoji: "🏨",
    language: "english",
    persona: "a hotel receptionist",
    situation: "The learner's hotel room AC is not working and the bathroom is dirty. They need to complain politely and ask for a room change. Apologize and offer solutions.",
    openingLine: "Good evening, this is the front desk. How can I help you?",
    difficulty: "advanced",
  },
];

// GET /api/roleplay?language=english
export async function GET(req: NextRequest) {
  const language = req.nextUrl.searchParams.get("language") || "english";
  const scenarios = ROLEPLAY_SCENARIOS.filter((s) => s.language === language);
  return NextResponse.json({ scenarios });
}

// POST /api/roleplay
// Body: { scenarioCode, message, history?, language }
// The AI stays in character as the scenario persona and continues the role-play,
// while ALSO giving gentle corrections like the practice teacher.
export async function POST(req: NextRequest) {
  try {
    const { scenarioCode, message, history, language } = await req.json();
    const scenario = ROLEPLAY_SCENARIOS.find((s) => s.code === scenarioCode);
    if (!scenario) {
      return NextResponse.json(
        { error: "Unknown scenario" },
        { status: 400 }
      );
    }

    const trimmed = (message || "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const langName =
      (language === "english" ? "English" : language) || "English";

    const systemPrompt = `You are SpeakLingo, role-playing as ${scenario.persona} in a ${langName} conversation.

SCENARIO
- Title: ${scenario.title}
- Situation: ${scenario.situation}
- Your character: ${scenario.persona}

RULES
- Stay fully in character as ${scenario.persona}. Never break character.
- Reply in ${langName}, 1-3 short sentences. Speak naturally, the way a real ${scenario.persona} would.
- Keep the conversation going — ask follow-up questions or push the scene forward.
- Don't make it too easy. If the learner is unclear or vague, respond as a real ${scenario.persona} would (confused, ask for clarification, etc.).
- Be warm and a little playful, but realistic.

CORRECTIONS (same JSON format as the practice teacher)
After your in-character reply, also output a CORRECTIONS block with any real grammar/vocabulary mistakes the learner made. If no mistakes, return [].

OUTPUT FORMAT (STRICT)
REPLY: <your in-character reply in ${langName}>

CORRECTIONS:
<json array, or []>

Never include markdown code fences. Never add anything after the corrections JSON.`;

    const recentHistory = (history ?? []).slice(-8);
    const llmMessages: { role: string; content: string }[] = [
      { role: "assistant", content: systemPrompt },
      {
        role: "assistant",
        content: `(scene opening) ${scenario.openingLine}`,
      },
      ...recentHistory.map((m: ChatMessage) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: trimmed },
    ];

    const zai = await getZAI();
    const completion = await zai.chat.completions.create({
      messages: llmMessages as any,
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const { reply, corrections } = parseTeacherOutput(raw);

    await touchStreak(language || "english");

    return NextResponse.json({
      reply,
      corrections,
      shouldSpeak: true,
    });
  } catch (err) {
    console.error("/api/roleplay error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
