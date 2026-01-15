
import React, { useRef, useState } from 'react';
import { FileData } from '../types';

interface FileUploaderProps {
  onUpload: (files: FileData[]) => void;
  maxFiles?: number;
}

const MAX_TOTAL_SIZE_MB = 40;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, maxFiles = 5 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          type: file.type,
          base64: (e.target?.result as string).split(',')[1]
        });
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            // @ts-ignore (mammoth is in window)
            const result = await window.mammoth.extractRawText({ arrayBuffer: e.target?.result });
            resolve({
              name: file.name,
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              text: result.value
            });
          } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject("Unsupported file type");
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    setError(null);

    if (selectedFiles.length === 0) return;

    if (selectedFiles.length > maxFiles) {
      setError(`Please select no more than ${maxFiles} file(s) for this mode.`);
      return;
    }

    const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setError(`Total size exceeds ${MAX_TOTAL_SIZE_MB}MB.`);
      return;
    }

    setLoading(true);
    try {
      const processed = await Promise.all(selectedFiles.map(processFile));
      onUpload(processed);
    } catch (err) {
      setError("Error processing files. Please check file formats.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[40px] p-12 border-4 border-dashed border-slate-100 hover:border-indigo-400 hover:bg-slate-50/50 transition-all text-center animate-slideUp">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Upload Material</h2>
      <p className="text-slate-500 mb-8 font-medium">
        Select up to {maxFiles} {maxFiles === 1 ? 'PDF or DOCX file' : 'PDFs or DOCX files'}
      </p>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple={maxFiles > 1} accept=".pdf,.docx" className="hidden" />
      
      <button 
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        className="bg-indigo-600 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Reading Files..." : "Choose Files"}
      </button>

      {error && <p className="mt-6 text-red-500 font-bold text-sm bg-red-50 py-3 px-6 rounded-full inline-block">{error}</p>}
    </div>
  );
};

export default FileUploader;
