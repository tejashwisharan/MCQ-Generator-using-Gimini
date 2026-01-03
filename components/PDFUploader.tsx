
import React, { useRef } from 'react';

interface PDFUploaderProps {
  onUpload: (base64: string, fileName: string) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        onUpload(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-indigo-400 transition-colors group">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Upload your PDF</h3>
      <p className="text-slate-500 mb-6 text-center max-w-xs">
        Select a PDF from your computer to generate a customized quiz.
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
      >
        Choose File
      </button>
    </div>
  );
};

export default PDFUploader;
