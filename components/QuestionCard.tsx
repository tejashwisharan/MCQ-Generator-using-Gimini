
import React from 'react';
import { MCQ } from '../types';

interface QuestionCardProps {
  question: MCQ;
  selectedIndices: number[];
  onSelect: (index: number) => void;
  isSubmitted: boolean;
  onSubmit: () => void;
  onNext: () => void;
  isLoading: boolean;
  progress: {
    correct: number;
    total: number;
  };
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedIndices,
  onSelect,
  isSubmitted,
  onSubmit,
  onNext,
  isLoading,
  progress
}) => {
  const isCorrect = (index: number) => question.correctIndices.includes(index);
  const isSelected = (index: number) => selectedIndices.includes(index);

  const getOptionStyles = (index: number) => {
    if (!isSubmitted) {
      return isSelected(index)
        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md transform -translate-y-0.5'
        : 'border-slate-200 bg-white active:bg-slate-50 text-slate-700';
    }
    if (isCorrect(index)) return 'border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200';
    if (isSelected(index)) return 'border-red-400 bg-red-50 text-red-900 opacity-90';
    return 'border-slate-100 bg-slate-50 text-slate-400 opacity-50';
  };

  const isAllCorrect = 
    isSubmitted && 
    question.correctIndices.length === selectedIndices.length &&
    question.correctIndices.every(i => selectedIndices.includes(i));

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-100 flex flex-col overflow-hidden animate-slideUp">
      {/* Mobile Progress Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 w-8 rounded-full transition-all ${
                i < progress.total ? (i < progress.correct ? 'bg-green-500' : 'bg-red-400') : 'bg-slate-200'
              }`} 
            />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase">Score: {progress.correct}/{progress.total}</span>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-8 leading-tight">
          {question.question}
        </h2>

        <div className="space-y-3 mb-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-5 py-4 border-2 rounded-2xl font-semibold transition-all flex items-center gap-4 ${getOptionStyles(idx)}`}
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 border border-slate-200 shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          ))}
        </div>

        {isSubmitted && (
          <div className={`p-5 rounded-2xl mb-8 border-l-4 animate-fadeIn ${isAllCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            <h4 className={`text-sm font-bold mb-1 ${isAllCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isAllCorrect ? 'Excellent!' : 'Not quite right'}
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">{question.explanation}</p>
          </div>
        )}

        <div className="sticky bottom-0 bg-white pt-2">
          {!isSubmitted ? (
            <button
              disabled={selectedIndices.length === 0}
              onClick={onSubmit}
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl active:scale-95 transition-all shadow-xl shadow-indigo-200 disabled:opacity-30"
            >
              Check Answer
            </button>
          ) : (
            <button
              disabled={isLoading}
              onClick={onNext}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Next Question <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
