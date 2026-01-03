
import React, { useState, useCallback } from 'react';
import { QuizState, Difficulty, MCQ } from './types';
import PDFUploader from './components/PDFUploader';
import DifficultySelector from './components/DifficultySelector';
import QuestionCard from './components/QuestionCard';
import { generateMCQ } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>({
    currentQuestion: null,
    history: [],
    difficulty: 'medium',
    isGenerating: false,
    selectedIndices: [],
    isSubmitted: false,
    pdfBase64: null,
    pdfFileName: null,
  });

  const handleUpload = async (base64: string, fileName: string) => {
    setState(prev => ({ 
      ...prev, 
      pdfBase64: base64, 
      pdfFileName: fileName,
      isGenerating: true 
    }));

    try {
      const question = await generateMCQ(base64, state.difficulty, []);
      setState(prev => ({
        ...prev,
        currentQuestion: question,
        isGenerating: false
      }));
    } catch (error) {
      console.error("Error generating question:", error);
      setState(prev => ({ ...prev, isGenerating: false }));
      alert("Failed to generate question. Please check your API key or file.");
    }
  };

  const handleNextQuestion = async () => {
    if (!state.pdfBase64) return;

    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const historyQuestions = state.history.map(q => q.question);
      if (state.currentQuestion) historyQuestions.push(state.currentQuestion.question);
      
      const nextQuestion = await generateMCQ(state.pdfBase64, state.difficulty, historyQuestions);
      
      setState(prev => ({
        ...prev,
        history: prev.currentQuestion ? [...prev.history, prev.currentQuestion] : prev.history,
        currentQuestion: nextQuestion,
        selectedIndices: [],
        isSubmitted: false,
        isGenerating: false
      }));
    } catch (error) {
      console.error("Error generating question:", error);
      setState(prev => ({ ...prev, isGenerating: false }));
      alert("Failed to generate the next question.");
    }
  };

  const handleOptionToggle = (index: number) => {
    setState(prev => {
      const current = [...prev.selectedIndices];
      const found = current.indexOf(index);
      if (found > -1) {
        current.splice(found, 1);
      } else {
        current.push(index);
      }
      return { ...prev, selectedIndices: current };
    });
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setState(prev => ({ ...prev, difficulty: d }));
  };

  const handleSubmit = () => {
    setState(prev => ({ ...prev, isSubmitted: true }));
  };

  const resetQuiz = () => {
    setState({
      currentQuestion: null,
      history: [],
      difficulty: 'medium',
      isGenerating: false,
      selectedIndices: [],
      isSubmitted: false,
      pdfBase64: null,
      pdfFileName: null,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              PDF Quiz Master
            </h1>
          </div>
          <p className="text-slate-600">Turn your study materials into interactive practice tests.</p>
        </header>

        <main className="flex flex-col items-center gap-8">
          {!state.pdfBase64 ? (
            <div className="w-full max-w-xl">
              <PDFUploader onUpload={handleUpload} />
            </div>
          ) : (
            <div className="w-full space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="truncate max-w-[200px] sm:max-w-xs">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active File</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{state.pdfFileName}</p>
                  </div>
                  <button 
                    onClick={resetQuiz}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold ml-2 underline underline-offset-2"
                  >
                    Change
                  </button>
                </div>

                <DifficultySelector 
                  current={state.difficulty} 
                  onChange={handleDifficultyChange}
                  disabled={state.isGenerating}
                />
              </div>

              {state.isGenerating && !state.currentQuestion ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-600 font-medium">Analyzing document and crafting your first question...</p>
                </div>
              ) : state.currentQuestion ? (
                <QuestionCard
                  question={state.currentQuestion}
                  selectedIndices={state.selectedIndices}
                  onSelect={handleOptionToggle}
                  isSubmitted={state.isSubmitted}
                  onSubmit={handleSubmit}
                  onNext={handleNextQuestion}
                  isLoading={state.isGenerating}
                />
              ) : null}
            </div>
          )}
        </main>

        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} PDF Quiz Master. Powered by Gemini AI.</p>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
