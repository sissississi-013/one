import React, { useEffect, useState } from 'react';
import { useLiveSession } from '../services/liveSessionHook';
import { Task } from '../types';
import { X } from 'lucide-react';

interface VoiceInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  addTask: (t: Partial<Task>) => void;
  completeTask: (title: string) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isOpen, onClose, tasks, addTask, completeTask
}) => {
  const { connect, disconnect, isConnected, isTalking, isUserTalking, userAudioLevel, error } = useLiveSession({
    onAddTask: addTask,
    onCompleteTask: completeTask,
    onUpdateTask: () => {},
    existingTasks: tasks
  });

  const [dots, setDots] = useState<number[]>([4, 4, 4]);

  // Visualizer effect - reacts to user or AI speech
  useEffect(() => {
    if (isTalking) {
      // AI is speaking - animated dots
      const interval = setInterval(() => {
        setDots(prev => prev.map(() => Math.floor(Math.random() * 8) + 4));
      }, 100);
      return () => clearInterval(interval);
    } else if (isUserTalking) {
      // User is speaking - dots react to audio level
      const height = Math.floor(userAudioLevel * 10) + 4;
      setDots([height, height + 2, height]);
    } else {
      // Idle state
      setDots([4, 4, 4]);
    }
  }, [isTalking, isUserTalking, userAudioLevel]);

  useEffect(() => {
    if (isOpen) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isOpen, connect, disconnect]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-300">
      <div className="group flex items-center gap-4 bg-white border border-slate-200 px-6 py-3 rounded-full shadow-lg shadow-slate-200/50 transition-all duration-300">

        <span className="text-sm font-semibold tracking-wide text-slate-600">
          {error ? "Error" : !isConnected ? "Connecting..." : isTalking ? "One speaking" : "Listening"}
        </span>

        {/* Dots visualizer - same position as MoreHorizontal icon */}
        <div className="flex items-center gap-1">
          {isConnected ? (
            dots.map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-100 ease-in-out ${
                  isTalking ? 'bg-red-500' : isUserTalking ? 'bg-red-400' : 'bg-slate-400'
                }`}
                style={{ height: `${h}px` }}
              />
            ))
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
