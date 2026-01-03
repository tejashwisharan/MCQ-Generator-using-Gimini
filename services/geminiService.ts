
import { GoogleGenAI, Type } from "@google/genai";
import { MCQ, Difficulty } from "../types";

export const generateMCQ = async (
  pdfBase64: string,
  difficulty: Difficulty,
  previousQuestions: string[]
): Promise<MCQ> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const difficultyPrompt = {
    low: "easy, fundamental concepts, direct facts",
    medium: "intermediate, application-based, requires some inference",
    high: "complex, advanced reasoning, synthesizes multiple parts of the document"
  }[difficulty];

  const prompt = `Based on the attached PDF document, generate exactly ONE unique multiple-choice question. 
  The difficulty level should be ${difficulty} (${difficultyPrompt}).
  Ensure the question is different from these previous questions: ${previousQuestions.join(' | ')}.
  The question can have one or more correct answers (Multiple Select is allowed).
  Provide a detailed explanation for why the answers are correct.`;

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
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The text of the multiple choice question.",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 4 possible options.",
          },
          correctIndices: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Indices of the correct options in the options array.",
          },
          explanation: {
            type: Type.STRING,
            description: "Explanation for the correct answer(s).",
          },
        },
        required: ["question", "options", "correctIndices", "explanation"],
      },
    },
  });

  const result = JSON.parse(response.text || '{}');
  return result as MCQ;
};
