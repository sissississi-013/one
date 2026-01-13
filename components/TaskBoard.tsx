import React, { useState } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Clock, MapPin, AlignLeft } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onToggleStatus }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (tasks.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 transition-opacity duration-1000 ease-in-out animate-in fade-in">
            <h2 className="text-3xl font-extralight text-slate-300 mb-4 tracking-tight">Canvas is empty</h2>
            <p className="text-slate-400 font-light text-sm">Tap the bar below to organize your thoughts.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-40 pt-6">
      <div className="mb-8 flex items-baseline justify-between border-b border-slate-100 pb-4">
        <h1 className="text-3xl font-bold text-red-600 tracking-tighter">Today</h1>
        <p className="text-slate-400 font-light text-sm">
            {pendingTasks.length} pending
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <div 
            key={task.id}
            onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
            className={`
                group relative bg-white rounded-lg border border-slate-100
                transition-all duration-300 cursor-pointer overflow-hidden
                ${task.status === 'completed' ? 'opacity-50 grayscale bg-slate-50' : 'hover:border-red-200 hover:shadow-sm'}
                ${expandedId === task.id ? 'ring-1 ring-red-500 shadow-md' : ''}
            `}
          >
            {/* Main Row */}
            <div className="flex items-center p-4 gap-4">
                
                {/* Status Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task.id);
                  }}
                  className={`flex-shrink-0 transition-colors duration-200 ${task.status === 'completed' ? 'text-red-300' : 'text-slate-300 hover:text-red-600'}`}
                >
                  {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>

                {/* Content */}
                <div className="flex-grow min-w-0 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h3 className={`font-medium text-base truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {task.title}
                        </h3>
                         {/* Show minimal metadata in the list view if valid */}
                        {(task.time || task.location) && !expandedId && (
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                {task.time && <span>{task.time}</span>}
                                {task.time && task.location && <span>•</span>}
                                {task.location && <span>{task.location}</span>}
                            </div>
                        )}
                    </div>

                    {/* Category Indicator (Right side) */}
                     <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${task.category === 'work' ? 'bg-red-500' : 
                          task.category === 'meeting' ? 'bg-orange-400' :
                          task.category === 'idea' ? 'bg-yellow-400' : 'bg-rose-300'}
                      `} />
                </div>
            </div>

            {/* Expanded Details */}
            {expandedId === task.id && (
                <div className="px-4 pb-4 pt-0 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="pl-9 pt-2 border-t border-slate-50">
                        {task.description && (
                            <p className="text-slate-600 text-sm leading-relaxed font-light mb-3">{task.description}</p>
                        )}
                        
                        {task.notes.length > 0 && (
                            <div className="mt-3 bg-red-50/50 rounded p-3">
                                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <AlignLeft size={10} /> Notes
                                </h4>
                                <ul className="space-y-1">
                                    {task.notes.map((note, idx) => (
                                        <li key={idx} className="text-xs text-slate-700 font-light">
                                            • {note}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                            {task.time && (
                                <div className="flex items-center gap-1">
                                    <Clock size={12} /> {task.time}
                                </div>
                            )}
                            {task.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} /> {task.location}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};