
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    { title: "AI-Powered Generation", desc: "Instantly transforms PDFs and DOCX files into high-quality exam questions using Gemini 3 Pro." },
    { title: "Dual Study Modes", desc: "Choose between 'Quick Practice' for rapid MCQ fire or 'Active Exam' for timed, multi-format assessments." },
    { title: "Adaptive Difficulty", desc: "Toggle between Low, Medium, and High intensity mid-session to challenge yourself as you improve." },
    { title: "Performance Analysis", desc: "Receive a deep AI report at the end of exams identifying your strengths and specific study recommendations." },
    { title: "Flexible Configuration", desc: "Define your own question counts, time limits, and mixed formats (MCQ + Short Answer)." }
  ];

  const faqs = [
    { q: "Which file formats are supported?", a: "Currently, we support PDF and Microsoft Word (.docx) files up to 40MB total." },
    { q: "Is there a limit on questions?", a: "In Exam mode, you can define any count. Quick Practice generates infinite batches of 5." },
    { q: "How does the AI grade text answers?", a: "Gemini compares your response against an ideal sample answer and provides pedagogical feedback on your logic." },
    { q: "Can I use multiple documents?", a: "Yes! Exam mode allows up to 5 documents to be synthesized into a single comprehensive test." }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-slideUp">
        <div className="absolute top-6 right-6">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-8 sm:p-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <header className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2">How it works</h2>
            <p className="text-slate-500 font-medium text-lg">Master your materials with AI-driven active recall.</p>
          </header>

          <section className="mb-12">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Core Features</h3>
            <div className="space-y-6">
              {features.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 mb-1">{f.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Frequently Asked</h3>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2 flex gap-2">
                    <span className="text-indigo-500">Q:</span> {faq.q}
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="text-slate-400 font-black mr-1">A:</span> {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-12">
            <button 
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              Got it, let's go!
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default InfoModal;
