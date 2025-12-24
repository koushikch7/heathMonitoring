
import { GoogleGenAI, Type } from "@google/genai";
import { HealthMetrics, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHealthMetrics = async (metrics: HealthMetrics): Promise<AIInsight> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these health metrics from a Galaxy Watch 7 LTE: ${JSON.stringify(metrics)}. 
    Provide a professional health summary, 3 actionable recommendations, and a risk level classification.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          riskLevel: { 
            type: Type.STRING, 
            enum: ["Low", "Moderate", "High"] 
          }
        },
        required: ["summary", "recommendations", "riskLevel"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AIInsight;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Could not analyze health data.");
  }
};
