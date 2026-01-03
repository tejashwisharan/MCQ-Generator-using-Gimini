
import React from 'react';
import { Difficulty } from '../types';

interface DifficultySelectorProps {
  current: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ current, onChange, disabled }) => {
  const levels: { value: Difficulty; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-500">Difficulty:</span>
      <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
        {levels.map((level) => (
          <button
            key={level.value}
            disabled={disabled}
            onClick={() => onChange(level.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
              current === level.value
                ? `${level.color} shadow-sm border`
                : 'text-slate-600 hover:bg-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;
