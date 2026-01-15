
export type Difficulty = 'low' | 'medium' | 'high';
export type QuizStatus = 'uploading' | 'selecting_difficulty' | 'quiz' | 'summary';

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
}

export interface QuizState {
  status: QuizStatus;
  currentQuestion: MCQ | null;
  history: MCQ[];
  difficulty: Difficulty;
  isGenerating: boolean;
  selectedIndices: number[];
  isSubmitted: boolean;
  pdfBase64: string | null;
  pdfFileName: string | null;
  score: {
    correct: number;
    total: number;
  };
}
