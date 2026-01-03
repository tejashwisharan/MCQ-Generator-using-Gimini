
export type Difficulty = 'low' | 'medium' | 'high';

export interface MCQ {
  question: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
}

export interface QuizState {
  currentQuestion: MCQ | null;
  history: MCQ[];
  difficulty: Difficulty;
  isGenerating: boolean;
  selectedIndices: number[];
  isSubmitted: boolean;
  pdfBase64: string | null;
  pdfFileName: string | null;
}
