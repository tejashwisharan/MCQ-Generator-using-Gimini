
import React, { useState } from 'react';
import { Difficulty, QuestionType } from '../types';

interface ExamConfig {
  questionCount: number;
  difficulties: Difficulty[];
  questionType: QuestionType;
  timeLimit: number;
}

interface Props {
  onStart: (config: ExamConfig) => void;
  filesCount: number;
}

const ExamConfigurator: React.FC<Props> = ({ onStart, filesCount }) => {
  // Use string state to allow users to clear inputs while typing
  const [countStr, setCountStr] = useState("10");
  const [timeStr, setTimeStr] = useState("20");
  const [diffs, setDiffs] = useState<Difficulty[]>(['medium']);
  
  // Track individual format selections
  const [formats, setFormats] = useState({
    mcq: true,
    text: false
  });

  const toggleDiff = (d: Difficulty) => {
    setDiffs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleFormat = (f: 'mcq' | 'text') => {
    setFormats(prev => {
      const next = { ...prev, [f]: !prev[f] };
      // Ensure at least one is always selected
      if (!next.mcq && !next.text) return prev;
      return next;
    });
  };

  const getQuestionType = (): QuestionType => {
    if (formats.mcq && formats.text) return 'both';
    if (formats.mcq) return 'mcq';
    return 'text';
  };

  const handleStart = () => {
    const count = Math.max(1, parseInt(countStr) || 1);
    const time = Math.max(1, parseInt(timeStr) || 1);
    
    onStart({ 
      questionCount: count, 
      difficulties: diffs, 
      questionType: getQuestionType(), 
      timeLimit: time 
    });
  };

  const isFormValid = diffs.length > 0 && (parseInt(countStr) > 0) && (parseInt(timeStr) > 0);

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl animate-slideUp">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">Exam Setup</h2>
        <p className="text-slate-500 text-sm">Targeting {filesCount} source document(s)</p>
      </div>

      <div className="space-y-6">
        {/* Count - Free Form Input */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Question Count</label>
          <div className="relative">
            <input 
              type="number" 
              value={countStr} 
              onChange={(e) => setCountStr(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
              placeholder="e.g. 15"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">Questions</span>
          </div>
        </div>

        {/* Difficulty Mix */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Difficulty Mix</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
              <button 
                key={d} 
                type="button"
                onClick={() => toggleDiff(d)} 
                className={`flex-1 py-3 rounded-xl font-bold capitalize transition-all border-2 ${diffs.includes(d) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Question Format - Toggle Style */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Question Format (Select one or more)</label>
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => toggleFormat('mcq')}
              className={`flex-1 p-5 rounded-2xl font-bold transition-all border-2 text-center flex flex-col items-center gap-2 ${formats.mcq ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Multiple Choice
            </button>
            <button 
              type="button"
              onClick={() => toggleFormat('text')}
              className={`flex-1 p-5 rounded-2xl font-bold transition-all border-2 text-center flex flex-col items-center gap-2 ${formats.text ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Short Answer
            </button>
          </div>
        </div>

        {/* Timer - Free Form Input */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block">Time Limit</label>
          <div className="relative">
            <input 
              type="number" 
              value={timeStr} 
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
              placeholder="e.g. 45"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">Minutes</span>
          </div>
        </div>

        <button 
          disabled={!isFormValid}
          onClick={handleStart}
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all mt-4 disabled:opacity-30 disabled:grayscale"
        >
          Generate Exam
        </button>
      </div>
    </div>
  );
};

export default ExamConfigurator;
