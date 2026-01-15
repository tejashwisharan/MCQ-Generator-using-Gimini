
import { GoogleGenAI, Type } from "@google/genai";
import { MCQ, Difficulty } from "../types";

export const generateMCQ = async (
  pdfBase64: string,
  difficulty: Difficulty,
  previousQuestions: string[]
): Promise<MCQ> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const difficultyContext = {
    low: "Focus on basic recall, definitions, and explicit facts found in the text.",
    medium: "Focus on application of concepts, comparisons, and identifying relationships.",
    high: "Focus on critical analysis, synthesis of multiple sections, and complex problem-solving."
  }[difficulty];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          { 
            text: `Act as a professional educational assessment designer.
            Create ONE high-quality multiple-choice question from this PDF.
            
            STRICT RULES:
            1. Difficulty: ${difficulty} (${difficultyContext}).
            2. Do NOT repeat or closely mimic these questions: ${previousQuestions.slice(-5).join(' | ')}.
            3. Provide 4 distinct options.
            4. At least one option must be correct. Multiple select is allowed.
            5. The explanation must be pedagogical, explaining why the correct answers are right and why distractors are wrong.
            6. Output strictly in JSON format.`
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 4,
            maxItems: 4
          },
          correctIndices: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER }
          },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "correctIndices", "explanation"],
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  return {
    ...result,
    id: Math.random().toString(36).substring(7)
  } as MCQ;
};
