import React, { useState, useRef, useEffect } from 'react';
import { EnergyCenterContent, Topic } from '../types';
import { ENERGY_CENTERS } from '../constants';
import { generateSpeechForText, decode, decodeAudioData } from '../services/geminiService';

import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ChipIcon } from './icons/ChipIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface ContentViewProps {
    content: EnergyCenterContent | null;
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    onSelectRelated: (topic: Topic) => void;
    onSelectView: (view: string) => void;
    onMobileBack: () => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="p-4 sm:p-6 md:p-8 animate-pulse w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1 space-y-4">
                <div className="aspect-square rounded-lg skeleton-shimmer"></div>
                <div className="h-8 rounded skeleton-shimmer w-3/4 mx-auto"></div>
                <div className="h-6 rounded skeleton-shimmer w-1/2 mx-auto"></div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                <div className="h-6 rounded skeleton-shimmer w-full"></div>
                <div className="h-6 rounded skeleton-shimmer w-5/6"></div>
                <div className="h-24 rounded skeleton-shimmer w-full mt-6"></div>
                <div className="h-24 rounded skeleton-shimmer w-full"></div>
            </div>
        </div>
    </div>
);

export const ContentView: React.FC<ContentViewProps> = ({ content, imageUrl, isLoading, error, onSelectRelated, onSelectView, onMobileBack }) => {
    const [isReading, setIsReading] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        // Cleanup audio on component unmount or when new content is loading
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleReadAloud = async (text: string) => {
        if (isReading) {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            setIsReading(false);
            return;
        }

        setIsReading(true);
        try {
            const audioData = await generateSpeechForText(text);
            if (audioData) {
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const ctx = audioContextRef.current;
                const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start();
                source.onended = () => setIsReading(false);
                audioSourceRef.current = source;
            } else {
                setIsReading(false);
            }
        } catch (err) {
            console.error("Failed to play audio", err);
            setIsReading(false);
        }
    };
    
    if (isLoading) return <SkeletonLoader />;
    if (error) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <ExclamationTriangleIcon className="w-12 h-12 text-rose-400 mb-4" />
            <h3 className="text-lg font-semibold text-rose-300">An Error Occurred</h3>
            <p className="text-slate-400 max-w-sm">{error}</p>
        </div>
    );
    if (!content) return null; // Should be handled by parent, but for type safety

    const InfoCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
        <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-cyan-300 mb-1">{title}</h4>
            <p className="text-slate-300">{value}</p>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto relative">
            <button
                onClick={onMobileBack}
                className="md:hidden absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-slate-800/70 p-2 pr-3 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:bg-slate-700/90 active:bg-slate-700"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                Back
            </button>
            <div className="p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Image & Titles) */}
                    <div className="lg:col-span-1 flex flex-col items-center text-center">
                        <div className="w-full max-w-sm aspect-square rounded-lg mb-4 relative overflow-hidden shadow-2xl shadow-black/50 bg-slate-900">
                             {imageUrl ? (
                                <img src={imageUrl} alt={`Art for ${content.title}`} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full skeleton-shimmer"></div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                             <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg"></div>
                        </div>
                        <h1 className="text-3xl font-bold font-display text-white">{content.title}</h1>
                        <h2 className="text-xl text-cyan-300 font-display">{content.sanskritName}</h2>
                    </div>

                    {/* Right Column (Details) */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <InfoCard title="Color" value={content.color} />
                            <InfoCard title="Element" value={content.element} />
                            <InfoCard title="Location" value={content.location} />
                        </div>
                        
                        <div className="space-y-6">
                             <div>
                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                    Purpose
                                    <button onClick={() => handleReadAloud(content.purpose)} className="text-slate-400 hover:text-cyan-300 transition-colors disabled:opacity-50" disabled={isReading && audioSourceRef.current?.buffer?.duration > 0}>
                                        {isReading ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SpeakerWaveIcon className="w-5 h-5" />}
                                    </button>
                                </h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{content.purpose}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Balanced State</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm bg-slate-800/40 p-3 rounded-md">{content.balancedState}</p>
                                </div>
                                 <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Unbalanced State</h3>
                                    <p className="text-slate-300 leading-relaxed text-sm bg-slate-800/40 p-3 rounded-md">{content.unbalancedState}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                    <BookOpenIcon className="w-5 h-5" />
                                    Practical Application
                                </h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/40 p-4 rounded-md text-sm">{content.practicalApplication}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                    <ChipIcon className="w-5 h-5" />
                                    Related Concepts
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {content.relatedConcepts.map(concept => {
                                        const relatedTopic = ENERGY_CENTERS.find(t => t.cleanedName === concept || t.name === concept);
                                        return (
                                            <button
                                                key={concept}
                                                onClick={() => relatedTopic ? onSelectRelated(relatedTopic) : onSelectView('inquiry')}
                                                className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-full text-sm hover:bg-slate-600/70 hover:text-white transition-colors radial-glow"
                                            >
                                                {concept}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
