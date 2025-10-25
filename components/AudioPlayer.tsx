import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface AudioPlayerProps {
    audioSrc: string; // Can be a URL or a data URI
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const setAudioData = () => {
                setDuration(audio.duration);
                setCurrentTime(audio.currentTime);
                setIsLoading(false);
            };
            const setAudioTime = () => setCurrentTime(audio.currentTime);
            const handleLoadStart = () => setIsLoading(true);
            const handleEnded = () => setIsPlaying(false);

            audio.addEventListener('loadeddata', setAudioData);
            audio.addEventListener('timeupdate', setAudioTime);
            audio.addEventListener('loadstart', handleLoadStart);
            audio.addEventListener('ended', handleEnded);

            if (audio.readyState >= 2) {
                setAudioData();
            }

            return () => {
                audio.removeEventListener('loadeddata', setAudioData);
                audio.removeEventListener('timeupdate', setAudioTime);
                audio.removeEventListener('loadstart', handleLoadStart);
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, [audioSrc]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play();
        } else {
            audioRef.current?.pause();
        }
    }, [isPlaying]);
    
    const handleProgressChange = () => {
        if (audioRef.current && progressBarRef.current) {
            audioRef.current.currentTime = Number(progressBarRef.current.value);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const currentPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg w-full max-w-md">
            <audio ref={audioRef} src={audioSrc} preload="metadata" />
            <button onClick={() => setIsPlaying(!isPlaying)} disabled={isLoading} className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:bg-slate-600">
                {isLoading ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <div className="flex-1 flex items-center gap-3">
                <span className="text-sm text-slate-400 w-12 text-center">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    ref={progressBarRef}
                    value={currentTime}
                    step="0.01"
                    min="0"
                    max={duration}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer"
                    style={{ backgroundSize: `${currentPercentage}% 100%` }}
                />
                <span className="text-sm text-slate-400 w-12 text-center">{formatTime(duration)}</span>
            </div>
        </div>
    );
};
