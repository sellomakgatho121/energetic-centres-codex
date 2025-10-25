import React from 'react';
import { CodexIcon } from './icons/CodexIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { VersIcon } from './icons/VersIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

type View = 'codex' | 'inquiry' | 'live' | 'weaver';

interface OrbitalNavProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const navItems = [
    { id: 'codex', name: 'Codex Explorer', icon: CodexIcon },
    { id: 'inquiry', name: 'Deep Inquiry', icon: BrainCircuitIcon },
    { id: 'live', name: 'V.E.R.S. Live', icon: VersIcon },
    { id: 'weaver', name: 'Alchemical Animator', icon: VideoCameraIcon },
];

const iconColorClasses = {
    codex: 'text-cyan-400 group-hover:text-cyan-300',
    inquiry: 'text-indigo-400 group-hover:text-indigo-300',
    live: 'text-purple-400 group-hover:text-purple-300',
    weaver: 'text-rose-400 group-hover:text-rose-300',
};

const activeRingClasses = {
    codex: 'ring-cyan-400/50',
    inquiry: 'ring-indigo-400/50',
    live: 'ring-purple-400/50',
    weaver: 'ring-rose-400/50',
};

export const OrbitalNav: React.FC<OrbitalNavProps> = ({ currentView, onViewChange }) => {
    return (
        <nav className="h-full w-20 bg-slate-900/30 border-r border-slate-700/50 flex flex-col items-center justify-center gap-6 p-4">
            {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                const colorClass = iconColorClasses[item.id as keyof typeof iconColorClasses];
                const ringClass = activeRingClasses[item.id as keyof typeof activeRingClasses];

                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id as View)}
                        className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none
                            ${isActive ? `bg-slate-700/80 ring-2 ${ringClass}` : 'bg-slate-800/50 hover:bg-slate-700/70'}`
                        }
                        aria-label={item.name}
                        title={item.name}
                    >
                        <Icon className={`w-7 h-7 transition-colors ${colorClass}`} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 text-sm bg-slate-800 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {item.name}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
