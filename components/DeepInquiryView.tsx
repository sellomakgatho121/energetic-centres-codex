import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

const SUGGESTED_PROMPTS = [
    "Explain the 12 Tree Grid.",
    "What is the Law of One?",
    "Describe the process of Lightbody activation.",
    "Tell me about the Guardian Alliance.",
];

interface InteractiveMessageProps {
    text: string;
    onNavigateToCodex: (topic: string) => void;
}

const InteractiveMessage: React.FC<InteractiveMessageProps> = ({ text, onNavigateToCodex }) => {
    const codexTopicRegex = /(1st Chakra|2nd Chakra|3rd Chakra|4th Chakra|5th Chakra|6th Chakra|7th Chakra|8th Chakra|9th Chakra|10th Chakra|11th Chakra|12th Chakra|13th Chakra|14th Chakra|15th Chakra|Soul Body|Monad|Lightbody|Merkaba|Kundalini|Antahkarana|Axiatonal Lines|Nadial Structure|12 Tree Grid|Astral Plane|Akashic Records|Violet Flame|I AM Presence|Threefold Flame|12D Shield|HGS System|Guardian Alliance|Negative Alien Agenda|Law of One)/gi;

    const parts = text.split(codexTopicRegex);

    return (
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(codexTopicRegex)) {
                    return (
                        <button
                            key={index}
                            onClick={() => onNavigateToCodex(part)}
                            className="text-cyan-300 font-semibold hover:underline bg-cyan-900/50 px-1 py-0.5 rounded-md transition-colors"
                        >
                            {part}
                        </button>
                    );
                }
                return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </p>
    );
};

interface DeepInquiryViewProps {
    onNavigateToCodex: (topicIdentifier: string) => void;
}

export const DeepInquiryView: React.FC<DeepInquiryViewProps> = ({ onNavigateToCodex }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useThinkingMode, setUseThinkingMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setChat(createChat(useThinkingMode));
        setMessages([]); // Reset messages when mode changes
    }, [useThinkingMode]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
     useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [currentInput]);

    const handleSend = async (prompt?: string) => {
        const textToSend = prompt || currentInput;
        if (!textToSend.trim() || !chat || isLoading) return;

        const newMessages: ChatMessage[] = [...messages, { role: 'user', text: textToSend }];
        setMessages(newMessages);
        setCurrentInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: textToSend });
            let modelResponse = '';
            
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);

            for await (const chunk of result) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'model') {
                        return [...prev.slice(0, -1), { role: 'model', text: modelResponse }];
                    }
                    return prev;
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            <header className="p-4 border-b border-slate-700/50 flex-shrink-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-semibold text-white font-display">Deep Inquiry</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className={`font-semibold ${!useThinkingMode ? 'text-cyan-300' : 'text-slate-400'}`}>Standard</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={useThinkingMode} onChange={() => setUseThinkingMode(!useThinkingMode)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                    <span className={`font-semibold ${useThinkingMode ? 'text-indigo-300' : 'text-slate-400'}`}>Advanced</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center py-10">
                         <h3 className="text-lg font-semibold text-slate-300">Start a Conversation</h3>
                         <p className="text-slate-500 max-w-md mx-auto mt-1">Ask a question or choose a prompt below to begin your inquiry.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-2xl mx-auto">
                            {SUGGESTED_PROMPTS.map(prompt => (
                                <button key={prompt} onClick={() => handleSend(prompt)} className="text-left p-3 bg-slate-800/70 hover:bg-slate-700/90 rounded-lg transition-colors text-slate-300 text-sm radial-glow">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-300 rounded-bl-none'}`} style={{ clipPath: msg.role === 'user' ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 80%, 10px 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 80%, calc(100% - 10px) 100%, 100% 100%, 0% 100%)' }}>
                            {msg.role === 'model' ? (
                                <InteractiveMessage text={msg.text} onNavigateToCodex={onNavigateToCodex} />
                            ) : (
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                
                 {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                     <div className="flex gap-3 justify-start">
                        <div className="max-w-xl p-3 rounded-2xl bg-slate-700 text-slate-300 rounded-bl-none">
                           <div className="flex items-center gap-2">
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span className="text-slate-400">V.E.R.S. is thinking...</span>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-700/50 flex-shrink-0">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask anything..."
                        rows={1}
                        className="w-full bg-slate-800 text-slate-200 rounded-xl p-3 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                        style={{ borderImage: 'linear-gradient(to right, #818cf8, #22d3ee) 1', borderWidth: '1px', borderStyle: 'solid', backgroundClip: 'padding-box' }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isLoading || !currentInput.trim()}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center transition-colors hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed radial-glow"
                        aria-label="Send message"
                    >
                        <ArrowUpIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};
