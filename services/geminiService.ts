import { GoogleGenAI } from "@google/genai";

// Offline commentary database
const FALLBACK_COMMENTS = {
  low: [
    "Gravity: 1, You: 0. Want to try that again?",
    "That was... brief. Very brief.",
    "I've seen rocks fly better than that.",
    "Did you forget to flap? It helps.",
    "Oof. That pipe came out of nowhere, didn't it?",
    "My grandmother flies better than that!"
  ],
  mid: [
    "Not bad! You're getting the hang of these wings.",
    "Solid effort. Mediocrity achieved!",
    "Double digits! We've got a pilot in the making.",
    "Respectable. But can you beat the high score?",
    "You're flying like a pro... mostly."
  ],
  high: [
    "ABSOLUTE LEGEND! The skies belong to you!",
    "Incredible! Are you actually a bird?",
    "High score alert! You are the wind beneath my wings.",
    "Unstoppable! The pipes are trembling in fear.",
    "Gaming perfection. Take a bow!"
  ]
};

const getFallbackComment = (score: number) => {
  let category: 'low' | 'mid' | 'high';
  if (score < 10) category = 'low';
  else if (score < 30) category = 'mid';
  else category = 'high';
  
  const options = FALLBACK_COMMENTS[category];
  return options[Math.floor(Math.random() * options.length)];
};

export const getGameOverCommentary = async (score: number): Promise<string> => {
  const apiKey = process.env.API_KEY;

  // If no API key is provided, simulate a short delay and return local response
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    await new Promise(resolve => setTimeout(resolve, 500)); // Fake network delay
    return getFallbackComment(score);
  }

  try {
    // Only initialize AI if key exists
    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-2.5-flash";
    
    let prompt = "";
    if (score < 5) {
      prompt = `A player just played a Flappy Bird clone and failed miserably with a score of ${score}. Roast them gently but funnily in one short sentence.`;
    } else if (score < 20) {
      prompt = `A player scored ${score} in a Flappy Bird clone. Give them a mildly impressed but still sarcastic one-sentence comment.`;
    } else {
      prompt = `A player just scored an amazing ${score} in a Flappy Bird clone. Praise them like they are a god, but keep it brief (one sentence).`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || getFallbackComment(score);
  } catch (error) {
    console.warn("AI Service unavailable, switching to offline mode.");
    return getFallbackComment(score);
  }
};