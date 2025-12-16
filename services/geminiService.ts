import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGameOverCommentary = async (score: number): Promise<string> => {
  try {
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

    return response.text || "Better luck next time!";
  } catch (error) {
    console.error("Error fetching AI commentary:", error);
    return "The AI is speechless at your performance (or the network failed).";
  }
};