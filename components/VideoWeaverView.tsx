import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateVideoFromImage } from '../services/geminiService';
import { PhotoIcon } from './icons/PhotoIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

const PREVIEW_PROMPTS = [
    "A mystical forest where the trees glow with soft, ethereal light.",
    "The camera pans across a vast, alien desert under a binary sunset.",
    "A close-up of a single water droplet hitting a still pool, creating intricate ripples.",
    "An abstract animation of geometric shapes morphing and evolving.",
];

export const VideoWeaverView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const checkApiKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
            return hasKey;
        }
        // If aistudio is not available, assume key is present via environment for local dev
        return true; 
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume key selection is successful to avoid race conditions.
            setApiKeySelected(true);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage({ file, dataUrl: e.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!image || !prompt) {
            setError('Please provide both an image and a prompt.');
            return;
        }

        const hasKey = await checkApiKey();
        if (!hasKey) {
            handleSelectKey();
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setProgressMessage('');

        try {
            const base64Data = image.dataUrl.split(',')[1];
            const mimeType = image.file.type;
            const videoUrl = await generateVideoFromImage(prompt, base64Data, mimeType, aspectRatio, setProgressMessage);
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
            console.error(err);
            let errorMessage = "An unknown error occurred during video generation.";
            if (err.message) {
                 if (err.message.includes("Requested entity was not found")) {
                    errorMessage = "API Key not found or invalid. Please select a valid key.";
                    setApiKeySelected(false); // Reset key state
                } else {
                    errorMessage = err.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };

    const handleTryAgain = () => {
        setError(null);
        setGeneratedVideoUrl(null);
    };

    const isGenerateDisabled = isLoading || !prompt || !image;

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto">
            <header className="p-4 border-b border-slate-700/50 flex-shrink-0 flex items-center gap-3">
                <VideoCameraIcon className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl font-semibold text-white font-display">Alchemical Animator</h2>
            </header>

            <div className="flex-1 p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Controls */}
                <div className="flex flex-col gap-6">
                     {!apiKeySelected && (
                        <div className="bg-amber-900/50 border border-amber-600/70 p-4 rounded-lg text-amber-200">
                             <h3 className="font-semibold flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5"/>API Key Required</h3>
                             <p className="text-sm mt-1">Video generation requires a Google AI API key. Please select a key to proceed. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Learn about billing.</a></p>
                             <button onClick={handleSelectKey} className="mt-3 px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded-md hover:bg-amber-400 transition-colors text-sm">Select API Key</button>
                        </div>
                    )}

                    <div>
                        <label htmlFor="image-upload" className="block text-lg font-semibold text-white mb-2">1. Starting Image</label>
                        <div 
                            className={`aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 transition-colors ${image ? 'border-rose-400/50' : 'border-slate-600 hover:border-slate-500'}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } } as any); }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <input ref={fileInputRef} id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            {image ? (
                                <img src={image.dataUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md" />
                            ) : (
                                <div className="text-slate-400 cursor-pointer">
                                    <PhotoIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="font-semibold">Click to upload or drag & drop</p>
                                    <p className="text-xs">PNG, JPG, WEBP, etc.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="prompt" className="block text-lg font-semibold text-white mb-2">2. Animation Prompt</label>
                        <textarea
                            id="prompt"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A gentle breeze rustles the leaves as the sun sets."
                            className="w-full bg-slate-800 text-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                        />
                    </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PREVIEW_PROMPTS.slice(0, 4).map(p => (
                            <button key={p} onClick={() => setPrompt(p)} className="text-xs text-left p-2 bg-slate-800/70 hover:bg-slate-700/90 rounded-md transition-colors text-slate-400">
                                {p}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-white mb-2">3. Aspect Ratio</label>
                        <div className="flex gap-4">
                            {['16:9', '9:16'].map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio as '16:9' | '9:16')} className={`px-4 py-2 rounded-md transition-colors ${aspectRatio === ratio ? 'bg-rose-500 text-white font-semibold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full py-3 bg-rose-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-rose-500 disabled:bg-slate-600 disabled:cursor-not-allowed radial-glow-rose"
                    >
                        {isLoading ? <><SpinnerIcon className="w-5 h-5 animate-spin" /> Weaving Video...</> : <><SparklesIcon className="w-5 h-5" /> Generate</>}
                    </button>
                </div>

                {/* Right Side - Output */}
                <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-lg p-4 h-[50vh] lg:h-full">
                    {isLoading ? (
                        <div className="text-center">
                            <SpinnerIcon className="w-12 h-12 text-rose-400 animate-spin mx-auto" />
                            <p className="mt-4 text-lg font-semibold text-white">{progressMessage || 'Preparing the animation...'}</p>
                            <p className="text-slate-400">This can take a few minutes. Please be patient.</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-rose-300 max-w-sm">
                            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Generation Failed</h3>
                            <p className="text-sm text-rose-400 mt-1">{error}</p>
                            <button onClick={handleTryAgain} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-400 transition-colors">
                                Try Again
                            </button>
                        </div>
                    ) : generatedVideoUrl ? (
                         <video src={generatedVideoUrl} controls autoPlay loop className="max-h-full max-w-full rounded-md" />
                    ) : (
                        <div className="text-center text-slate-500">
                             <VideoCameraIcon className="w-16 h-16 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-300">Your Animated Vision</h3>
                            <p className="max-w-xs mt-1">Your generated video will appear here once it's created.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
