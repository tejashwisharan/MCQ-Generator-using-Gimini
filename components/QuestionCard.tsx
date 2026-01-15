import React, { useState, useEffect } from 'react';
import { Question, Difficulty } from '../types';

interface Props {
  question: Question;
  isSubmitted: boolean;
  onSubmit: (answer: any) => void;
  onNext: () => void;
  onEnd: () => void;
  onChangeDifficulty?: (d: Difficulty) => void;
  isLoading: boolean;
  currentIndex: number;
  total: number;
  timeLeft: number; // seconds
  showTimer?: boolean;
  isQuickQuiz?: boolean;
  currentDifficulty?: Difficulty;
}

const QuestionCard: React.FC<Props> = ({
  question, isSubmitted, onSubmit, onNext, onEnd, onChangeDifficulty, isLoading, currentIndex, total, timeLeft, showTimer = false, isQuickQuiz = false, currentDifficulty
}) => {
  const [selectedMCQ, setSelectedMCQ] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    setSelectedMCQ([]);
    setTextAnswer("");
  }, [question.id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMCQSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedMCQ(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const isOptionCorrect = (idx: number) => question.correctIndices?.includes(idx);
  const isOptionSelected = (idx: number) => selectedMCQ.includes(idx);

  const progress = ((currentIndex + (isSubmitted ? 1 : 0)) / total) * 100;

  return (
    <div className="w-full bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
      {/* Dynamic Progress Bar */}
      <div className="h-2 w-full bg-slate-50 relative">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out" 
          style={{ width: `${isQuickQuiz ? 0 : progress}%` }} 
        />
      </div>

      <div className="px-8 py-6 flex justify-between items-center bg-slate-50/50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Task</span>
          <span className="font-black text-slate-800 text-lg uppercase">
            {isQuickQuiz ? 'Quick Fire' : `Question ${currentIndex + 1}`}
          </span>
        </div>

        {showTimer && (
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <svg className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-black text-lg tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-slate-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {isQuickQuiz && onChangeDifficulty && (
        <div className="px-8 py-4 bg-white border-b border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">Tweak Challenge</span>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => onChangeDifficulty(d)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  currentDifficulty === d 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:text-indigo-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-10">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
              question.difficulty === 'low' ? 'bg-green-100 text-green-700' :
              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              {question.difficulty} INTENSITY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{question.type} FORMAT</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 leading-tight">{question.question}</h2>
        </div>

        {question.type === 'mcq' ? (
          <div className="space-y-4 mb-10">
            {question.options?.map((opt, idx) => (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => handleMCQSelect(idx)}
                className={`w-full text-left p-6 rounded-3xl font-bold border-2 transition-all flex items-center gap-5 relative group ${
                  !isSubmitted 
                    ? (isOptionSelected(idx) ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xl shadow-indigo-100/50' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white')
                    : (isOptionCorrect(idx) ? 'border-green-500 bg-green-50 text-green-900' : isOptionSelected(idx) ? 'border-red-400 bg-red-50 text-red-900' : 'opacity-40 border-slate-50')
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                  !isSubmitted
                    ? (isOptionSelected(idx) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 group-hover:border-slate-300')
                    : (isOptionCorrect(idx) ? 'bg-green-500 text-white' : isOptionSelected(idx) ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400')
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-lg">{opt}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-10">
            <textarea
              disabled={isSubmitted}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Structure your thoughts here..."
              className="w-full min-h-[200px] p-8 rounded-[32px] bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white outline-none font-medium text-slate-800 text-lg transition-all shadow-inner"
            />
          </div>
        )}

        {isSubmitted && (
          <div className="bg-slate-900 text-white p-8 rounded-[32px] mb-10 animate-fadeIn shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Pedagogical Insights</p>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed">{question.explanation}</p>
            {question.type === 'text' && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ideal Sample Answer</p>
                <p className="text-white font-bold leading-relaxed">{question.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {!isSubmitted ? (
            <button 
              onClick={() => onSubmit(question.type === 'mcq' ? selectedMCQ : textAnswer)}
              disabled={question.type === 'mcq' ? selectedMCQ.length === 0 : textAnswer.trim().length === 0}
              className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-200 active:scale-95 transition-all disabled:opacity-20 hover:bg-indigo-700 text-lg"
            >
              Verify Answer
            </button>
          ) : (
            <button 
              onClick={onNext}
              className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-4 text-lg hover:bg-indigo-700"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Advance <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg></>}
            </button>
          )}

          <button 
            onClick={onEnd}
            className="w-full bg-white text-slate-400 font-bold py-4 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all text-[11px] uppercase tracking-widest"
          >
            Abort & Discard Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;