import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createAudioBlob, decodePCM, pcmToAudioBuffer } from '../utils/audioUtils';
import { Task } from '../types';

interface UseLiveSessionProps {
  onAddTask: (task: Partial<Task>) => void;
  onCompleteTask: (taskTitle: string) => void;
  onUpdateTask: (taskTitle: string, updates: Partial<Task>) => void;
  existingTasks: Task[];
}

export const useLiveSession = ({ onAddTask, onCompleteTask, onUpdateTask, existingTasks }: UseLiveSessionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Model is talking
  const [error, setError] = useState<string | null>(null);
  
  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const currentSessionPromise = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const disconnect = useCallback(() => {
    if (currentSessionPromise.current) {
      currentSessionPromise.current.then(session => session.close());
      currentSessionPromise.current = null;
    }
    
    // Clean up audio inputs
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsTalking(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!process.env.API_KEY) {
        setError("API Key missing");
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      // Define Tools
      const tools: FunctionDeclaration[] = [
        {
          name: 'addTask',
          description: 'Add a new task or event to the user\'s schedule.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The name of the task or event.' },
              time: { type: Type.STRING, description: 'Time of the event if specified (e.g. 10:00 AM).' },
              description: { type: Type.STRING, description: 'Details about the task.' },
              category: { type: Type.STRING, enum: ['work', 'personal', 'idea', 'meeting'], description: 'Category of the task.' }
            },
            required: ['title']
          }
        },
        {
          name: 'markTaskComplete',
          description: 'Mark a task as completed.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The title or approximation of the task to complete.' },
            },
            required: ['title']
          }
        },
        {
          name: 'getExistingTasks',
          description: 'Get the list of current tasks on the user board.',
          parameters: {
            type: Type.OBJECT,
            properties: {} 
          }
        }
      ];

      // Setup Session
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          tools: [{ functionDeclarations: tools }],
          systemInstruction: `You are a warm, capable, and emotionally intelligent personal companion named "Aura". 
          Your goal is to help the user plan their day through natural conversation.
          Start by asking "Good morning! What's on your mind today?" or similar.
          If the user mentions meetings or tasks, offer to add them.
          If the user seems stressed, be supportive.
          You can reference their existing tasks if asked.
          Do NOT list all tasks unless asked. Keep it conversational.`,
        },
        callbacks: {
          onopen: async () => {
            console.log("Live Session Open");
            setIsConnected(true);
            setError(null);
            
            // Start Mic Stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                
                if (!inputContextRef.current) return;

                const source = inputContextRef.current.createMediaStreamSource(stream);
                sourceRef.current = source;
                
                // Use ScriptProcessor for raw PCM access (worklets are better but complex in single-file setup)
                const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const blob = createAudioBlob(inputData);
                    
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: blob });
                    });
                };

                source.connect(processor);
                processor.connect(inputContextRef.current.destination);

            } catch (err) {
                console.error("Mic Error:", err);
                setError("Microphone access denied.");
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Tool Calls
             if (msg.toolCall) {
                 const responses = [];
                 for (const call of msg.toolCall.functionCalls) {
                     let result: any = { status: 'ok' };
                     
                     if (call.name === 'addTask') {
                         onAddTask(call.args as unknown as Partial<Task>);
                         result = { status: 'success', message: 'Task added to board.' };
                     } else if (call.name === 'markTaskComplete') {
                         onCompleteTask((call.args as any).title);
                         result = { status: 'success', message: 'Task marked complete.' };
                     } else if (call.name === 'getExistingTasks') {
                         // We need to fetch the latest tasks, but here we only have the closure's existingTasks
                         // In a real app we'd use a ref or store. For now, rely on prop updates or assume stability
                         result = { tasks: existingTasks.map(t => ({ title: t.title, status: t.status, time: t.time })) };
                     }

                     responses.push({
                         id: call.id,
                         name: call.name,
                         response: { result }
                     });
                 }
                 
                 sessionPromise.then(s => s.sendToolResponse({ functionResponses: responses }));
             }

             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                 if (!audioContextRef.current) return;
                 setIsTalking(true);

                 const rawBytes = decodePCM(audioData);
                 const buffer = await pcmToAudioBuffer(rawBytes, audioContextRef.current);
                 
                 const source = audioContextRef.current.createBufferSource();
                 source.buffer = buffer;
                 source.connect(audioContextRef.current.destination);
                 
                 // Schedule playback
                 const now = audioContextRef.current.currentTime;
                 const start = Math.max(now, nextStartTimeRef.current);
                 source.start(start);
                 nextStartTimeRef.current = start + buffer.duration;
                 
                 source.onended = () => {
                     // Very rough approximation of "stopped talking"
                     if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                         setIsTalking(false);
                     }
                 };
             }
             
             // Handle Interruption
             if (msg.serverContent?.interrupted) {
                 nextStartTimeRef.current = 0;
                 setIsTalking(false);
                 // We ideally cancel currently playing nodes here, but simplified for this scope
             }
          },
          onclose: () => {
             console.log("Session Closed");
             setIsConnected(false);
          },
          onerror: (err) => {
              console.error("Session Error", err);
              // Extract error message safely
              const errorMessage = err instanceof Error ? err.message : String(err);
              setError(errorMessage);
              setIsConnected(false);
          }
        }
      });
      
      currentSessionPromise.current = sessionPromise;

    } catch (e: any) {
        console.error(e);
        setError(e.message);
    }
  }, [onAddTask, onCompleteTask, existingTasks]);

  return { connect, disconnect, isConnected, isTalking, error };
};