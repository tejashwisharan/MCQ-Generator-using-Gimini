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
  const [countStr, setCountStr] = useState("10");
  const [timeStr, setTimeStr] = useState("20");
  const [diffs, setDiffs] = useState<Difficulty[]>(['medium']);
  const [formats, setFormats] = useState({ mcq: true, text: false });

  const toggleDiff = (d: Difficulty) => {
    setDiffs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const toggleFormat = (f: 'mcq' | 'text') => {
    setFormats(prev => {
      const next = { ...prev, [f]: !prev[f] };
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
    onStart({ questionCount: count, difficulties: diffs, questionType: getQuestionType(), timeLimit: time });
  };

  const isFormValid = diffs.length > 0 && (parseInt(countStr) > 0) && (parseInt(timeStr) > 0);

  return (
    <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-2xl animate-slideUp">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Configure Exam</h2>
        <p className="text-slate-500 font-medium">Tailoring analysis from {filesCount} source(s)</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Session Volume</label>
            <div className="relative">
              <input 
                type="number" 
                value={countStr} 
                onChange={(e) => setCountStr(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                placeholder="15"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase tracking-tighter">Items</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Time Commitment</label>
            <div className="relative">
              <input 
                type="number" 
                value={timeStr} 
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                placeholder="45"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase tracking-tighter">Minutes</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Question Formats</label>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => toggleFormat('mcq')}
              className={`flex-1 p-5 rounded-3xl font-black transition-all border-2 text-center flex flex-col items-center gap-3 ${formats.mcq ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <span>MCQ</span>
            </button>
            <button 
              type="button"
              onClick={() => toggleFormat('text')}
              className={`flex-1 p-5 rounded-3xl font-black transition-all border-2 text-center flex flex-col items-center gap-3 ${formats.text ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span>Short Answer</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cognitive Rigor</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as Difficulty[]).map(d => (
              <button 
                key={d} 
                type="button"
                onClick={() => toggleDiff(d)} 
                className={`flex-1 py-4 rounded-2xl font-black capitalize transition-all border-2 ${diffs.includes(d) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button 
          disabled={!isFormValid}
          onClick={handleStart}
          className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all mt-6 disabled:opacity-30 disabled:grayscale text-xl flex items-center justify-center gap-3 group"
        >
          Architect Exam
          <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ExamConfigurator;