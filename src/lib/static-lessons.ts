// Static lessons database — instant content for the Learn section.
// No LLM call needed; lessons are pre-written for common topics.
// When user requests a lesson that's not in this database, the API
// falls back to LLM generation (which takes ~10s).

import type { Lesson } from "./teacher-config";

// Daily-life beginner English lesson (most common first lesson)
const ENGLISH_DAILY_LIFE_BEGINNER: Lesson = {
  language: "english",
  level: "beginner",
  topic: "daily-life",
  title: "My Daily Routine — Hello, World!",
  intro:
    "Welcome to your first English lesson! Today you'll learn to introduce yourself and talk about your daily routine. Let's start with the most common greeting words and basic verbs.",
  vocabulary: [
    { word: "hello", pronunciation: "huh-LO", meaning: "नमस्ते (greeting)", example: "Hello! How are you today?" },
    { word: "morning", pronunciation: "MOR-ning", meaning: "सुबह (morning time)", example: "Good morning! Did you sleep well?" },
    { word: "eat", pronunciation: "EET", meaning: "खाना (verb - to consume food)", example: "I eat breakfast at 8 AM." },
    { word: "drink", pronunciation: "DRINK", meaning: "पीना (verb - to consume liquid)", example: "I drink water every morning." },
    { word: "go", pronunciation: "GO", meaning: "जाना (verb - to move)", example: "I go to work by bus." },
    { word: "come", pronunciation: "KUM", meaning: "आना (verb - to arrive)", example: "Please come here." },
    { word: "work", pronunciation: "WERK", meaning: "काम (noun/verb - job, to do job)", example: "I work in an office." },
    { word: "home", pronunciation: "HOM", meaning: "घर (noun - residence)", example: "I come home at 6 PM." },
  ],
  grammar: {
    title: "Simple Present Tense",
    rule: "Use simple present tense for daily routines and habits. Subject + base verb (+ s for he/she/it).",
    structure: "Subject + Verb (base form) + Object",
    examples: [
      "I wake up at 7 AM.",
      "She drinks coffee every morning.",
      "We eat dinner together.",
    ],
    commonMistakes: [
      {
        wrong: "I goes to school.",
        correct: "I go to school.",
        explanation: "Don't add 's' to verbs after 'I', 'you', 'we', 'they'.",
      },
      {
        wrong: "She don't like coffee.",
        correct: "She doesn't like coffee.",
        explanation: "Use 'doesn't' (not 'don't') after he/she/it.",
      },
    ],
  },
  phrases: [
    { phrase: "Good morning!", meaning: "सुबह प्रणाम!", usage: "Use this greeting before noon." },
    { phrase: "How are you?", meaning: "आप कैसे हैं?", usage: "Polite greeting question." },
    { phrase: "I am fine, thank you.", meaning: "मैं ठीक हूँ, धन्यवाद।", usage: "Reply to 'How are you?'." },
    { phrase: "Nice to meet you.", meaning: "आपसे मिलकर अच्छा लगा।", usage: "When meeting someone for the first time." },
    { phrase: "See you later!", meaning: "बाद में मिलते हैं!", usage: "Casual goodbye." },
  ],
  sentenceBuilding: [
    {
      parts: ["I", "eat", "breakfast"],
      correct: "I eat breakfast.",
      hint: "Subject + verb + object",
    },
    {
      parts: ["She", "drinks", "coffee", "every morning"],
      correct: "She drinks coffee every morning.",
      hint: "Add 's' to 'drink' for 'she'",
    },
    {
      parts: ["We", "go", "to work"],
      correct: "We go to work.",
      hint: "Don't add 's' for 'we'",
    },
  ],
  conversation: [
    { speaker: "A", text: "Good morning! How are you today?", translation: "सुबह प्रणाम! आज आप कैसे हैं?" },
    { speaker: "B", text: "Good morning! I am fine, thank you. And you?", translation: "सुबह प्रणाम! मैं ठीक हूँ, धन्यवाद। और आप?" },
    { speaker: "A", text: "I am great. What do you do every morning?", translation: "मैं बढ़िया हूँ। आप हर सुबह क्या करते हैं?" },
    { speaker: "B", text: "I drink coffee and eat breakfast. Then I go to work.", translation: "मैं कॉफ़ी पीता हूँ और नाश्ता करता हूँ। फिर काम पर जाता हूँ।" },
  ],
  pronunciation: [
    { word: "morning", focus: "Stress on first syllable: MOR-ning", tip: "Open your mouth wide for 'o'." },
    { word: "breakfast", focus: "Break-fast — two clear parts", tip: "Stress on 'break'." },
  ],
  culture: [
    {
      title: "Greetings in English-speaking countries",
      content: "In English-speaking countries, 'How are you?' is often a greeting, not a real question. A short answer like 'I'm fine, thanks!' is expected, even if you're not really fine!",
    },
  ],
  quiz: [
    {
      question: "Which is correct?",
      options: ["I goes to school.", "I go to school.", "I going to school.", "I gone to school."],
      answer: 1,
      explanation: "Use base form 'go' after 'I'.",
    },
    {
      question: "What does 'Good morning' mean?",
      options: ["शुभ रात्रि", "शुभ संध्या", "सुबह प्रणाम", "शुभ दोपहर"],
      answer: 2,
      explanation: "'Good morning' = सुबह प्रणाम (morning greeting).",
    },
    {
      question: "Choose the correct sentence:",
      options: ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."],
      answer: 2,
      explanation: "After 'she', use 'doesn't' + base verb (no 's').",
    },
    {
      question: "How do you say 'I eat breakfast' in present tense?",
      options: ["I eating breakfast.", "I eats breakfast.", "I eat breakfast.", "I am eat breakfast."],
      answer: 2,
      explanation: "Simple present: I + base verb.",
    },
  ],
  homework:
    "Today's homework: 1) Greet 3 people in English. 2) Write 5 sentences about your daily routine using 'I wake up...', 'I eat...', 'I go...', 'I come back...', 'I sleep...'. 3) Practice saying 'Good morning', 'How are you?', 'I am fine, thank you' 10 times.",
};

// Hindi daily-life beginner (similar structure, Hindi version)
const HINDI_DAILY_LIFE_BEGINNER: Lesson = {
  language: "hindi",
  level: "beginner",
  topic: "daily-life",
  title: "मेरी दिनचर्या — नमस्ते!",
  intro:
    "आपके पहले हिंदी पाठ में आपका स्वागत है! आज आप सीखेंगे कि अपना परिचय कैसे दें और अपनी रोज़मर्रा की दिनचर्या के बारे में बात कैसे करें।",
  vocabulary: [
    { word: "नमस्ते", pronunciation: "na-MAS-te", meaning: "Hello (greeting)", example: "नमस्ते! आप कैसे हैं?" },
    { word: "सुबह", pronunciation: "SU-bah", meaning: "Morning", example: "मैं सुबह 7 बजे उठता हूँ।" },
    { word: "खाना", pronunciation: "KHA-na", meaning: "To eat / food", example: "मैं नाश्ता खाता हूँ।" },
    { word: "पीना", pronunciation: "PEE-na", meaning: "To drink", example: "मैं चाय पीता हूँ।" },
    { word: "जाना", pronunciation: "JA-na", meaning: "To go", example: "मैं काम पर जाता हूँ।" },
    { word: "घर", pronunciation: "GHAR", meaning: "Home / house", example: "मैं शाम को घर आता हूँ।" },
  ],
  grammar: {
    title: "Simple Present Tense in Hindi",
    rule: "हिंदी में सामान्य वर्तमान काल के लिए क्रिया के अंत में 'ता/ती/ते हूँ' लगाएं।",
    structure: "Subject + क्रिया + ता/ती/ते + हूँ/हो/है",
    examples: [
      "मैं खाता हूँ। (I eat.)",
      "वह जाती है। (She goes.)",
      "हम खेलते हैं। (We play.)",
    ],
    commonMistakes: [
      {
        wrong: "मैं खाना हूँ।",
        correct: "मैं खाता हूँ।",
        explanation: "क्रिया के अंत में 'ता/ती/ते' जोड़ें, न कि केवल 'हूँ'।",
      },
    ],
  },
  phrases: [
    { phrase: "नमस्ते!", meaning: "Hello!", usage: "Anytime greeting." },
    { phrase: "आप कैसे हैं?", meaning: "How are you?", usage: "Polite greeting question." },
    { phrase: "मैं ठीक हूँ।", meaning: "I am fine.", usage: "Reply to 'How are you?'." },
    { phrase: "फिर मिलेंगे!", meaning: "See you again!", usage: "Casual goodbye." },
  ],
  sentenceBuilding: [
    {
      parts: ["मैं", "नाश्ता", "खाता", "हूँ"],
      correct: "मैं नाश्ता खाता हूँ।",
      hint: "Subject + object + verb + helper",
    },
  ],
  conversation: [
    { speaker: "A", text: "नमस्ते! आप कैसे हैं?", translation: "Hello! How are you?" },
    { speaker: "B", text: "नमस्ते! मैं ठीक हूँ, धन्यवाद। आप?", translation: "Hello! I am fine, thanks. You?" },
    { speaker: "A", text: "मैं भी ठीक हूँ। आप सुबह क्या करते हैं?", translation: "I am also fine. What do you do in the morning?" },
    { speaker: "B", text: "मैं चाय पीता हूँ और नाश्ता करता हूँ।", translation: "I drink tea and have breakfast." },
  ],
  pronunciation: [
    { word: "नमस्ते", focus: "na-MAS-te — stress on middle syllable", tip: "Soft 'n' sound." },
    { word: "सुबह", focus: "SU-bah — stress on first syllable", tip: "Open 'a' at the end." },
  ],
  culture: [
    {
      title: "Greetings in India",
      content: "In India, 'नमस्ते' with folded hands (pranam mudra) is the traditional greeting. It shows respect and is used for everyone — friends, elders, strangers.",
    },
  ],
  quiz: [
    {
      question: "'नमस्ते' का अर्थ क्या है?",
      options: ["Goodbye", "Hello", "Sorry", "Thanks"],
      answer: 1,
      explanation: "'नमस्ते' = Hello/greeting.",
    },
    {
      question: "Correct sentence:",
      options: ["मैं खाना हूँ।", "मैं खाता हूँ।", "मैं खाता है।", "मैं खाते हूँ।"],
      answer: 1,
      explanation: "'मैं' के बाद 'ता हूँ' आता है।",
    },
    {
      question: "'सुबह' का अर्थ?",
      options: ["Evening", "Night", "Morning", "Afternoon"],
      answer: 2,
      explanation: "'सुबह' = Morning.",
    },
  ],
  homework:
    "आज का होमवर्क: 1) 3 लोगों को हिंदी में नमस्ते कहें। 2) अपनी सुबह की दिनचर्या 5 वाक्यों में हिंदी में लिखें।",
};

// Map of static lessons: key = `${language}:${level}:${topic}`
const STATIC_LESSONS: Record<string, Lesson> = {
  "english:beginner:daily-life": ENGLISH_DAILY_LIFE_BEGINNER,
  "hindi:beginner:daily-life": HINDI_DAILY_LIFE_BEGINNER,
};

// Get a static lesson if available
export function getStaticLesson(
  language: string,
  level: string,
  topic: string
): Lesson | null {
  const key = `${language}:${level}:${topic}`;
  return STATIC_LESSONS[key] || null;
}
