import React, { useEffect, useState } from 'react';
import { useLiveSession } from '../services/liveSessionHook';
import { Task } from '../types';
import { X, Mic, StopCircle } from 'lucide-react';

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
  const { connect, disconnect, isConnected, isTalking, error } = useLiveSession({
    onAddTask: addTask,
    onCompleteTask: completeTask,
    onUpdateTask: () => {}, 
    existingTasks: tasks
  });

  const [bars, setBars] = useState<number[]>(new Array(5).fill(10));

  // Simple visualizer effect when talking
  useEffect(() => {
    if (isTalking) {
        const interval = setInterval(() => {
            setBars(prev => prev.map(() => Math.floor(Math.random() * 20) + 10));
        }, 100);
        return () => clearInterval(interval);
    } else {
        setBars(new Array(5).fill(6));
    }
  }, [isTalking]);

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
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-red-600 text-white rounded-full shadow-2xl shadow-red-600/20 px-6 py-4 flex items-center gap-6 min-w-[280px] justify-between">
            
            {/* Visualizer Area */}
            <div className="flex items-center gap-1 h-6">
                {isConnected ? (
                    <>
                        {bars.map((h, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-white rounded-full transition-all duration-100 ease-in-out"
                                style={{ height: `${h}px`, opacity: isTalking ? 1 : 0.5 }}
                            />
                        ))}
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-widest uppercase opacity-90">
                    {error ? "Error" : isTalking ? "One speaking" : "Listening"}
                </span>
            </div>

            {/* Close / Stop Button */}
            <button 
                onClick={onClose}
                className="ml-2 p-1.5 bg-red-700 rounded-full hover:bg-red-800 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    </div>
  );
};