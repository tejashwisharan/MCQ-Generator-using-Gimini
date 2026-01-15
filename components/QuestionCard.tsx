
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

  // Reset local state when the question changes
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

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-slate-400">Mode</span>
          <span className="font-black text-lg">{isQuickQuiz ? 'Quick Practice' : 'Active Exam'}</span>
        </div>
        
        {!isQuickQuiz && (
           <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase text-slate-400">Progress</span>
            <span className="font-black text-lg">{currentIndex + 1} / {total}</span>
          </div>
        )}

        {showTimer && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-slate-400">Time Remaining</span>
            <span className={`font-black text-lg ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-indigo-400'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {isQuickQuiz && onChangeDifficulty && (
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">Change Difficulty</span>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => onChangeDifficulty(d)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                  currentDifficulty === d 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="mb-8">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            question.difficulty === 'low' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {question.difficulty} Intensity
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-4 leading-tight">{question.question}</h2>
        </div>

        {question.type === 'mcq' ? (
          <div className="space-y-3 mb-8">
            {question.options?.map((opt, idx) => (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => handleMCQSelect(idx)}
                className={`w-full text-left p-5 rounded-2xl font-bold border-2 transition-all flex items-center gap-4 ${
                  !isSubmitted 
                    ? (isOptionSelected(idx) ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 hover:border-slate-200')
                    : (isOptionCorrect(idx) ? 'border-green-500 bg-green-50 text-green-900' : isOptionSelected(idx) ? 'border-red-400 bg-red-50 text-red-900' : 'opacity-40 border-slate-50')
                }`}
              >
                <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs">{String.fromCharCode(65 + idx)}</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-8">
            <textarea
              disabled={isSubmitted}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[150px] p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 outline-none font-medium text-slate-800 transition-all"
            />
          </div>
        )}

        {isSubmitted && (
          <div className="bg-slate-50 p-6 rounded-2xl mb-8 border-l-4 border-indigo-500 animate-fadeIn">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Feedback</p>
            <p className="text-slate-600 text-sm leading-relaxed">{question.explanation}</p>
            {question.type === 'text' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ideal Answer</p>
                <p className="text-slate-800 text-sm font-bold">{question.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!isSubmitted ? (
            <button 
              onClick={() => onSubmit(question.type === 'mcq' ? selectedMCQ : textAnswer)}
              disabled={question.type === 'mcq' ? selectedMCQ.length === 0 : textAnswer.trim().length === 0}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:opacity-20"
            >
              Submit Answer
            </button>
          ) : (
            <button 
              onClick={onNext}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Next Question <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></>}
            </button>
          )}

          <button 
            onClick={onEnd}
            className="w-full bg-white text-slate-400 font-bold py-3 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all text-xs uppercase tracking-widest"
          >
            End Quiz & Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
