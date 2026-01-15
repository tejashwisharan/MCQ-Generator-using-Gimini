import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty, FileData, QuestionType, ExamReport } from "../types";

// Always initialize GoogleGenAI with the API key from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestions = async (
  files: FileData[],
  count: number,
  difficulties: Difficulty[],
  type: QuestionType
): Promise<Question[]> => {
  // Use gemini-3-pro-preview for complex text generation tasks like exam creation.
  
  const fileParts = files.map(f => {
    if (f.type === 'application/pdf' && f.base64) {
      return { inlineData: { mimeType: 'application/pdf', data: f.base64 } };
    }
    return { text: `Content from ${f.name}:\n${f.text}` };
  });

  const promptText = `Act as an expert examiner. Generate ${count} exam questions based on the provided documents.
  Difficulties to include: ${difficulties.join(', ')}.
  Question types: ${type === 'both' ? 'Mix of multiple choice and short answer' : type === 'mcq' ? 'All multiple choice' : 'All short answer'}.

  STRICT JSON FORMAT:
  Return an array of objects. Each object must have:
  - type: "mcq" or "text"
  - question: the question text
  - difficulty: "low", "medium", or "high"
  - explanation: pedagogical explanation
  - For MCQ: options (4 strings), correctIndices (array of integers)
  - For Text: sampleAnswer (ideal short answer)`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...fileParts,
        { text: promptText }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["mcq", "text"] },
            question: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["low", "medium", "high"] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            sampleAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["type", "question", "difficulty", "explanation"]
        }
      },
    },
  });

  // Directly access the .text property of GenerateContentResponse.
  const results = JSON.parse(response.text || '[]');
  return results.map((r: any) => ({
    ...r,
    id: Math.random().toString(36).substring(7)
  }));
};

export const analyzePerformance = async (questions: Question[]): Promise<ExamReport> => {
  // Use gemini-3-pro-preview for advanced performance analysis reasoning.
  const historyText = questions.map(q => {
    const status = q.type === 'mcq' 
      ? (q.isCorrect ? "Correct" : "Incorrect")
      : `User Answer: ${q.userAnswer}\nSample Answer: ${q.sampleAnswer}`;
    return `Q: ${q.question}\nResult: ${status}\nExplanation: ${q.explanation}`;
  }).join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Based on this exam performance, provide a professional analysis.
    Performance Data:
    ${historyText}

    Output JSON format:
    {
      "overallPerformance": "summary string",
      "strengths": ["list of areas/concepts done well"],
      "weaknesses": ["list of areas/concepts needing improvement"],
      "recommendations": ["specific study advice"]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallPerformance: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["overallPerformance", "strengths", "weaknesses", "recommendations"]
      }
    }
  });

  // Directly access the .text property of GenerateContentResponse.
  return JSON.parse(response.text || '{}');
};