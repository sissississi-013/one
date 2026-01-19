import React, { useState, useEffect } from 'react';
import { Task, JournalEntry } from './types';
import { VoiceInterface } from './components/VoiceInterface';
import { TaskBoard } from './components/TaskBoard';
import { JournalView } from './components/JournalView';
import { MoreHorizontal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// localStorage keys
const STORAGE_KEYS = {
  TASKS: 'one_tasks',
  JOURNAL: 'one_journal'
};

// Load from localStorage
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, []));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadFromStorage(STORAGE_KEYS.JOURNAL, []));
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [view, setView] = useState<'board' | 'journal'>('board');

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  // Persist journal to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Automatic Journal Generation at start of day (3rd person narrative)
  useEffect(() => {
    const generateMorningJournal = async () => {
        const today = new Date().toLocaleDateString();
        if (journalEntries.find(e => e.date === today)) return;
        if (!process.env.API_KEY) return;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const taskSummary = tasks.length > 0
              ? `They have ${tasks.filter(t => t.status === 'pending').length} pending tasks and ${tasks.filter(t => t.status === 'completed').length} completed tasks.`
              : 'Their canvas is currently empty.';

            const prompt = `
                You are "One", a super sweet and caring AI companion writing a journal entry about the user.
                Write in 3RD PERSON NARRATIVE about the user (use "they/them/their").
                Date: ${today}
                Context: ${taskSummary}

                Write a short, warm, authentic reflection (under 60 words) about the user's day.
                Be genuinely caring and sweet, like a supportive best friend observing them.
                USE TEXT EMOTICONS like :) :D <3 ^_^ :') but NEVER use emojis.
                Example tone: "They showed up today, and that's already something beautiful :) The little things they do matter more than they know <3"
                Do not use headers. Just the narrative text.
            `;
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });
            const text = response.text || "They began another day. The canvas awaited their touch.";
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
            <img src="/logo.png" alt="One" className="h-8 w-auto group-hover:scale-105 transition-transform" />
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
