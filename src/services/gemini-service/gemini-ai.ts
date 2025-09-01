import { GoogleGenAI } from "@google/genai";
import { Message } from "./services/gemini-service/aiService";

export interface Config {
  GEMINI_API_KEY: string;
}

interface Lesson {
  title: string;
  subject: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  isAIRecommended: true;
  thumbnail: string;
  progress: number;
}

const DEFAULT_THUMBNAILS = [
  "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop",
];

function parseLessons(text: string): Lesson[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const lessons: Lesson[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\d+)\.\s*(.+?)\s*-\s*(.+?)\s*\((.+?)\)$/);

    if (match) {
      const [, , title, subject, difficultyRaw] = match;

      lessons.push({
        title: title.trim(),
        subject: subject.trim(),
        duration: "20-30 min",
        difficulty:
          (difficultyRaw.trim() as "Beginner" | "Intermediate" | "Advanced") ||
          "Intermediate",
        rating: 4.5 + Math.random() * 0.5,
        isAIRecommended: true,
        thumbnail: DEFAULT_THUMBNAILS[i % DEFAULT_THUMBNAILS.length],
        progress: 0,
      });
    }
  }

  return lessons;
}

export async function aiRecommend(context: string, config: Config) {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const prompt = `Suggest 3 personalized study lessons for a student based on the following context:\n\n${context}\n\nPlease format them like this:\n\n1. Lesson Title - Subject (Difficulty)\n2. Lesson Title - Subject (Difficulty)\n3. Lesson Title - Subject (Difficulty)`;

  const ai = new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text || "";

  const suggestions = parseLessons(text);

  return { suggestions };
}

// export async function aiChat(messages: { text: string }[], config: Config) {
//   if (!config.GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY is missing");
//   }

//   const ai = new GoogleGenAI({
//     apiKey: config.GEMINI_API_KEY,
//   });

//   // Join messages into a single prompt string, separated by new lines
//   const prompt = messages.map((m) => m.text).join("\n");

//   const response = await ai.models.generateContent({
//     // model: "gemini-2.5-flash",
//     model: "gemini-2.5-pro",
//     contents: prompt,
//   });

//   return { answer: response.text };
// }

function isBase64(str: string): boolean {
  return /^[A-Za-z0-9+/=]+$/.test(str);
}

export async function aiChat(messages: Message[], config: Config) {
  if (!config.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

  const contents = messages.flatMap((msg) => {
    const parts = [];

    // Always add text if present
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Supported media types with fallback MIME
    const mediaMapping = [
      { key: "image", mime: "image/*" },
      { key: "audio", mime: "audio/*" },
      { key: "video", mime: "video/*" },
      { key: "pdf", mime: "application/pdf" },
    ];

    // ✅ Safe check for real media content
    for (const { key, mime } of mediaMapping) {
      const value = msg[key as keyof Message];

      if (typeof value === "string") {
        const mimeType = msg.mimeType || mime;
        parts.push({
          inlineData: {
            mimeType,
            data: value,
          },
        });
      }
    }

    return { role: "user", parts };
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents,
  });
  console.dir(response, { depth: null });

  // return { answer: response.text };
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  return { answer: text || "No response from model." };
}
