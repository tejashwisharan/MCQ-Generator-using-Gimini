
export type Difficulty = 'low' | 'medium' | 'high';
export type QuestionType = 'mcq' | 'text' | 'both';
export type AppMode = 'quiz' | 'exam';
export type QuizStatus = 'choosing_mode' | 'uploading' | 'configuring' | 'quiz' | 'summary' | 'report';

export interface FileData {
  name: string;
  type: string;
  base64?: string; // For PDFs
  text?: string;   // For DOCX
}

export interface Question {
  id: string;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];      // For MCQ
  correctIndices?: number[]; // For MCQ
  sampleAnswer?: string;    // For text questions
  explanation: string;
  difficulty: Difficulty;
  userAnswer?: string | number[];
  isCorrect?: boolean;
}

export interface ExamReport {
  overallPerformance: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface QuizState {
  mode: AppMode | null;
  status: QuizStatus;
  files: FileData[];
  config: {
    questionCount: number;
    difficulties: Difficulty[];
    questionType: QuestionType;
    timeLimit: number; // in minutes
  };
  currentQuestionIndex: number;
  questions: Question[];
  history: Question[];
  isGenerating: boolean;
  startTime: number | null;
  endTime: number | null;
  report: ExamReport | null;
}
