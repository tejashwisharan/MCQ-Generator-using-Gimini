
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizStatus, FileData, Question, AppMode, Difficulty } from './types';
import FileUploader from './components/FileUploader';
import ExamConfigurator from './components/ExamConfigurator';
import QuestionCard from './components/QuestionCard';
import { generateQuestions, analyzePerformance } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>({
    mode: null,
    status: 'choosing_mode',
    files: [],
    config: { questionCount: 10, difficulties: ['medium'], questionType: 'mcq', timeLimit: 20 },
    currentQuestionIndex: 0,
    questions: [],
    history: [],
    isGenerating: false,
    startTime: null,
    endTime: null,
    report: null
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const QUICK_QUIZ_BATCH_SIZE = 5;

  useEffect(() => {
    if (state.mode === 'exam' && state.status === 'quiz' && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleExamEnd();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.status, timeLeft, state.mode]);

  const selectMode = (mode: AppMode) => {
    setState(prev => ({ ...prev, mode, status: 'uploading' }));
  };

  const handleUpload = (files: FileData[]) => {
    setState(prev => ({ ...prev, files, status: 'configuring' }));
  };

  const endSession = () => {
    setState({
      mode: null,
      status: 'choosing_mode',
      files: [],
      config: { questionCount: 10, difficulties: ['medium'], questionType: 'mcq', timeLimit: 20 },
      currentQuestionIndex: 0,
      questions: [],
      history: [],
      isGenerating: false,
      startTime: null,
      endTime: null,
      report: null
    });
  };

  const startQuickQuiz = async (diff: Difficulty) => {
    setState(prev => ({ 
      ...prev, 
      config: { ...prev.config, difficulties: [diff], questionType: 'mcq', questionCount: QUICK_QUIZ_BATCH_SIZE },
      isGenerating: true 
    }));
    try {
      const qs = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, [diff], 'mcq');
      setState(prev => ({ 
        ...prev, 
        questions: qs, 
        status: 'quiz', 
        isGenerating: false, 
        currentQuestionIndex: 0,
        history: []
      }));
    } catch (err) {
      alert("Error generating quiz.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const changeQuickQuizDifficulty = async (newDiff: Difficulty) => {
    setState(prev => ({ ...prev, isGenerating: true }));
    try {
      const qs = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, [newDiff], 'mcq');
      setState(prev => ({
        ...prev,
        config: { ...prev.config, difficulties: [newDiff] },
        questions: qs,
        currentQuestionIndex: 0,
        isGenerating: false
      }));
    } catch (err) {
      alert("Failed to update difficulty.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const startExam = async (config: any) => {
    setState(prev => ({ ...prev, config, isGenerating: true }));
    try {
      const qs = await generateQuestions(state.files, config.questionCount, config.difficulties, config.questionType);
      setState(prev => ({ 
        ...prev, 
        questions: qs, 
        status: 'quiz', 
        isGenerating: false, 
        startTime: Date.now(),
        currentQuestionIndex: 0,
        history: []
      }));
      setTimeLeft(config.timeLimit * 60);
    } catch (err) {
      alert("Failed to generate exam.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleAnswerSubmit = (answer: any) => {
    const q = state.questions[state.currentQuestionIndex];
    let isCorrect = false;
    
    if (q.type === 'mcq') {
      const sortedA = [...(answer as number[])].sort();
      const sortedC = [...(q.correctIndices || [])].sort();
      isCorrect = JSON.stringify(sortedA) === JSON.stringify(sortedC);
    } else {
      isCorrect = true; 
    }

    const updatedQ = { ...q, userAnswer: answer, isCorrect };
    setState(prev => ({
      ...prev,
      questions: prev.questions.map((item, i) => i === prev.currentQuestionIndex ? updatedQ : item),
      history: [...prev.history, updatedQ]
    }));
  };

  const nextQuestion = async () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      if (state.mode === 'quiz') {
        setState(prev => ({ ...prev, isGenerating: true }));
        try {
          const newBatch = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, state.config.difficulties, 'mcq');
          setState(prev => ({
            ...prev,
            questions: newBatch,
            currentQuestionIndex: 0,
            isGenerating: false
          }));
        } catch (err) {
          handleExamEnd();
        }
      } else {
        handleExamEnd();
      }
    }
  };

  const handleExamEnd = async () => {
    if (state.mode === 'quiz') {
      setState(prev => ({ ...prev, status: 'summary', endTime: Date.now() }));
      return;
    }
    setState(prev => ({ ...prev, status: 'summary', isGenerating: true, endTime: Date.now() }));
    try {
      const report = await analyzePerformance(state.history);
      setState(prev => ({ ...prev, report, isGenerating: false, status: 'report' }));
    } catch (err) {
      setState(prev => ({ ...prev, isGenerating: false, status: 'summary' }));
    }
  };

  const renderContent = () => {
    switch (state.status) {
      case 'choosing_mode':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
            <button onClick={() => selectMode('quiz')} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left group">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Quick Quiz</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Fast, single-file MCQ practice. Pick a difficulty and jump right in.</p>
            </button>
            <button onClick={() => selectMode('exam')} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left group">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Setup Exam</h3>
              <p className="text-slate-500 leading-relaxed font-medium">Multi-file, custom timer, mixed difficulty, and text answers with AI feedback.</p>
            </button>
          </div>
        );

      case 'uploading':
        return <FileUploader onUpload={handleUpload} maxFiles={state.mode === 'quiz' ? 1 : 5} />;
      
      case 'configuring':
        if (state.mode === 'exam') {
          return <ExamConfigurator filesCount={state.files.length} onStart={startExam} />;
        }
        return (
          <div className="space-y-6 animate-slideUp">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
              <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Quick Quiz Intensity</h2>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block px-1 text-center">Select Difficulty to Start</label>
                {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
                  <button key={d} onClick={() => startQuickQuiz(d)} className="w-full p-6 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-between items-center group">
                    <span className="font-bold text-slate-700 capitalize text-lg">{d} Intensity</span>
                    <svg className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quiz':
        const currentQ = state.questions[state.currentQuestionIndex];
        return (
          <QuestionCard 
            question={currentQ}
            currentIndex={state.currentQuestionIndex}
            total={state.questions.length}
            timeLeft={state.mode === 'exam' ? timeLeft : 0}
            showTimer={state.mode === 'exam'}
            isLoading={state.isGenerating}
            isSubmitted={!!currentQ.userAnswer}
            onSubmit={handleAnswerSubmit}
            onNext={nextQuestion}
            onEnd={endSession}
            onChangeDifficulty={state.mode === 'quiz' ? changeQuickQuizDifficulty : undefined}
            currentDifficulty={state.config.difficulties[0]}
            isQuickQuiz={state.mode === 'quiz'}
          />
        );

      case 'summary':
        if (state.mode === 'quiz') {
          const score = state.history.filter(h => h.isCorrect).length;
          return (
            <div className="bg-white rounded-[40px] p-10 text-center shadow-2xl border border-slate-100 animate-fadeIn">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h2>
              <p className="text-slate-500 mb-8 font-medium">You scored <b>{score}</b> out of <b>{state.history.length}</b></p>
              <button onClick={() => endSession()} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Back to Home</button>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-black text-slate-800">Generating AI Report</h2>
            <p className="text-slate-500">Evaluating your responses for deep analysis...</p>
          </div>
        );

      case 'report':
        return (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-8 animate-fadeIn">
            <header className="text-center">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1 className="text-3xl font-black text-slate-800">Performance Report</h1>
            </header>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Overall Performance</h3><p className="text-slate-800 font-bold text-lg leading-relaxed">{state.report?.overallPerformance}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100"><h3 className="text-xs font-black text-green-600 uppercase tracking-widest mb-3">Key Strengths</h3><ul className="space-y-2">{state.report?.strengths.map((s, i) => (<li key={i} className="text-sm font-bold text-green-800 flex gap-2"><span>•</span> {s}</li>))}</ul></div>
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100"><h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">Identified Weaknesses</h3><ul className="space-y-2">{state.report?.weaknesses.map((w, i) => (<li key={i} className="text-sm font-bold text-red-800 flex gap-2"><span>•</span> {w}</li>))}</ul></div>
            </div>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100"><h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Study Recommendations</h3><ul className="space-y-3">{state.report?.recommendations.map((r, i) => (<li key={i} className="flex gap-3 font-bold"><span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-xs">✓</span>{r}</li>))}</ul></div>
            <button onClick={() => endSession()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl active:scale-95 transition-all">Home Screen</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="mb-10 text-center flex flex-col items-center">
          <div onClick={() => endSession()} className="cursor-pointer bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100 mb-4 transform -rotate-3 active:scale-90 transition-all">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Exam Master AI</h1>
          {state.mode && <span className="mt-2 inline-block px-3 py-1 bg-slate-200 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest">{state.mode} Mode Active</span>}
        </header>

        {renderContent()}

        {state.isGenerating && (state.status === 'configuring' || (state.status === 'quiz' && state.questions.length === 0)) && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-black text-slate-800">Generating Questions</h2>
            <p className="text-slate-500">Tailoring your session based on difficulty...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
