
import React, { useState, useEffect } from 'react';
import { QuizState, Difficulty, MCQ, QuizStatus } from './types';
import PDFUploader from './components/PDFUploader';
import QuestionCard from './components/QuestionCard';
import { generateMCQ } from './services/geminiService';

const STORAGE_KEY = 'quiz_master_session_v2';

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // We do NOT persist the PDF base64 in localStorage due to 5MB limits.
        // If they refresh, they stay in their state but need to keep the app open.
        return { 
          ...parsed, 
          pdfBase64: null, // Reset since it can't be stored
          isGenerating: false, 
          isSubmitted: false, 
          selectedIndices: [] 
        };
      } catch (e) { console.error("Failed to load session", e); }
    }
    return {
      status: 'uploading',
      currentQuestion: null,
      history: [],
      difficulty: 'medium',
      isGenerating: false,
      selectedIndices: [],
      isSubmitted: false,
      pdfBase64: null,
      pdfFileName: null,
      score: { correct: 0, total: 0 }
    };
  });

  // Persist non-heavy state to local storage
  useEffect(() => {
    try {
      const { pdfBase64, ...persistentState } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
    } catch (e) {
      console.warn("Storage quota exceeded, progress might not be saved.", e);
    }
  }, [state]);

  const handleUpload = (base64: string, fileName: string) => {
    setState(prev => ({ 
      ...prev, 
      pdfBase64: base64, 
      pdfFileName: fileName,
      status: 'selecting_difficulty',
      score: { correct: 0, total: 0 },
      history: []
    }));
  };

  const startQuiz = async () => {
    if (!state.pdfBase64) {
      alert("PDF data lost. Please re-upload the file.");
      setState(prev => ({ ...prev, status: 'uploading' }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      status: 'quiz',
      isGenerating: true,
      currentQuestion: null 
    }));

    try {
      const question = await generateMCQ(state.pdfBase64, state.difficulty, []);
      setState(prev => ({ ...prev, currentQuestion: question, isGenerating: false }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false, status: 'uploading' }));
      alert("Failed to process PDF. Please ensure it's a valid text-based PDF.");
    }
  };

  const handleNextQuestion = async () => {
    if (!state.pdfBase64) {
      alert("Session expired. Please re-upload your PDF.");
      setState(prev => ({ ...prev, status: 'uploading' }));
      return;
    }
    
    if (state.score.total >= 10) {
      setState(prev => ({ ...prev, status: 'summary' }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const historyStrings = [...state.history.map(q => q.question), state.currentQuestion?.question || ""];
      const nextQuestion = await generateMCQ(state.pdfBase64, state.difficulty, historyStrings);
      
      setState(prev => ({
        ...prev,
        history: prev.currentQuestion ? [...prev.history, prev.currentQuestion] : prev.history,
        currentQuestion: nextQuestion,
        selectedIndices: [],
        isSubmitted: false,
        isGenerating: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
      alert("Network Error: Could not load next question.");
    }
  };

  const handleSubmit = () => {
    if (!state.currentQuestion) return;
    
    const isAllCorrect = 
      state.currentQuestion.correctIndices.length === state.selectedIndices.length &&
      state.currentQuestion.correctIndices.every(i => state.selectedIndices.includes(i));

    setState(prev => ({
      ...prev,
      isSubmitted: true,
      score: {
        correct: prev.score.correct + (isAllCorrect ? 1 : 0),
        total: prev.score.total + 1
      }
    }));
  };

  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      status: 'uploading',
      currentQuestion: null,
      history: [],
      difficulty: 'medium',
      isGenerating: false,
      selectedIndices: [],
      isSubmitted: false,
      pdfBase64: null,
      pdfFileName: null,
      score: { correct: 0, total: 0 }
    });
  };

  const renderContent = () => {
    switch (state.status) {
      case 'uploading':
        return (
          <div className="space-y-8 animate-fadeIn">
            <header className="text-center">
              <div className="inline-flex p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white mb-6 transform -rotate-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quiz Master</h1>
              <p className="text-slate-500 mt-2 font-medium">Your AI-powered study companion.</p>
            </header>
            <PDFUploader onUpload={handleUpload} />
          </div>
        );

      case 'selecting_difficulty':
        return (
          <div className="space-y-8 animate-slideUp">
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 text-center">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-widest mb-4">Step 2 of 2</span>
                  <h2 className="text-2xl font-black text-slate-800">Select Difficulty</h2>
                  <p className="text-slate-500 text-sm mt-2">How challenging should the questions be?</p>
                </div>
                
                <div className="space-y-4 text-left mb-10">
                  {(['low', 'medium', 'high'] as Difficulty[]).map((level) => (
                    <div 
                      key={level}
                      onClick={() => setState(s => ({...s, difficulty: level}))}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                        state.difficulty === level 
                        ? (level === 'low' ? 'border-green-400 bg-green-50 shadow-md ring-4 ring-green-100' : 
                           level === 'medium' ? 'border-yellow-400 bg-yellow-50 shadow-md ring-4 ring-yellow-100' : 
                           'border-red-400 bg-red-50 shadow-md ring-4 ring-red-100')
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-slate-800 capitalize">{level}: {level === 'low' ? 'Basic Recall' : level === 'medium' ? 'Application' : 'Analysis'}</p>
                        {state.difficulty === level && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                            level === 'low' ? 'bg-green-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {level === 'low' ? 'Focuses on definitions and direct facts. Quick review.' : 
                         level === 'medium' ? 'Understand relationships and core application of concepts.' : 
                         'Complex reasoning and identifying deep implications of the text.'}
                      </p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={startQuiz}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Start Quiz <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
             </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"/></svg>
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">Source</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{state.pdfFileName}</p>
                  </div>
               </div>
               <button onClick={() => { if(confirm("End this session?")) resetSession(); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
               </button>
            </div>

            <div className="flex justify-center">
              <div className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-3 border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
                  state.difficulty === 'low' ? 'bg-green-100 text-green-700' : 
                  state.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {state.difficulty}
                </span>
                <button 
                  onClick={() => setState(s => ({...s, status: 'selecting_difficulty'}))}
                  className="text-[10px] font-bold text-indigo-600 hover:underline active:opacity-60"
                >
                  Change
                </button>
              </div>
            </div>

            {state.isGenerating && !state.currentQuestion ? (
              <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 shadow-xl shadow-indigo-100"></div>
                <div className="text-center">
                  <p className="text-slate-800 font-black text-lg">Reading PDF...</p>
                  <p className="text-slate-500 text-sm mt-1">Generating your custom test</p>
                </div>
              </div>
            ) : state.currentQuestion && (
              <QuestionCard
                question={state.currentQuestion}
                selectedIndices={state.selectedIndices}
                onSelect={(idx) => {
                  if (state.isSubmitted) return;
                  setState(prev => {
                    const selected = [...prev.selectedIndices];
                    const i = selected.indexOf(idx);
                    i > -1 ? selected.splice(i, 1) : selected.push(idx);
                    return { ...prev, selectedIndices: selected };
                  });
                }}
                isSubmitted={state.isSubmitted}
                onSubmit={handleSubmit}
                onNext={handleNextQuestion}
                isLoading={state.isGenerating}
                progress={state.score}
              />
            )}

            <button 
              onClick={() => setState(s => ({...s, status: 'summary'}))}
              className="w-full py-3 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors"
            >
              Finish Session & See Summary
            </button>
          </div>
        );

      case 'summary':
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-indigo-50">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Quiz Complete!</h2>
              <p className="text-slate-500 mb-8">You've mastered content from <b>{state.pdfFileName}</b></p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-400 uppercase">Correct</p>
                  <p className="text-3xl font-black text-indigo-600">{state.score.correct}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                  <p className="text-3xl font-black text-slate-600">{state.score.total}</p>
                </div>
              </div>
              <button onClick={resetSession} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all">Start New PDF</button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      <div className="max-w-xl mx-auto px-4 pt-8">
        {renderContent()}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
