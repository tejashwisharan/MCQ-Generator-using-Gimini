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
  const [stagedFiles, setStagedFiles] = useState<FileData[]>([]);

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

    if (stagedFiles.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }

    const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setError(`Size exceeds ${MAX_TOTAL_SIZE_MB}MB limit.`);
      return;
    }

    setLoading(true);
    try {
      const processed = await Promise.all(selectedFiles.map(processFile));
      setStagedFiles(prev => [...prev, ...processed]);
    } catch (err) {
      setError("File processing failed. Use PDF or DOCX.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (idx: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full space-y-6 animate-slideUp">
      <div className="w-full bg-white rounded-[40px] p-12 border-4 border-dashed border-slate-100 hover:border-indigo-400 hover:bg-slate-50/30 transition-all text-center group">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Import Knowledge</h2>
        <p className="text-slate-500 mb-10 font-medium">
          Upload up to {maxFiles} source document{maxFiles > 1 ? 's' : ''} (PDF or DOCX)
        </p>
        
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple={maxFiles > 1} accept=".pdf,.docx" className="hidden" />
        
        <button 
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="bg-indigo-600 text-white font-black px-12 py-5 rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : "Select Files"}
        </button>

        {error && <p className="mt-8 text-red-500 font-bold text-sm bg-red-50 py-3 px-8 rounded-full inline-block animate-fadeIn">{error}</p>}
      </div>

      {stagedFiles.length > 0 && (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl animate-fadeIn">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Staged for synthesis</h3>
          <div className="space-y-3">
            {stagedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="font-bold text-slate-700 truncate">{f.name}</span>
                </div>
                <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onUpload(stagedFiles)}
            className="w-full mt-8 bg-slate-900 text-white font-black py-5 rounded-3xl shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Continue to Setup
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;