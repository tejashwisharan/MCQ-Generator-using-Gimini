
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
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedIndices,
  onSelect,
  isSubmitted,
  onSubmit,
  onNext,
  isLoading
}) => {
  const isCorrect = (index: number) => question.correctIndices.includes(index);
  const isSelected = (index: number) => selectedIndices.includes(index);

  const getOptionStyles = (index: number) => {
    if (!isSubmitted) {
      return isSelected(index)
        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
        : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';
    }

    if (isCorrect(index)) {
      return 'border-green-500 bg-green-50 text-green-800 ring-1 ring-green-500';
    }

    if (isSelected(index) && !isCorrect(index)) {
      return 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500';
    }

    return 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
  };

  const allCorrectSelected = 
    isSubmitted && 
    question.correctIndices.every(idx => selectedIndices.includes(idx)) &&
    selectedIndices.every(idx => question.correctIndices.includes(idx));

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fadeIn">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 leading-snug">
          {question.question}
        </h2>

        <div className="space-y-3 mb-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              disabled={isSubmitted}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-5 py-4 border-2 rounded-xl font-medium transition-all flex items-center gap-4 ${getOptionStyles(idx)}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                isSelected(idx) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
              }`}>
                {isSelected(idx) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              {option}
            </button>
          ))}
        </div>

        {isSubmitted && (
          <div className={`p-6 rounded-xl mb-8 border ${allCorrectSelected ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${allCorrectSelected ? 'text-green-600' : 'text-red-600'}`}>
                {allCorrectSelected ? 'Correct!' : 'Keep Learning'}
              </span>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">
              <span className="font-bold">Explanation:</span> {question.explanation}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          {!isSubmitted ? (
            <button
              disabled={selectedIndices.length === 0}
              onClick={onSubmit}
              className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
            >
              Submit Answer
            </button>
          ) : (
            <button
              disabled={isLoading}
              onClick={onNext}
              className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  Next Question
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
