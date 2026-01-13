import React from 'react';
import { JournalEntry } from '../types';
import { Sparkles } from 'lucide-react';

interface JournalViewProps {
  journalEntries: JournalEntry[];
}

export const JournalView: React.FC<JournalViewProps> = ({ journalEntries }) => {
  // We assume generation happens automatically in App.tsx now.

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <div className="mb-16 text-center">
            <h2 className="text-3xl font-light text-slate-900 mb-2">Reflections</h2>
            <div className="w-12 h-1 bg-red-500 mx-auto rounded-full"></div>
        </div>

        {journalEntries.length === 0 ? (
             <div className="text-center py-20">
                <p className="text-slate-300 font-light text-lg">One is observing. Check back tomorrow.</p>
            </div>
        ) : (
            <div className="space-y-12">
                {journalEntries.map((entry, index) => (
                    <div key={entry.id} className="relative pl-8 border-l border-slate-100 group">
                        {/* Timeline dot */}
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-200 group-first:bg-red-500 ring-4 ring-white"></div>
                        
                        <div className="mb-4 flex items-center gap-3">
                            <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">{entry.date}</span>
                            {index === 0 && <Sparkles size={14} className="text-red-400 animate-pulse" />}
                        </div>
                        
                        <div className="prose prose-slate prose-p:font-light prose-p:text-slate-600 leading-relaxed text-lg">
                            {entry.content.split('\n').map((para, i) => (
                                <p key={i} className="mb-4">{para}</p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};