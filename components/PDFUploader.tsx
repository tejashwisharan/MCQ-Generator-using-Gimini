
import React, { useRef, useState } from 'react';

interface PDFUploaderProps {
  onUpload: (base64: string, fileName: string) => void;
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Please select a valid PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      onUpload(base64, file.name);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-300 rounded-3xl bg-white hover:border-indigo-400 transition-all group relative overflow-hidden">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">Upload study material</h3>
      <p className="text-slate-500 mb-6 text-center max-w-xs text-sm leading-relaxed">
        Select a PDF to generate your customized quiz. 
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 w-full sm:w-auto"
        >
          Choose PDF File
        </button>
        
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Maximum Size: {MAX_FILE_SIZE_MB}MB
          </span>
          {error && (
            <span className="text-xs font-semibold text-red-500 animate-fadeIn">
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Background decoration for mobile feel */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 blur-2xl pointer-events-none" />
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 blur-2xl pointer-events-none" />
    </div>
  );
};

export default PDFUploader;
