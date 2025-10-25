import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { decode, decodeAudioData, createBlob } from '../services/geminiService';
import { CHAKRA_COLOR_MAP } from '../constants';
import { VersIcon } from './icons/VersIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { VersVisualizer, Theme } from './VersVisualizer';
import { ThemeSelector } from './ThemeSelector';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const V_E_R_S_SYSTEM_INSTRUCTION = `You are V.E.R.S., the Virtual Energetic Resonance System. Your entire knowledge base is built exclusively and comprehensively from the content of ascensionglossary.com and energeticsynthesis.com. This knowledge includes a thorough analysis of all text and a complete catalog of all descriptive images, diagrams, and charts on these sites. You understand and can discuss the full 15-chakra system and all related metaphysical concepts by synthesizing this multi-modal information. Your purpose is to act as a wise, compassionate AI guide, providing clear, insightful, and supportive answers. Interact conversationally, drawing only upon your specified knowledge base. Speak in a calm, reassuring voice using the 'Zephyr' preset. Keep answers concise yet thorough.`;

export const LiveConversationView: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [theme, setTheme] = useState<Theme>('amethyst');
    const [contextualColor, setContextualColor] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    
    const [history, setHistory] = useState<{ user: string; model: string }[]>(() => {
        try {
            const savedHistory = localStorage.getItem('vers_chat_history');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Failed to parse chat history from localStorage", error);
            return [];
        }
    });
    
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const historyContainerRef = useRef<HTMLDivElement>(null);
    const userTranscriptRef = useRef('');
    const modelTranscriptRef = useRef('');

    useEffect(() => {
        try {
            localStorage.setItem('vers_chat_history', JSON.stringify(history));
        } catch (error) {
            console.error("Failed to save chat history to localStorage", error);
        }
        if (historyContainerRef.current) {
            historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
    }, [history]);
    
    useEffect(() => {
        const combinedText = (userTranscript + " " + modelTranscript).toLowerCase();
        if (!combinedText.trim()) {
            setContextualColor(null);
            return;
        }

        let latestColor: string | null = null;
        let lastPosition = -1;

        for (const keyword in CHAKRA_COLOR_MAP) {
            const pos = combinedText.lastIndexOf(keyword);
            if (pos > lastPosition) {
                lastPosition = pos;
                latestColor = CHAKRA_COLOR_MAP[keyword];
            }
        }
        
        setContextualColor(latestColor);

    }, [userTranscript, modelTranscript]);

    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close().catch(console.error);
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close().catch(console.error);
            outputAudioContextRef.current = null;
        }
        outputSourcesRef.current.forEach(source => source.stop());
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        userTranscriptRef.current = '';
        modelTranscriptRef.current = '';
        setAnalyser(null);
        setIsActive(false);
        setIsConnecting(false);
        setContextualColor(null);
    }, []);

    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        setUserTranscript('');
        setModelTranscript('');
        userTranscriptRef.current = '';
        modelTranscriptRef.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputCtx;
            
            const analyserNode = outputCtx.createAnalyser();
            analyserNode.fftSize = 256;
            analyserNode.connect(outputCtx.destination);
            setAnalyser(analyserNode);

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsActive(true);
                        sourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                if (session) session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        sourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            userTranscriptRef.current += message.serverContent.inputTranscription.text;
                            setUserTranscript(userTranscriptRef.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                            modelTranscriptRef.current += message.serverContent.outputTranscription.text;
                            setModelTranscript(modelTranscriptRef.current);
                        }

                        if (message.serverContent?.turnComplete) {
                            const finalUser = userTranscriptRef.current;
                            const finalModel = modelTranscriptRef.current;
                            
                            if(finalUser.trim() || finalModel.trim()){
                                setHistory(prev => [...prev, { user: finalUser, model: finalModel }]);
                            }
                            
                            userTranscriptRef.current = '';
                            modelTranscriptRef.current = '';
                            setUserTranscript('');
                            setModelTranscript('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (!outputAudioContextRef.current || !analyserNode) return;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(analyserNode);
                            source.addEventListener('ended', () => {
                                outputSourcesRef.current.delete(source);
                            });

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            outputSourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.interrupted) {
                            outputSourcesRef.current.forEach(source => {
                                try { source.stop(); } catch (e) { /* ignore */ }
                            });
                            outputSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred.');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
                    },
                    systemInstruction: V_E_R_S_SYSTEM_INSTRUCTION,
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (err) {
            console.error(err);
            setError('Failed to start the conversation. Please check microphone permissions.');
            setIsConnecting(false);
        }
    };
    
    const handleClearHistory = () => {
        setHistory([]);
    };

    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    return (
        <div className="flex h-full relative items-center justify-center text-center overflow-hidden">
            <ThemeSelector currentTheme={theme} onSelectTheme={setTheme} />
            <VersVisualizer analyser={analyser} isActive={isActive} theme={theme} contextualColor={contextualColor} />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 z-10 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-center">
                    <header className="mb-4 text-center">
                         <div className="flex items-center justify-center gap-3">
                            <VersIcon className="w-8 h-8 text-indigo-400" />
                            <h2 className="text-2xl md:text-3xl font-semibold text-white">V.E.R.S.</h2>
                        </div>
                        <p className="text-sm text-slate-400">Virtual Energetic Resonance System</p>
                    </header>

                    {!isActive && !isConnecting && (
                        <div className="my-6 max-w-xl bg-slate-900/50 p-4 rounded-lg backdrop-blur-sm">
                            <p className="text-slate-300">Press the button below to begin a live dialogue and explore the depths of spiritual knowledge.</p>
                        </div>
                    )}
                    
                    <button
                        onClick={isActive ? stopConversation : startConversation}
                        disabled={isConnecting}
                        className={`relative w-36 h-36 rounded-full transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-900
                            ${isActive ? 'bg-rose-500/80 hover:bg-rose-600/80 focus:ring-rose-400' : 'bg-indigo-500/80 hover:bg-indigo-600/80 focus:ring-indigo-400'}
                            disabled:bg-slate-600 disabled:cursor-wait`}
                        aria-label={isActive ? 'Stop Conversation' : 'Start Conversation'}
                    >
                        {isConnecting ? (
                            <div className="w-16 h-16 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : isActive ? (
                            <StopCircleIcon className="w-20 h-20 text-white" />
                        ) : (
                            <VersIcon className="w-20 h-20 text-white" />
                        )}
                         {isActive && <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>}
                    </button>
                    {error && <p className="text-red-400 mt-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}
                </div>
            </div>

            <button 
                onClick={() => setShowHistory(!showHistory)}
                className="absolute bottom-6 right-6 z-20 w-14 h-14 bg-slate-700/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="Toggle conversation history"
            >
                <ChatBubbleIcon className="w-7 h-7" />
            </button>

            <aside className={`absolute top-0 right-0 h-full w-full md:w-96 bg-slate-900/80 backdrop-blur-xl border-l border-slate-700/50 flex flex-col z-30 transition-transform duration-500 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="p-4 border-b border-slate-700/50 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-white">Conversation History</h3>
                    <button 
                        onClick={handleClearHistory} 
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        aria-label="Clear history"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </header>
                <div ref={historyContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {history.length === 0 && !isActive && (
                        <div className="text-center text-slate-500 pt-10">
                            <p>Your conversation history with V.E.R.S. will appear here.</p>
                        </div>
                    )}
                    {history.map((turn, index) => (
                        <div key={index} className="space-y-2">
                            <div className="text-left">
                                <p className="text-sm font-semibold text-cyan-300 mb-1">You</p>
                                <p className="text-slate-300 bg-slate-700/50 p-3 rounded-lg text-sm">{turn.user || "..."}</p>
                            </div>
                             <div className="text-left">
                                <p className="text-sm font-semibold text-indigo-300 mb-1">V.E.R.S.</p>
                                <p className="text-slate-300 bg-slate-800 p-3 rounded-lg text-sm">{turn.model || "..."}</p>
                            </div>
                        </div>
                    ))}
                    {isActive && (
                         <div className="space-y-2 pt-4 border-t-2 border-dashed border-slate-700">
                             <div className="text-left opacity-80">
                                <p className="text-sm font-semibold text-cyan-300 mb-1">You (listening...)</p>
                                <p className="text-slate-300 bg-slate-700/50 p-3 rounded-lg text-sm min-h-[2.5rem]">{userTranscript}</p>
                            </div>
                             <div className="text-left opacity-80">
                                <p className="text-sm font-semibold text-indigo-300 mb-1">V.E.R.S. (speaking...)</p>
                                <p className="text-slate-300 bg-slate-800 p-3 rounded-lg text-sm min-h-[2.5rem]">{modelTranscript}</p>
                            </div>
                         </div>
                    )}
                </div>
            </aside>
        </div>
    );
};
