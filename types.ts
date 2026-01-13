export interface Task {
  id: string;
  title: string;
  description?: string;
  time?: string;
  location?: string;
  status: 'pending' | 'completed';
  notes: string[];
  category: 'work' | 'personal' | 'idea' | 'meeting';
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string; // The AI's perspective
}

export enum AppMode {
  DASHBOARD = 'dashboard',
  VOICE_SESSION = 'voice_session',
  JOURNAL = 'journal'
}

export interface UserContext {
  name: string;
}

// Audio Types
export interface AudioConfig {
  sampleRate: number;
}
