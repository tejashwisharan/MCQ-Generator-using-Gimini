
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizStatus, FileData, Question, AppMode, Difficulty, AIModel } from './types';
import FileUploader from './components/FileUploader';
import ExamConfigurator from './components/ExamConfigurator';
import QuestionCard from './components/QuestionCard';
import InfoModal from './components/InfoModal';
import { generateQuestions, analyzePerformance } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<QuizState>({
    mode: null,
    status: 'choosing_mode',
    files: [],
    config: { questionCount: 10, difficulties: ['medium'], questionType: 'mcq', timeLimit: 20 },
    selectedModels: ['gemini'],
    currentQuestionIndex: 0,
    questions: [],
    history: [],
    isGenerating: false,
    startTime: null,
    endTime: null,
    report: null
  });

  const [isInfoOpen, setIsInfoOpen] = useState(false);
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

  const toggleModel = (model: AIModel) => {
    setState(prev => {
      const isSelected = prev.selectedModels.includes(model);
      if (isSelected && prev.selectedModels.length === 1) return prev; // Prevent deselecting last one
      const newSelection = isSelected 
        ? prev.selectedModels.filter(m => m !== model)
        : [...prev.selectedModels, model];
      return { ...prev, selectedModels: newSelection };
    });
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
      selectedModels: ['gemini'],
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
      const qs = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, [diff], 'mcq', state.selectedModels);
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
      const qs = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, [newDiff], 'mcq', state.selectedModels);
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
      const qs = await generateQuestions(state.files, config.questionCount, config.difficulties, config.questionType, state.selectedModels);
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
          const newBatch = await generateQuestions(state.files, QUICK_QUIZ_BATCH_SIZE, state.config.difficulties, 'mcq', state.selectedModels);
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

  const renderStepper = () => {
    if (state.status === 'choosing_mode') return null;
    const steps = ['Upload', 'Setup', 'Quiz', 'Report'];
    const currentStep = 
      state.status === 'uploading' ? 0 : 
      state.status === 'configuring' ? 1 : 
      state.status === 'quiz' ? 2 : 3;

    return (
      <div className="flex items-center justify-center mb-8 gap-4 px-4 overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                i <= currentStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-200 text-slate-400'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${
                i <= currentStep ? 'text-indigo-600' : 'text-slate-400'
              }`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-[2px] w-6 sm:w-12 rounded-full transition-all ${i < currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (state.status) {
      case 'choosing_mode':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-400 mb-6">Select your AI Neural Engine</h2>
              <div className="flex flex-wrap justify-center gap-4 animate-slideUp">
                {[
                  { id: 'gemini', label: 'Gemini', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                  { id: 'claude', label: 'Claude', color: 'bg-orange-50 text-orange-600 border-orange-200' },
                  { id: 'openai', label: 'GPT-4', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                  { id: 'llama', label: 'Llama 3', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
                ].map((m) => {
                  const isSelected = state.selectedModels.includes(m.id as AIModel);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id as AIModel)}
                      className={`px-6 py-3 rounded-2xl font-black border-2 transition-all flex items-center gap-2 ${
                        isSelected 
                          ? m.color.replace('bg-', 'bg-white ').replace('border-', 'border-current shadow-lg ring-2 ring-offset-2 ring-transparent ') 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className={`w-2 h-2 rounded-full ${m.color.split(' ')[1].replace('text-', 'bg-')}`} />
                      )}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-400">Choose your path</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                <button onClick={() => selectMode('quiz')} className="bg-white p-10 rounded-[40px] border-2 border-slate-50 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left group relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Infinite</div>
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Quick Quiz</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Fast MCQ practice from a single file. Perfect for quick revision.</p>
                </button>
                <button onClick={() => selectMode('exam')} className="bg-white p-10 rounded-[40px] border-2 border-slate-50 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left group relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">Formal</div>
                  <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Formal Exam</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">Timed sessions, multi-file synthesis, and full performance analysis.</p>
                </button>
              </div>
            </div>
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
            <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-800 mb-2">Practice Intensity</h2>
                <p className="text-slate-500">How deep should the AI probe your understanding?</p>
              </div>
              <div className="space-y-4">
                {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
                  <button key={d} onClick={() => startQuickQuiz(d)} className="w-full p-6 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-between items-center group">
                    <div className="text-left">
                      <span className="font-black text-slate-800 capitalize text-xl block">{d} Intensity</span>
                      <span className="text-sm text-slate-400">
                        {d === 'low' ? 'Core concepts and basic recall' : d === 'medium' ? 'Standard understanding and logic' : 'Deep synthesis and edge cases'}
                      </span>
                    </div>
                    <svg className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
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
        const score = state.history.filter(h => h.isCorrect).length;
        return (
          <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">You're Done!</h2>
            <div className="flex justify-center gap-8 mb-10">
              <div className="text-center">
                <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">Score</span>
                <span className="text-3xl font-black text-indigo-600">{score}/{state.history.length}</span>
              </div>
              <div className="w-[1px] bg-slate-100" />
              <div className="text-center">
                <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">Accuracy</span>
                <span className="text-3xl font-black text-slate-800">{Math.round((score / state.history.length) * 100) || 0}%</span>
              </div>
            </div>
            <button onClick={() => endSession()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all">Return Home</button>
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
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100"><h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">Areas for Growth</h3><ul className="space-y-2">{state.report?.weaknesses.map((w, i) => (<li key={i} className="text-sm font-bold text-red-800 flex gap-2"><span>•</span> {w}</li>))}</ul></div>
            </div>
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100"><h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">AI Recommendations</h3><ul className="space-y-3">{state.report?.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 font-bold bg-white/10 p-4 rounded-xl items-start">
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-xs">✓</span>
                <span className="text-sm">{r}</span>
              </li>
            ))}</ul></div>
            <button onClick={() => endSession()} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl active:scale-95 transition-all">Finish Session</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <header className="mb-12 text-center flex flex-col items-center relative">
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="absolute top-0 right-0 p-2 text-indigo-600 font-black text-xs uppercase tracking-tighter border-b-2 border-indigo-50 hover:border-indigo-600 transition-all opacity-60 hover:opacity-100"
          >
            How it works?
          </button>
          
          <div onClick={() => endSession()} className="cursor-pointer bg-indigo-600 text-white p-4 rounded-3xl shadow-2xl shadow-indigo-100 mb-6 transform hover:rotate-6 active:scale-90 transition-all">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Exam Master AI</h1>
          {state.mode && <span className="mt-3 inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{state.mode} mode enabled</span>}
        </header>

        {renderStepper()}
        {renderContent()}

        {state.isGenerating && (state.status === 'configuring' || (state.status === 'quiz' && state.questions.length === 0)) && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fadeIn">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Architecting Session</h2>
            <p className="text-slate-500 font-medium">Synthesizing content with {state.selectedModels.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}...</p>
          </div>
        )}
      </div>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.2, 1, 0.3, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
