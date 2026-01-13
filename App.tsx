import React, { useState, useEffect } from 'react';
import { Task, JournalEntry } from './types';
import { VoiceInterface } from './components/VoiceInterface';
import { TaskBoard } from './components/TaskBoard';
import { JournalView } from './components/JournalView';
import { MoreHorizontal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize with empty tasks
const INITIAL_TASKS: Task[] = [];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [view, setView] = useState<'board' | 'journal'>('board');

  // Automatic Journal Generation at start of day
  useEffect(() => {
    const generateMorningJournal = async () => {
        const today = new Date().toLocaleDateString();
        if (journalEntries.find(e => e.date === today)) return;
        if (!process.env.API_KEY) return;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
                You are "One", a minimalist and intelligent AI companion.
                It is the start of a new day (${today}).
                The user has just opened the application. The canvas is currently blank.
                Write a very short, poetic, and inspiring journal entry (under 50 words) welcoming the user to a fresh new day.
                Focus on the potential of the blank slate. Do not be cheesy. Be "simple but advanced".
                Do not use headers. Just the text.
            `;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });
            const text = response.text || "A new day begins. The canvas is yours.";
            setJournalEntries(prev => [{ id: Date.now().toString(), date: today, content: text }, ...prev]);
        } catch (e) {
            console.error("Auto Journal Error", e);
        }
    };
    generateMorningJournal();
  }, []); 

  const addTask = (partialTask: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: partialTask.title || 'New Item',
      category: partialTask.category || 'work',
      status: 'pending',
      notes: [],
      description: partialTask.description,
      time: partialTask.time,
      location: partialTask.location
    };
    setTasks(prev => [...prev, newTask]);
  };

  const completeTask = (titleOrId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === titleOrId || t.title.toLowerCase().includes(titleOrId.toLowerCase())) {
        return { ...t, status: 'completed' };
      }
      return t;
    }));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md px-8 py-6 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center cursor-pointer group" onClick={() => setView('board')}>
            {/* Custom SVG Logo */}
            <svg className="h-8 w-auto group-hover:scale-105 transition-transform" viewBox="0 0 130 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* O - Face */}
                <circle cx="22" cy="22" r="20" fill="#DC2626"/>
                {/* Eyes */}
                <circle cx="15" cy="18" r="2.5" fill="white"/>
                <circle cx="29" cy="18" r="2.5" fill="white"/>
                {/* Mouth */}
                <ellipse cx="22" cy="28" rx="6" ry="3.5" fill="white"/>

                {/* n */}
                <path d="M52 42V14.5C52 10 54 6 61 6C68 6 70 10 70 14.5V42H82V13.5C82 4 75 0 65 0C58 0 54 2 50 7V2H40V42H52Z" fill="#DC2626"/>

                {/* e */}
                <path d="M124 23H96C96 36 102 38 108 38C114 38 116 36 117 33H128C127 41 119 46 108 46C94 46 84 36 84 23C84 10 94 0 108 0C121 0 130 10 130 23ZM96 17H118C118 10 114 8 108 8C101 8 97 10 96 17Z" fill="#DC2626"/>
            </svg>
        </div>

        <div className="flex items-center gap-6">
            <button 
                onClick={() => setView('board')}
                className={`text-xs font-bold tracking-widest uppercase transition-colors ${view === 'board' ? 'text-red-600' : 'text-slate-400 hover:text-red-500'}`}
            >
                Canvas
            </button>
            <button 
                onClick={() => setView('journal')}
                className={`text-xs font-bold tracking-widest uppercase transition-colors ${view === 'journal' ? 'text-red-600' : 'text-slate-400 hover:text-red-500'}`}
            >
                Journal
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-24 min-h-screen">
        {view === 'board' ? (
             <TaskBoard tasks={tasks} onToggleStatus={toggleTaskStatus} />
        ) : (
            <JournalView journalEntries={journalEntries} />
        )}
      </main>

      {/* Trigger Button (Only visible when voice is NOT active) */}
      {!isVoiceOpen && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="group flex items-center gap-4 bg-white border border-slate-200 px-6 py-3 rounded-full shadow-lg shadow-slate-200/50 hover:border-red-500 hover:text-red-600 hover:shadow-red-500/10 transition-all duration-300 active:scale-95"
            aria-label="Talk to One"
          >
            <span className="text-sm font-semibold tracking-wide text-slate-600 group-hover:text-red-600">Talk to One</span>
            <MoreHorizontal size={20} className="text-slate-400 group-hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Voice Interface Overlay (Floating Pill) */}
      <VoiceInterface 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        tasks={tasks}
        addTask={addTask}
        completeTask={completeTask}
      />

    </div>
  );
}